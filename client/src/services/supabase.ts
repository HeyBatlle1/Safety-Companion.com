import { createClient } from '@supabase/supabase-js';

// Get environment variables from .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a single Supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Content-Type': 'application/json'
    }
  }
});

// Supabase status checker
export const getSupabaseStatus = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
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

// Export for use in other files
export { supabase };
export default supabase;

// Auth helper functions
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      return null;
    }
    return user;
  } catch (error) {
    return null;
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    if (!data.user) {
      throw new Error('Authentication successful but no user returned');
    }
    
    // Ensure user profile exists in database
    await ensureUserProfile(data.user.id);
    
    return data.user;
  } catch (error) {
    throw error;
  }
};

export const signUp = async (email: string, password: string, role: string = 'field_worker') => {
  try {
    // Create auth user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`
      }
    });

    if (signUpError) throw signUpError;
    if (!data.user) throw new Error('Failed to create user');

    // Ensure user profile exists in database with selected role  
    await ensureUserProfile(data.user.id, role, email);

    return data.user;
  } catch (error) {
    throw error;
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    throw error;
  }
};

// Helper function to ensure user profile exists
const ensureUserProfile = async (userId: string, role: string = 'field_worker', email?: string): Promise<void> => {
  try {
    // First check if profile exists
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // If profile doesn't exist, create it
    if (!data) {
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email: email || '',
            role: role,
            first_name: '',
            last_name: '',
            is_active: true,
            created_at: new Date().toISOString()
          }
        ]);

      if (insertError) {
        throw insertError;
      }
    }
  } catch (error) {
    console.error('Error ensuring user profile:', error);
    throw error;
  }
};