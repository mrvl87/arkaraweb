import { createClient } from '@supabase/supabase-js'
import { getServerEnv } from './server-env'

const supabaseUrl =
  getServerEnv('SUPABASE_URL', ['PUBLIC_SUPABASE_URL']) ||
  ''
const supabaseAnonKey =
  getServerEnv('SUPABASE_ANON_KEY', ['PUBLIC_SUPABASE_ANON_KEY']) ||
  ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("CRITICAL ERROR: Supabase URL or Anon Key is missing. SSR will fail.");
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');
