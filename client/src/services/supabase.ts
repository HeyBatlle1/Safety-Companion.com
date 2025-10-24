import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to secrets.');
}

// Singleton pattern: Store client in window to survive HMR
declare global {
  interface Window {
    __supabaseClient?: SupabaseClient;
  }
}

let supabase: SupabaseClient;

if (typeof window !== 'undefined' && window.__supabaseClient) {
  supabase = window.__supabaseClient;
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'safety-companion-auth',
      flowType: 'pkce'
    }
  });
  
  if (typeof window !== 'undefined') {
    window.__supabaseClient = supabase;
  }
}

// Helper functions
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

export const getSupabaseStatus = async () => {
  try {
    const { error } = await supabase.from('user_profiles').select('count').limit(1);
    return {
      connected: !error,
      error: error?.message || null,
      timestamp: new Date().toISOString()
    };
  } catch {
    return {
      connected: false,
      error: 'Connection failed',
      timestamp: new Date().toISOString()
    };
  }
};

export default supabase;
export { supabase };
