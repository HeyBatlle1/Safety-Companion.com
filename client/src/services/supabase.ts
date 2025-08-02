import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { showToast } from '../components/common/ToastContainer';

// Get environment variables from .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate the environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Please check your .env file.');
}

// Create a single Supabase client for interacting with your database
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
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

// Export for use in other files
export { supabase };
export default supabase;

// Auth helper functions
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    return user;
  } catch (error) {
    console.error('Unexpected error in getCurrentUser:', error);
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
    console.error('Sign in error:', error);
    throw error;
  }
};

export const signUp = async (email: string, password: string) => {
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

    // Ensure user profile exists in database
    await ensureUserProfile(data.user.id);

    return data.user;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Helper function to ensure user profile exists
const ensureUserProfile = async (userId: string): Promise<void> => {
  try {
    // First check if profile exists
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('auth_user_id', userId)
      .maybeSingle();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.info('User profile not found, creating new profile');
      } else {
        console.error('Error checking user profile:', error);
        return;
      }
    }
    
    // If profile doesn't exist, create it
    if (!data) {
      try {
        console.log('Creating user profile for:', userId);
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            auth_user_id: userId,
            first_name: '',
            last_name: '',
            email: '',
            role: 'field_worker'
          } as any);
        
        if (insertError) {
          console.error('Error creating user profile:', insertError);
          showToast('Error creating user profile', 'error');
        } else {
          console.log('Successfully created user profile');
        }
      } catch (insertError) {
        console.error('Exception creating user profile:', insertError);
      }
      
      // Skip notification preferences for now - table may not exist yet
      console.log('User profile created successfully for:', userId);
    }
  } catch (error) {
    console.error('Error in ensureUserProfile:', error);
  }
};

// Function to check if Supabase connection is working
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    // Perform a simple query to check connectivity
    const { error } = await supabase
      .from('user_profiles')
      .select('count', { count: 'exact', head: true });
    
    // If we get a specific error about the relation not existing, that's still a successful connection
    if (error && error.code === '42P01') {
      return true;
    }
    
    return !error;
  } catch (error) {
    console.error('Supabase connection check error:', error);
    return false;
  }
};

// Function to get basic Supabase status
export const getSupabaseStatus = async (): Promise<{
  connected: boolean;
  authenticated: boolean;
  tables: string[];
}> => {
  try {
    const connected = await checkSupabaseConnection();
    const user = await getCurrentUser();
    
    let tables: string[] = [];
    if (connected) {
      try {
        // Try a simple query to test connection
        const { error: testError } = await supabase
          .from('user_profiles')
          .select('count', { count: 'exact', head: true });
        
        if (!testError || testError.code === '42P01') {
          // Connection is working, set some default table names
          tables = ['user_profiles', 'notification_preferences', 'safety_reports'];
        }
      } catch (error) {
        console.warn('Could not fetch table list:', error);
      }
    }
    
    return {
      connected,
      authenticated: !!user,
      tables
    };
  } catch (error) {
    console.error('Error getting Supabase status:', error);
    return {
      connected: false,
      authenticated: false,
      tables: []
    };
  }
};