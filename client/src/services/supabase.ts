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
    },
    fetch: (url, options) => {
      return fetch(url, {
        ...options,
        timeout: 30000 // 30 second timeout
      });
    }
  },
  realtime: {
    autoSubscribe: false // Turn off by default to save resources
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
      .eq('id', userId)
      .single();
    
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
          .insert([{
            id: userId,
            role: 'field_worker',
            is_active: true,
            created_at: new Date().toISOString()
          }]);
        
        if (insertError) {
          console.error('Error creating user profile:', insertError);
          showToast('Error creating user profile', 'error');
        } else {
          console.log('Successfully created user profile');
        }
      } catch (insertError) {
        console.error('Exception creating user profile:', insertError);
      }
      
      // Create notification preferences
      try {
        console.log('Creating notification preferences for:', userId);
        const { error: prefError } = await supabase
          .from('notification_preferences')
          .insert([{
            user_id: userId,
            email_notifications: true,
            sms_notifications: false,
            push_notifications: true,
            certification_expiry_alerts: true,
            certification_alert_days: 30,
            drug_screen_reminders: true,
            safety_alerts: true,
            project_updates: true,
            training_reminders: true,
            created_at: new Date().toISOString()
          }]);
        
        if (prefError) {
          console.error('Error creating notification preferences:', prefError);
        } else {
          console.log('Successfully created notification preferences');
        }
      } catch (prefError) {
        console.error('Exception creating notification preferences:', prefError);
      }
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
        // First try using the RPC function
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_tables');
        
        if (!rpcError && rpcData) {
          tables = rpcData;
        } else {
          // Fall back to direct query if RPC fails
          const { data, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');
          
          if (!error && data) {
            tables = data.map(t => t.table_name);
          }
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