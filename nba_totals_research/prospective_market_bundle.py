"""Freeze predictions and exact quote/source bytes before scheduled start.

Local hashes are never described as immutable storage. Archive with the existing
RFC3161 + Object Lock adapter, then verify actual start separately. Research only.
"""
from __future__ import annotations
import hashlib
import json
import math
from datetime import datetime, timedelta, timezone
from pathlib import Path


def utc(value):
    dt = datetime.fromisoformat(value.replace('Z', '+00:00')) if isinstance(value, str) else value
    if not isinstance(dt, datetime) or dt.tzinfo is None or dt.utcoffset() is None:
        raise ValueError('Timezone-aware timestamp required')
    return dt.astimezone(timezone.utc)


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def prepare_bundle(*, event, predictions, quotes, blobs, now, max_quote_age_seconds=120):
    """Pure preparation. Does not attest time, place bets, or admit evaluation."""
    now = utc(now)
    if not isinstance(max_quote_age_seconds, int) or not 1 <= max_quote_age_seconds <= 300:
        raise ValueError('Quote age policy outside 1..300 seconds')
    game = event['game_id']
    cutoff = utc(event['scheduled_start_utc'])
    if not game or now >= cutoff:
        raise ValueError('Capture must precede scheduled start')
    if event.get('actual_start_utc') is not None:
        raise ValueError('Known started event cannot be captured prospectively')
    if event.get('state') != 'PRE_GAME':
        raise ValueError('Observed PRE_GAME state required')
    state_at = utc(event['state_observed_at_utc'])
    if not now - timedelta(seconds=max_quote_age_seconds) <= state_at <= now:
        raise ValueError('Missing fresh event state')
    required = {'model', 'training_manifest', 'features', 'event_state_raw', 'mapping'}
    if not required <= blobs.keys() or not predictions or not quotes:
        raise ValueError('Required artifacts, forecasts and quotes missing')
    for key, raw in blobs.items():
        if not key or not all(c.isalnum() or c in '_-' for c in key) or not isinstance(raw, bytes) or not raw:
            raise ValueError('Unsafe artifact key or empty artifact bytes')
    if event.get('raw_retention_approved') is not True:
        raise ValueError('Raw retention must be approved before archive')
    # Caller-supplied metadata is bound to exact original bytes, never backfilled.
    training = json.loads(blobs['training_manifest'])
    if utc(training['training_data_end_utc']) > now:
        raise ValueError('Training cutoff is in the future')
    if training['model_sha256'] != sha(blobs['model']):
        raise ValueError('Training manifest/model mismatch')
    keys = set()
    for kind, records in [('prediction', predictions), ('quote', quotes)]:
        for row in records:
            if row['game_id'] != game or not row['source_url'] or not row['source_record_id']:
                raise ValueError('Missing or mismatched source identity')
            key = (kind, row['period'], row['market_type'], row.get('subject_team'), row['selection'], row['line'])
            if key in keys:
                raise ValueError('Duplicate event/period/market/selection/line')
            keys.add(key)
            if not math.isfinite(row['line']):
                raise ValueError('Invalid line')
            source_blob = row['raw_artifact_key']
            if source_blob not in blobs or row['raw_sha256'] != sha(blobs[source_blob]):
                raise ValueError('Source artifact hash mismatch')
            if kind == 'prediction':
                generated = utc(row['prediction_created_at_utc'])
                if not utc(training['training_data_end_utc']) <= utc(row['features_as_of_utc']) <= generated <= now:
                    raise ValueError('Forecast training/features/time ordering invalid')
                if row['model_sha256'] != sha(blobs['model']):
                    raise ValueError('Prediction/model mismatch')
                probs = [row[k] for k in ('p_win', 'p_push', 'p_loss')]
                if any(not math.isfinite(x) or not 0 <= x <= 1 for x in probs) or abs(sum(probs)-1) > 1e-9:
                    raise ValueError('Invalid probability mass')
            else:
                fetched, updated = utc(row['fetched_at_utc']), utc(row['market_last_update_utc'])
                published = utc(row['bookmaker_last_update_utc'])
                if not now - timedelta(seconds=max_quote_age_seconds) <= updated <= fetched <= now:
                    raise ValueError('Stale quote or invalid original timestamps')
                if not now - timedelta(seconds=max_quote_age_seconds) <= published <= fetched:
                    raise ValueError('Stale bookmaker timestamp')
                if not math.isfinite(row['decimal_odds']) or row['decimal_odds'] <= 1:
                    raise ValueError('Invalid odds')
    payloads = dict(blobs)
    payloads.update(event=canonical(event), predictions=canonical(predictions), quotes=canonical(quotes))
    # A name collision must not silently discard an original artifact.
    if set(blobs) & {'event', 'predictions', 'quotes', 'bundle_manifest'}:
        raise ValueError('Reserved artifact key')
    manifest = {'schema': 1, 'game_id': game, 'captured_at_host_utc': now.isoformat(),
                'scheduled_start_utc': cutoff.isoformat(), 'actual_start_utc': None,
                'artifacts': {k: {'sha256': sha(v), 'size': len(v)} for k,v in sorted(payloads.items())},
                'n_predictions': len(predictions), 'n_quotes': len(quotes),
                'evaluation_eligible': False, 'publication_allowed': False,
                'state': 'LOCAL_ONLY_NOT_TIMESTAMPED_NOT_IMMUTABLE'}
    payloads['bundle_manifest'] = canonical(manifest)
    return payloads


def archive_bundle(payloads, *, workdir, tsa_url, tsa_ca, tsa_signer,
                   s3_client, bucket, retain_until, clock=None):
    """Real external adapters. Completion written last; never rewrites evidence.

    Verification is only temporal/content/retention. Model OOS, source rights,
    actual kickoff, source authenticity and settlement remain separate gates.
    """
    from .rfc3161_timestamp import timestamp_digest
    from .forward_pipeline import put_object_lock, tsa_signed_time
    now = clock or (lambda: datetime.now(timezone.utc))
    manifest = json.loads(payloads['bundle_manifest'])
    expected = set(manifest['artifacts']) | {'bundle_manifest'}
    if set(payloads) != expected:
        raise ValueError('Unexpected or missing bundle artifact')
    if any(not k or not all(c.isalnum() or c in '_-' for c in k) for k in payloads):
        raise ValueError('Unsafe artifact key')
    for k, meta in manifest['artifacts'].items():
        if sha(payloads[k]) != meta['sha256'] or len(payloads[k]) != meta['size']:
            raise ValueError('Bundle changed before timestamp')
    cutoff = utc(manifest['scheduled_start_utc'])
    if not utc(manifest['captured_at_host_utc']) <= utc(now()) < cutoff:
        raise ValueError('Archive window closed or clock moved backward')
    digest = sha(payloads['bundle_manifest'])
    path = Path(workdir) / digest
    if path.is_symlink():
        raise ValueError('Symlink output refused')
    path.mkdir(parents=True, exist_ok=False)
    for key, raw in payloads.items():
        with (path / key).open('xb') as f:
            f.write(raw)
    token = timestamp_digest(digest, path/'tsa', tsa_url=tsa_url,
                             ca_file=tsa_ca, signer_file=tsa_signer)
    if token.get('rfc3161_verified') is not True or token.get('raw_sha256') != digest:
        raise ValueError('External timestamp not verified')
    signed = tsa_signed_time((path/'tsa/timestamp-audit.json').read_bytes())
    if not utc(manifest['captured_at_host_utc']).replace(microsecond=0) <= signed < cutoff:
        raise ValueError('Signed time outside capture window')
    objects = dict(payloads)
    for name in ('request.tsq','response.tsr','timestamp-audit.json'):
        objects['tsa_'+name] = (path/'tsa'/name).read_bytes()
    archived = {}
    for name, raw in objects.items():
        if utc(now()) >= cutoff:
            raise ValueError('Archive did not complete before scheduled start')
        pointer = put_object_lock(s3_client,bucket=bucket,key=f'nba-evidence/{digest}/{name}',
                                  raw=raw,retain_until=retain_until)
        head = s3_client.head_object(Bucket=bucket,Key=pointer['key'],VersionId=pointer['version_id'])
        if not signed <= utc(head['LastModified']) < cutoff:
            raise ValueError('Object server timestamp outside archive window')
        pointer['stored_at_server_utc'] = utc(head['LastModified']).isoformat()
        archived[name] = pointer
    completion = {'schema':1,'bundle_sha256':digest,'game_id':manifest['game_id'],
                  'tsa_signed_at_utc':signed.isoformat(),'objects':archived,
                  'actual_start_utc':None,'actual_start_verified':False,
                  'state':'ARCHIVED_PENDING_ACTUAL_START_AND_OOS_VERIFICATION',
                  'evaluation_eligible':False,'publication_allowed':False}
    if utc(now()) >= cutoff:
        raise ValueError('Completion window closed')
    raw = canonical(completion)
    pointer = put_object_lock(s3_client,bucket=bucket,key=f'nba-evidence/{digest}/completion.json',
                              raw=raw,retain_until=retain_until)
    head = s3_client.head_object(Bucket=bucket,Key=pointer['key'],VersionId=pointer['version_id'])
    if not signed <= utc(head['LastModified']) < cutoff:
        raise ValueError('Completion server timestamp not pre-schedule')
    pointer['stored_at_server_utc'] = utc(head['LastModified']).isoformat()
    return {'completion':pointer,'evaluation_eligible':False,'publication_allowed':False,
            'state':completion['state']}
