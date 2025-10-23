import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate configuration
if (!supabaseUrl) {
  console.error('❌ CRITICAL: VITE_SUPABASE_URL is not configured!');
  console.error('Please add VITE_SUPABASE_URL to your Replit Secrets');
}
if (!supabaseAnonKey) {
  console.error('❌ CRITICAL: VITE_SUPABASE_ANON_KEY is not configured!');
  console.error('Please add VITE_SUPABASE_ANON_KEY to your Replit Secrets');
}

// Singleton pattern: Store client in window to survive HMR
declare global {
  interface Window {
    __supabaseClient?: SupabaseClient;
  }
}

let supabase: SupabaseClient;

if (typeof window !== 'undefined' && window.__supabaseClient) {
  // Reuse existing client during HMR
  supabase = window.__supabaseClient;
  console.log('🔐 Reusing existing Supabase client (HMR)');
} else {
  console.log('🔐 Supabase Configuration:');
  console.log('  URL configured:', !!supabaseUrl, supabaseUrl ? `(${supabaseUrl.substring(0, 30)}...)` : '');
  console.log('  Anon Key configured:', !!supabaseAnonKey, supabaseAnonKey ? `(${supabaseAnonKey.substring(0, 20)}...)` : '');
  
  // Create a single Supabase client for interacting with your database
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'safety-companion-auth',
      flowType: 'pkce'
    },
    global: {
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Info': 'safety-companion-web'
      }
    },
    db: {
      schema: 'public'
    }
  });
  
  // Store in window for HMR
  if (typeof window !== 'undefined') {
    window.__supabaseClient = supabase;
  }
}

// Supabase status checker
export const getSupabaseStatus = async () => {
  try {
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    return {
      connected: !error,
      error: error?.message || null,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      connected: false,
      error: 'Connection failed',
      timestamp: new Date().toISOString()
    };
  }
};

// Export the Supabase client
export default supabase;

// Type definitions
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: string;
          created_at?: string;
        };
      };
    };
  };
}

// Authentication helpers
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

// Database helpers
export const insertUser = async (userData: any) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert(userData)
    .select()
    .single();
  return { data, error };
};

export const getUserById = async (id: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error };
};

export const updateUser = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
};

// Storage helpers
export const uploadFile = async (bucket: string, path: string, file: File) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file);
  return { data, error };
};

export const downloadFile = async (bucket: string, path: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(path);
  return { data, error };
};

export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  return data.publicUrl;
};

// Real-time subscriptions
export const subscribeToTableChanges = (table: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`public:${table}`)
    .on('postgres_changes', 
      { event: '*', schema: 'public', table }, 
      callback
    )
    .subscribe();
};

export { supabase };