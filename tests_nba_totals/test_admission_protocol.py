import copy
import json
import unittest
from nba_totals_research.prospective_market_bundle import canonical,sha
from nba_totals_research.admission_protocol import history_audit,select_version,join_markets


class AdmissionTests(unittest.TestCase):
    def setUp(self):
        self.proofs={}
        self.policy=canonical({'rule':'last_accepted_strictly_before_frozen_cutoff',
            'effective_from_utc':'2026-11-06T00:00:00Z','cutoff_minutes_before_first_schedule':60,
            'tie_rule':'reject_ambiguous_latest'})
        self.proofs['policy']={'bound_sha256':sha(self.policy),'attested_at_utc':'2026-11-05T04:00:00Z'}
        self.event={'canonical_event_id':'nba:test','first_recorded_scheduled_start_utc':'2026-11-06T03:00:00Z',
                    'selection_cutoff_utc':'2026-11-06T02:00:00Z','cutoff_evidence_ref':'event'}
        self.proofs['event']={'bound_sha256':sha(canonical(self.event)),'attested_at_utc':'2026-11-05T12:00:00Z'}
        self.registry=[]
        for provider,game in [('ESPN','123'),('Pinnacle','456')]:
            m={'provider':provider,'source_event_id':game,'canonical_event_id':'nba:test',
               'away_team_id':'DAL','home_team_id':'SAS','evidence_ref':provider}
            self.registry.append(m)
            self.proofs[provider]={'bound_sha256':sha(canonical(m)),'identity_verified':True}

    def verify(self,ref,raw):return self.proofs[ref]
    def row(self,identity,time):
        r={'prediction_id':identity,'prediction_created_at_utc':time,'canonical_event_id':'nba:test'}
        raw=canonical(r);r.update(original_bytes=raw,acceptance_evidence_ref=identity)
        self.proofs[identity]={'bound_sha256':sha(raw),'attested_at_utc':time,'accepted_at_utc':time,'accepted':True}
        return r
    def select(self,rows):
        return select_version(rows,policy_bytes=self.policy,policy_evidence_ref='policy',event=self.event,verify=self.verify)

    def test_history_missing_cannot_be_rescued_by_48_hour_lag(self):
        pred={'generated_at_host_utc':'2026-11-06T00:00:00Z','history_source_game_ids':{'DAL':['123']}}
        report=history_audit(pred,[],features_as_of_utc='2026-11-05T00:00:00Z',verify=self.verify)
        self.assertFalse(report['history_evidence_complete']);self.assertEqual(report['passed'],0)

    def test_late_or_changed_source_version_blocked(self):
        pred={'generated_at_host_utc':'2026-11-06T00:00:00Z','history_source_game_ids':{'DAL':['123']}}
        obs={'team':'DAL','source_game_id':'123','raw_bytes':b'original','raw_sha256':sha(b'original'),
             'evidence_ref':'source','fetched_at_utc':'2026-11-04T00:00:00Z','completed_at_utc':'2026-11-03T00:00:00Z'}
        self.proofs['source']={'bound_sha256':sha(b'original'),'source_authenticated':True,
                              'immutable_retention_verified':True,'attested_at_utc':'2026-11-05T01:00:00Z','source_record_id':'123'}
        self.assertFalse(history_audit(pred,[obs],features_as_of_utc='2026-11-05T00:00:00Z',verify=self.verify)['history_evidence_complete'])
        self.proofs['source']['attested_at_utc']='2026-11-04T00:01:00Z'
        self.assertTrue(history_audit(pred,[obs],features_as_of_utc='2026-11-05T00:00:00Z',verify=self.verify)['history_evidence_complete'])
        obs['raw_bytes']=b'revised'
        self.assertFalse(history_audit(pred,[obs],features_as_of_utc='2026-11-05T00:00:00Z',verify=self.verify)['history_evidence_complete'])

    def test_latest_accepted_before_cutoff_independent_of_input_order(self):
        a=self.row('a','2026-11-06T00:30:00Z');b=self.row('b','2026-11-06T01:30:00Z')
        self.assertEqual(self.select([a,b])['selected_prediction_id'],'b')
        self.assertEqual(self.select([b,a])['selected_prediction_id'],'b')

    def test_at_cutoff_late_or_unaccepted_versions_not_selected(self):
        a=self.row('a','2026-11-06T01:00:00Z');b=self.row('b','2026-11-06T02:00:00Z')
        c=self.row('c','2026-11-06T01:59:00Z');self.proofs['c']['accepted']=False
        self.assertEqual(self.select([b,c,a])['selected_prediction_id'],'a')

    def test_retrospective_policy_and_moved_cutoff_rejected(self):
        a=self.row('a','2026-11-06T01:00:00Z')
        self.event['first_recorded_scheduled_start_utc']='2026-11-05T03:00:00Z'
        with self.assertRaises(ValueError):self.select([a])
        self.event['first_recorded_scheduled_start_utc']='2026-11-06T03:00:00Z'
        self.event['selection_cutoff_utc']='2026-11-06T02:10:00Z'
        with self.assertRaises(ValueError):self.select([a])

    def test_tied_latest_rejected_and_empty_returns_no_selection(self):
        self.assertIsNone(self.select([])['selected_prediction_id'])
        a=self.row('a','2026-11-06T01:00:00Z');b=self.row('b','2026-11-06T01:00:00Z')
        with self.assertRaises(ValueError):self.select([a,b])

    def test_metadata_cannot_change_attested_creation_time(self):
        a=self.row('a','2026-11-06T01:00:00Z');a['prediction_created_at_utc']='2026-11-06T01:59:00Z'
        with self.assertRaises(ValueError):self.select([a])

    def market(self,provider,game,order):
        return {'provider':provider,'source_event_id':game,'participant_team_ids':order,
                'market_type':'total','period':'full_game','selection':'over','line':226.5}

    def test_reversed_display_order_joins_by_canonical_id(self):
        a=self.market('ESPN','123',['DAL','SAS']);b=self.market('Pinnacle','456',['SAS','DAL'])
        self.assertEqual(len(join_markets([a],[b],self.registry,verify=self.verify)['pairs']),1)

    def test_wrong_id_not_fuzzy_matched_by_team_names(self):
        a=self.market('ESPN','999',['DAL','SAS']);b=self.market('Pinnacle','456',['DAL','SAS'])
        with self.assertRaises(ValueError):join_markets([a],[b],self.registry,verify=self.verify)

    def test_wrong_explicit_role_or_ambiguous_mapping_rejected(self):
        a=self.market('ESPN','123',['DAL','SAS']);b=self.market('Pinnacle','456',['DAL','SAS'])
        b['home_team_id']='DAL'
        with self.assertRaises(ValueError):join_markets([a],[b],self.registry,verify=self.verify)
        del b['home_team_id'];self.registry.append(copy.deepcopy(self.registry[0]))
        with self.assertRaises(ValueError):join_markets([a],[b],self.registry,verify=self.verify)

    def test_period_and_line_must_match_exactly(self):
        a=self.market('ESPN','123',['DAL','SAS']);b=self.market('Pinnacle','456',['DAL','SAS'])
        b['period']='first_half'
        self.assertEqual(join_markets([a],[b],self.registry,verify=self.verify)['pairs'],[])
        b['period']='full_game';b['line']=227
        self.assertEqual(join_markets([a],[b],self.registry,verify=self.verify)['pairs'],[])


if __name__=='__main__':unittest.main()
