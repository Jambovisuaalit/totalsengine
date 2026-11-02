import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { publicEnv } from '@/config/env';

// Public anon/publishable key only. Never use a service-role key in frontend code.
export const supabase = createClient<Database>(publicEnv.supabaseUrl, publicEnv.supabasePublishableKey, {
  auth: { storage: localStorage, persistSession: true, autoRefreshToken: true },
});
