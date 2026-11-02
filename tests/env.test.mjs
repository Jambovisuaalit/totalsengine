import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBuildEnv } from '../scripts/validate-env.mjs';
const ok={VITE_SUPABASE_URL:'https://example.supabase.co',VITE_SUPABASE_PUBLISHABLE_KEY:'public-test-key'};
test('valid public env',()=>assert.equal(validateBuildEnv(ok),true));
test('missing key fails',()=>assert.throws(()=>validateBuildEnv({...ok,VITE_SUPABASE_PUBLISHABLE_KEY:''}),/Missing required/));
test('non-HTTPS URL fails',()=>assert.throws(()=>validateBuildEnv({...ok,VITE_SUPABASE_URL:'http://example.com'}),/HTTPS/));
test('malformed URL fails',()=>assert.throws(()=>validateBuildEnv({...ok,VITE_SUPABASE_URL:'bad'}),/Invalid/));
