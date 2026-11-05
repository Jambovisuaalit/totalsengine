import copy
import base64
import json
import unittest
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
from datetime import datetime, timezone
from nba_totals_research.prospective_market_bundle import prepare_bundle, archive_bundle, sha


class ProspectiveCaptureTests(unittest.TestCase):
    def setUp(self):
        self.now=datetime(2026,11,6,1,0,tzinfo=timezone.utc)
        self.blobs={'model':b'baseline specification, not trained weights',
                    'features':b'point in time feature bytes',
                    'event_state_raw':b'original provider pregame response',
                    'mapping':b'explicit source ID mapping',
                    'prediction_raw':b'original prediction bytes',
                    'quote_raw':b'original atomic provider quote response'}
        self.blobs['training_manifest']=json.dumps({'training_data_end_utc':'2026-11-04T00:00:00Z',
                                                    'model_sha256':sha(self.blobs['model'])}).encode()
        # Each selected history game keeps exact original ESPN response bytes.
        self.hist=[]
        for i in range(6):
            gid=str(1000+i)
            raw=json.dumps({'events':[{'id':gid,'date':'2026-10-25T02:00:00Z',
                'status':{'type':{'completed':True}},
                'competitions':[{'competitors':[{'homeAway':'home','score':'110'},
                                              {'homeAway':'away','score':'105'}]}]}]}).encode()
            key=f'history_raw_{i}'
            self.blobs[key]=raw
            ledger_raw=json.dumps({'schema':1,'source_game_id':gid,
                'source_url':'https://provider.example/scoreboard',
                'fetched_at_utc':'2026-11-05T21:59:00Z',
                'raw_sha256':sha(raw),'raw_b64':base64.b64encode(raw).decode(),
                'source_first_published_at_utc':None},sort_keys=True,separators=(',',':')).encode()
            self.blobs[f'ledger_raw_{i}']=ledger_raw
            self.hist.append({'source_game_id':gid,'raw_artifact_key':key,
                'raw_sha256':sha(raw),'fetched_at_utc':'2026-11-05T22:00:00Z',
                'first_final_observed_at_utc':'2026-11-05T21:59:01Z',
                'immutable_first_final_ref':{'bucket':'synthetic',
                    'key':f'nba-history-first-final/{gid}/first.json',
                    'version_id':'v1','sha256':sha(ledger_raw),
                    'stored_at_server_utc':'2026-11-05T21:59:01Z'},
                'immutable_archive_ref':{'bucket':'synthetic','key':f'history/{gid}',
                    'version_id':'v1','sha256':sha(raw),
                    'stored_at_server_utc':'2026-11-05T22:00:01Z'}})
        self.event={'game_id':'0022600200','scheduled_start_utc':'2026-11-06T02:00:00Z',
                    'actual_start_utc':None,'state':'PRE_GAME','state_observed_at_utc':'2026-11-06T00:59:59Z',
                    'raw_retention_approved':True}
        base={'game_id':self.event['game_id'],'source_url':'https://provider.example/source',
              'source_record_id':'original-123','period':'full_game','market_type':'total',
              'selection':'over','line':225.5}
        self.pred=[dict(base,raw_artifact_key='prediction_raw',raw_sha256=sha(self.blobs['prediction_raw']),
                        prediction_created_at_utc='2026-11-06T00:59:58Z',features_as_of_utc='2026-11-05T23:00:00Z',
                        model_sha256=sha(self.blobs['model']),
                        history_source_game_ids={'dal':['1000','1001','1002'],'sa':['1003','1004','1005']},p_win=.52,p_push=0,p_loss=.48)]
        self.quotes=[dict(base,raw_artifact_key='quote_raw',raw_sha256=sha(self.blobs['quote_raw']),
                          fetched_at_utc='2026-11-06T00:59:59Z',market_last_update_utc='2026-11-06T00:59:50Z',
                          bookmaker_last_update_utc='2026-11-06T00:59:50Z',decimal_odds=1.95)]

    def run_capture(self):
        return prepare_bundle(event=self.event,predictions=self.pred,quotes=self.quotes,
                              blobs=self.blobs,now=self.now,history_evidence=self.hist)

    def test_history_missing_or_wrong_final_blocks(self):
        self.hist.pop()
        with self.assertRaises(ValueError): self.run_capture()
        self.setUp()
        self.blobs['history_raw_0']=self.blobs['history_raw_0'].replace(b'true',b'false')
        self.hist[0]['raw_sha256']=sha(self.blobs['history_raw_0'])
        self.hist[0]['immutable_archive_ref']['sha256']=sha(self.blobs['history_raw_0'])
        with self.assertRaises(ValueError): self.run_capture()

    def test_history_future_or_unarchived_blocks(self):
        self.hist[0]['fetched_at_utc']='2026-11-06T00:00:00Z'
        with self.assertRaises(ValueError): self.run_capture()
        self.hist[0]['fetched_at_utc']='2026-11-05T22:00:00Z'
        self.hist[0].pop('immutable_archive_ref')
        with self.assertRaises(ValueError): self.run_capture()

    def test_selected_history_must_match_evidence(self):
        self.pred[0]['history_source_game_ids']['dal'][0]='other'
        with self.assertRaises(ValueError): self.run_capture()

    def test_capture_binds_exact_bytes_but_cannot_claim_eligibility(self):
        result=self.run_capture();m=json.loads(result['bundle_manifest'])
        self.assertFalse(m['evaluation_eligible']);self.assertIsNone(m['actual_start_utc'])
        self.assertEqual(m['artifacts']['quote_raw']['sha256'],sha(self.blobs['quote_raw']))
        self.assertEqual(result['quote_raw'],self.blobs['quote_raw'])

    def test_same_snapshot_reproducible_and_price_change_changes_digest(self):
        first=self.run_capture();self.assertEqual(first,self.run_capture())
        self.quotes[0]['decimal_odds']=2.0
        self.assertNotEqual(sha(first['bundle_manifest']),sha(self.run_capture()['bundle_manifest']))

    def test_retroactive_capture_refused(self):
        self.event['scheduled_start_utc']=self.now.isoformat()
        with self.assertRaises(ValueError):self.run_capture()

    def test_actual_started_even_if_schedule_is_future_refused(self):
        self.event['actual_start_utc']='2026-11-06T00:50:00Z'
        with self.assertRaises(ValueError):self.run_capture()

    def test_naive_clock_refused(self):
        self.now=self.now.replace(tzinfo=None)
        with self.assertRaises(ValueError):self.run_capture()

    def test_no_live_unknown_or_stale_state(self):
        for value in ['LIVE','UNKNOWN',None]:
            self.event['state']=value
            with self.assertRaises(ValueError):self.run_capture()
        self.event['state']='PRE_GAME';self.event['state_observed_at_utc']='2026-11-05T00:00:00Z'
        with self.assertRaises(ValueError):self.run_capture()

    def test_stale_original_quote_cannot_be_freshened_by_fetch(self):
        self.quotes[0]['market_last_update_utc']='2026-11-05T23:00:00Z'
        with self.assertRaises(ValueError):self.run_capture()

    def test_provider_update_after_fetch_refused(self):
        self.quotes[0]['market_last_update_utc']='2026-11-06T01:00:01Z'
        with self.assertRaises(ValueError):self.run_capture()

    def test_source_byte_substitution_refused(self):
        self.blobs['quote_raw']=b'changed price'
        with self.assertRaises(ValueError):self.run_capture()

    def test_model_substitution_refused(self):
        self.blobs['model']=b'new weights'
        with self.assertRaises(ValueError):self.run_capture()

    def test_feature_lookahead_refused(self):
        self.pred[0]['features_as_of_utc']='2026-11-06T01:00:01Z'
        with self.assertRaises(ValueError):self.run_capture()

    def test_duplicate_selection_refused(self):
        self.quotes.append(copy.deepcopy(self.quotes[0]))
        with self.assertRaises(ValueError):self.run_capture()

    def test_integer_push_mass_kept_not_replaced_with_zero(self):
        self.pred[0].update(line=226,p_win=.5,p_push=.04,p_loss=.46)
        self.quotes[0]['line']=226
        self.assertEqual(json.loads(self.run_capture()['predictions'])[0]['p_push'],.04)

    def test_nonfinite_and_invalid_probability_refused(self):
        for value in [float('nan'),float('inf'),1.1]:
            self.pred[0]['p_win']=value
            with self.assertRaises(ValueError):self.run_capture()

    def test_missing_original_time_or_retention_approval_refused(self):
        self.quotes[0]['market_last_update_utc']=''
        with self.assertRaises(ValueError):self.run_capture()
        self.quotes[0]['market_last_update_utc']='2026-11-06T00:59:50Z'
        self.event['raw_retention_approved']=False
        with self.assertRaises(ValueError):self.run_capture()

    def test_path_traversal_and_reserved_artifact_names_refused(self):
        for key in ['../secret','predictions']:
            self.blobs[key]=b'do not overwrite'
            with self.assertRaises(ValueError):self.run_capture()
            del self.blobs[key]


class FakeArchive:
    def __init__(self, fail_at=None, late=False):
        self.objects={};self.history={};self.fail_at=fail_at;self.late=late
    def put_object(self, **kw):
        if len(self.objects)==self.fail_at: raise OSError('storage unavailable')
        if kw['Key'] in self.objects: raise ValueError('create only')
        self.objects[kw['Key']]=kw
        return {'VersionId':'v1'}
    def get_object_retention(self, **kw):
        if kw['Key'] in self.history:
            return {'Retention':{'Mode':'COMPLIANCE','RetainUntilDate':datetime(2030,1,1,tzinfo=timezone.utc)}}
        obj=self.objects[kw['Key']]
        return {'Retention':{'Mode':obj['ObjectLockMode'],'RetainUntilDate':obj['ObjectLockRetainUntilDate']}}
    def get_object(self, **kw):
        if kw['Key'] in self.history: return {'Body':BytesIO(self.history[kw['Key']])}
        return {'Body':BytesIO(self.objects[kw['Key']]['Body'])}
    def head_object(self, **kw):
        if kw['Key'] in self.history:
            if kw['Key'].startswith('nba-history-first-final/'):
                return {'LastModified':datetime(2026,11,5,21,59,1,tzinfo=timezone.utc)}
            return {'LastModified':datetime(2026,11,5,22,0,1,tzinfo=timezone.utc)}
        return {'LastModified':datetime(2026,11,6,3 if self.late else 1,0,2,tzinfo=timezone.utc)}


class ArchiveLifecycleTests(unittest.TestCase):
    def setUp(self):
        f=ProspectiveCaptureTests();f.setUp();self.payload=f.run_capture()
    def fake_tsa(self, digest, directory, **kw):
        directory.mkdir()
        for n in ['request.tsq','response.tsr']:(directory/n).write_bytes(b'synthetic test token')
        (directory/'timestamp-audit.json').write_text(json.dumps({'timestamp_response_text':'Time stamp: Nov  6 01:00:01 2026 GMT'}))
        return {'rfc3161_verified':True,'raw_sha256':digest}
    def archive(self, client):
        history=json.loads(self.payload['history_evidence'])
        for item in history:
            client.history[item['immutable_archive_ref']['key']]=self.payload[item['raw_artifact_key']]
            i=int(item['source_game_id'])-1000
            client.history[item['immutable_first_final_ref']['key']]=self.payload[f'ledger_raw_{i}']
        with TemporaryDirectory() as temp, patch('nba_totals_research.rfc3161_timestamp.timestamp_digest',side_effect=self.fake_tsa):
            return archive_bundle(self.payload,workdir=temp,tsa_url='synthetic-test-only',
                tsa_ca=Path('unused-test-ca'),tsa_signer=Path('unused-test-signer'),s3_client=client,
                bucket='synthetic',retain_until=datetime(2030,1,1,tzinfo=timezone.utc),
                clock=lambda:datetime(2026,11,6,1,0,3,tzinfo=timezone.utc))
    def test_completion_last_and_actual_start_still_pending(self):
        client=FakeArchive();result=self.archive(client)
        self.assertTrue(list(client.objects)[-1].endswith('/completion.json'))
        self.assertFalse(result['evaluation_eligible'])
        completion=json.loads(client.objects[list(client.objects)[-1]]['Body'])
        self.assertFalse(completion['actual_start_verified'])
        self.assertEqual(len(completion['objects']),len(self.payload)+3)
    def test_failed_upload_cannot_produce_completion(self):
        client=FakeArchive(fail_at=3)
        with self.assertRaises(OSError):self.archive(client)
        self.assertFalse(any(x.endswith('/completion.json') for x in client.objects))
    def test_changed_bundle_refused_before_any_upload(self):
        self.payload['quotes']+=b' '
        client=FakeArchive()
        with self.assertRaises(ValueError):self.archive(client)
        self.assertFalse(client.objects)
    def test_late_server_receipt_refused(self):
        client=FakeArchive(late=True)
        with self.assertRaises(ValueError):self.archive(client)
        self.assertFalse(any(x.endswith('/completion.json') for x in client.objects))
    def test_history_remote_tampering_blocks_completion(self):
        client=FakeArchive()
        # Set historical objects to wrong bytes after the fixture populates them.
        original=client.get_object
        def tamper(**kw):
            if kw['Key'].startswith('history/'):
                return {'Body':BytesIO(b'wrong')}
            return original(**kw)
        client.get_object=tamper
        with self.assertRaises(ValueError): self.archive(client)
        self.assertFalse(any(x.endswith('/completion.json') for x in client.objects))

    def test_wrong_tsa_digest_refused(self):
        original=self.fake_tsa
        def wrong(*args,**kwargs):
            result=original(*args,**kwargs);result['raw_sha256']='0'*64;return result
        self.fake_tsa=wrong
        client=FakeArchive()
        with self.assertRaises(ValueError):self.archive(client)
        self.assertFalse(client.objects)


if __name__=='__main__':unittest.main()
