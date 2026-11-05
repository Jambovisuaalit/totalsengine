"""Point-in-time history, prospective version selection and canonical joins.

Evidence verification is injected by a trusted verifier, never a row boolean.
These checks cannot grant OOS, rights or publication eligibility on their own.
"""
from decimal import Decimal, InvalidOperation
import json
from .prospective_market_bundle import sha, canonical, utc


def history_audit(prediction, observations, *, features_as_of_utc, verify):
    """No 48h heuristic: every used source version needs original bytes/proof."""
    cutoff=utc(features_as_of_utc)
    if cutoff>utc(prediction['generated_at_host_utc']):
        raise ValueError('Features are later than original prediction')
    expected={(team,str(game)) for team,games in prediction['history_source_game_ids'].items() for game in games}
    if not expected:
        raise ValueError('History lineage is empty')
    index={};findings=[]
    for o in observations:
        key=(o['team'],str(o['source_game_id']))
        if key in index: raise ValueError('Ambiguous source version')
        index[key]=o
    for key in sorted(expected):
        o=index.get(key);reason=None
        try:
            if o is None: raise ValueError('ORIGINAL_SOURCE_OBSERVATION_MISSING')
            raw=o['raw_bytes']
            if not isinstance(raw,bytes) or not raw or sha(raw)!=o['raw_sha256']:
                raise ValueError('SOURCE_BYTES_HASH_MISMATCH')
            proof=verify(o['evidence_ref'],raw)
            if proof['bound_sha256']!=sha(raw) or proof['source_authenticated'] is not True:
                raise ValueError('SOURCE_AUTHENTICITY_NOT_VERIFIED')
            if proof['immutable_retention_verified'] is not True:
                raise ValueError('ORIGINAL_SOURCE_NOT_IMMUTABLY_RETAINED')
            if not utc(o['fetched_at_utc'])<=utc(proof['attested_at_utc'])<=cutoff:
                raise ValueError('SOURCE_VERSION_NOT_PROVEN_AVAILABLE_AT_FEATURE_CUTOFF')
            if utc(o['completed_at_utc'])>cutoff:
                raise ValueError('RESULT_NOT_FINAL_AT_FEATURE_CUTOFF')
            if proof['source_record_id']!=str(o['source_game_id']):
                raise ValueError('SOURCE_RECORD_ID_MISMATCH')
        except (KeyError,TypeError,ValueError) as exc:
            reason=str(exc)
        findings.append({'team':key[0],'source_game_id':key[1],
                         'point_in_time_pass':reason is None,'reason':reason})
    return {'required_observations':len(expected),'passed':sum(x['point_in_time_pass'] for x in findings),
            'history_evidence_complete':all(x['point_in_time_pass'] for x in findings),
            'findings':findings,'evaluation_eligible':False,'publication_allowed':False}


def select_version(rows, *, policy_bytes, policy_evidence_ref, event, verify):
    """Last externally accepted prediction strictly before frozen cutoff.

    Event schedule/cutoff must be precommitted, not recomputed after a change.
    Historical cohorts before policy effective time cannot be admitted.
    """
    p=json.loads(policy_bytes);policy_proof=verify(policy_evidence_ref,policy_bytes)
    if policy_proof['bound_sha256']!=sha(policy_bytes):
        raise ValueError('Policy proof mismatch')
    if p['rule']!='last_accepted_strictly_before_frozen_cutoff':
        raise ValueError('Unsupported version-selection rule')
    if p['cutoff_minutes_before_first_schedule']!=60:
        raise ValueError('Unsupported cutoff policy')
    effective,cutoff=utc(p['effective_from_utc']),utc(event['selection_cutoff_utc'])
    schedule=utc(event['first_recorded_scheduled_start_utc'])
    from datetime import timedelta
    if schedule<effective or utc(policy_proof['attested_at_utc'])>=cutoff:
        raise ValueError('Policy cannot be applied retrospectively')
    if cutoff!=schedule-timedelta(minutes=p['cutoff_minutes_before_first_schedule']):
        raise ValueError('Cutoff differs from predeclared rule')
    event_raw=canonical(event)
    event_proof=verify(event['cutoff_evidence_ref'],event_raw)
    if event_proof['bound_sha256']!=sha(event_raw) or utc(event_proof['attested_at_utc'])>=cutoff:
        raise ValueError('Event cutoff was not frozen prospectively')
    if p['tie_rule']!='reject_ambiguous_latest':
        raise ValueError('Unsupported tie rule')
    accepted=[];seen={}
    for row in rows:
        original=json.loads(row['original_bytes'])
        if any(original.get(k)!=row[k] for k in ('prediction_id','prediction_created_at_utc','canonical_event_id')):
            raise ValueError('Selection metadata differs from attested original bytes')
        if row['canonical_event_id']!=event['canonical_event_id']:
            raise ValueError('Cross-event forecast versions')
        digest=sha(row['original_bytes']);identity=row['prediction_id']
        if identity in seen:
            if seen[identity]!=digest: raise ValueError('Conflicting prediction ID')
            continue
        seen[identity]=digest
        evidence=verify(row['acceptance_evidence_ref'],row['original_bytes'])
        created=utc(row['prediction_created_at_utc']);accepted_at=utc(evidence['accepted_at_utc'])
        if evidence['bound_sha256']!=digest:
            raise ValueError('Prediction acceptance proof mismatch')
        # Accept only the trusted verifier's decision, never row['approved'].
        if (evidence['accepted'] is True and created<=utc(evidence['attested_at_utc'])<=accepted_at<cutoff):
            accepted.append((created,identity,digest))
    if not accepted:
        return {'selected_prediction_id':None,'reason':'NO_ACCEPTED_PRE_CUTOFF_VERSION'}
    latest=max(x[0] for x in accepted);winners=[x for x in accepted if x[0]==latest]
    if len(winners)!=1: raise ValueError('Ambiguous latest prediction time')
    return {'selected_prediction_id':winners[0][1],'prediction_sha256':winners[0][2],
            'policy_sha256':sha(policy_bytes),'cutoff_utc':cutoff.isoformat(),
            'evaluation_eligible':False,'publication_allowed':False}


def canonical_market_key(row, registry, *, verify):
    """Registry key is provider + provider event ID, never display order."""
    provider_key=(row['provider'],str(row['source_event_id']))
    matches=[x for x in registry if (x['provider'],str(x['source_event_id']))==provider_key]
    if len(matches)!=1: raise ValueError('Missing or ambiguous canonical mapping')
    mapping=matches[0];proof=verify(mapping['evidence_ref'],canonical(mapping))
    if proof['bound_sha256']!=sha(canonical(mapping)) or proof['identity_verified'] is not True:
        raise ValueError('Canonical mapping not independently verified')
    cid=mapping['canonical_event_id']
    if not cid or row.get('canonical_event_id',cid)!=cid:
        raise ValueError('Conflicting canonical event ID')
    away,home=mapping['away_team_id'],mapping['home_team_id']
    if any(x['canonical_event_id']==cid and (x['away_team_id'],x['home_team_id'])!=(away,home) for x in registry):
        raise ValueError('Canonical mapping home/away conflict across providers')
    if away==home or set(row['participant_team_ids'])!={away,home}:
        raise ValueError('Participant identity mismatch')
    for role in ('away','home'):
        if role+'_team_id' in row and row[role+'_team_id']!=mapping[role+'_team_id']:
            raise ValueError('Explicit home/away role mismatch')
    try: line=Decimal(str(row['line']))
    except InvalidOperation as exc: raise ValueError('Invalid line') from exc
    if not line.is_finite(): raise ValueError('Invalid line')
    subject=row.get('subject_team_id');selection=row['selection']
    if row['market_type']=='spread':
        if selection not in {away,home}: raise ValueError('Spread needs team ID, not position')
    elif row['market_type'] in {'total','team_total'}:
        if selection not in {'over','under'}: raise ValueError('Invalid totals selection')
        if row['market_type']=='team_total' and subject not in {away,home}:
            raise ValueError('Team total needs team ID')
        if row['market_type']=='total' and subject is not None:
            raise ValueError('Game total has no subject team')
    else: raise ValueError('Unsupported market type')
    return (cid,row['period'],row['market_type'],subject,selection,str(line.normalize()))


def join_markets(predictions,quotes,registry,*,verify):
    def index(rows):
        result={}
        for row in rows:
            key=canonical_market_key(row,registry,verify=verify)
            if key in result: raise ValueError('Duplicate canonical market key')
            result[key]=row
        return result
    p,q=index(predictions),index(quotes)
    return {'pairs':[{'key':k,'prediction':p[k],'quote':q[k]} for k in p if k in q],
            'unmatched_predictions':[k for k in p if k not in q],
            'unmatched_quotes':[k for k in q if k not in p],
            'evaluation_eligible':False,'publication_allowed':False}
