// Use the centralized Supabase client to avoid conflicts
import { supabase } from './supabase';
import { 
  UserProfile, 
  Company, 
  Project, 
  UserProjectAssignment, 
  DrugScreen, 
  UserCertification, 
  NotificationPreferences,
  CertificationExpiryAlert 
} from '../types/profile';
import { handleSupabaseError } from '../utils/errorHandler';
import { showToast } from '../components/common/ToastContainer';

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
      .from('profiles')
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

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: userId,
            display_name: null,
            avatar_url: null,
            email: null
          }]);
        
        if (insertError) {

          showToast('Error creating user profile', 'error');
        } else {

        }
      } catch (insertError) {

      }
      
      // Create notification preferences
      try {

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

        } else {

        }
      } catch (prefError) {

      }
    }
  } catch (error) {

  }
};

// Function to check if Supabase connection is working
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    // Perform a simple query to check connectivity
    const { error } = await supabase
      .from('profiles')
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
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public');
        
        if (!error && data) {
          tables = data.map(t => t.table_name);
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

// Profile Management
export const getUserProfile = async (userId?: string): Promise<UserProfile | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const targetUserId = userId || user.id;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('User profile not found, creating new profile');
        await ensureUserProfile(targetUserId);
        
        // Try to fetch again after creating
        const { data: newData, error: newError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', targetUserId)
          .single();
        
        if (newError) {
          console.error('Error fetching newly created profile:', newError);
          return null;
        }
        
        return newData;
      } else {
        console.error('Error fetching user profile:', error);
        return null;
      }
    }

    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

export const updateUserProfile = async (updates: Partial<UserProfile>): Promise<UserProfile | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const assignUserRole = async (userId: string, role: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error assigning user role:', error);
    return false;
  }
};

// Company Management
export const getCompanies = async (): Promise<Company[]> => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name');

    if (error) {
      if (error.code === '42P01') {
        console.log('Companies table does not exist, returning empty array');
        return [];
      }
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching companies:', error);
    return [];
  }
};

export const createCompany = async (company: Omit<Company, 'id' | 'created_at' | 'updated_at'>): Promise<Company | null> => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .insert([{
        ...company,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
};

// Project Management
export const getUserProjects = async (): Promise<Project[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_project_assignments')
      .select(`
        project:projects (
          id,
          name,
          description,
          status,
          start_date,
          end_date,
          company_id,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      if (error.code === '42P01') {
        return [];
      }
      throw error;
    }

    return data?.map(item => item.project).filter(Boolean) || [];
  } catch (error) {

    return [];
  }
};

export const assignUserToProject = async (userId: string, projectId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_project_assignments')
      .insert([{
        user_id: userId,
        project_id: projectId,
        assigned_at: new Date().toISOString()
      }]);

    if (error) throw error;
    return true;
  } catch (error) {

    return false;
  }
};

// Drug Screen Management
export const getUserDrugScreens = async (): Promise<DrugScreen[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('drug_screens')
      .select('*')
      .eq('user_id', user.id)
      .order('test_date', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        console.log('Drug screens table does not exist, returning empty array');
        return [];
      }
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching drug screens:', error);
    return [];
  }
};

// Certification Management
export const getUserCertifications = async (): Promise<UserCertification[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_certifications')
      .select('*')
      .eq('user_id', user.id)
      .order('expiry_date', { ascending: true });

    if (error) {
      if (error.code === '42P01') {
        console.log('User certifications table does not exist, returning empty array');
        return [];
      }
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user certifications:', error);
    return [];
  }
};


// Notification Preferences
export const getNotificationPreferences = async (): Promise<NotificationPreferences | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('Notification preferences not found, creating defaults');
        // Create default preferences
        const defaultPrefs = {
          user_id: user.id,
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
        };

        const { data: newData, error: insertError } = await supabase
          .from('notification_preferences')
          .insert([defaultPrefs])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating default notification preferences:', insertError);
          return null;
        }

        return newData;
      } else {
        console.error('Error fetching notification preferences:', error);
        return null;
      }
    }

    return data;
  } catch (error) {
    console.error('Error in getNotificationPreferences:', error);
    return null;
  }
};

export const updateNotificationPreferences = async (preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('notification_preferences')
      .update({
        ...preferences,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};

// Team Management
export const getTeamMembers = async (): Promise<UserProfile[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    // Get current user's profile to check permissions
    const currentProfile = await getUserProfile(user.id);
    if (!currentProfile || !['admin', 'project_manager'].includes(currentProfile.role)) {
      return [];
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('is_active', true)
      .order('first_name');

    if (error) {
      if (error.code === '42P01') {
        console.log('User profiles table does not exist, returning empty array');
        return [];
      }
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
};

// Permission checking
export const hasPermission = async (requiredRole: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const profile = await getUserProfile(user.id);
    if (!profile) return false;

    const roleHierarchy = {
      'field_worker': 1,
      'project_manager': 2,
      'admin': 3
    };

    const userLevel = roleHierarchy[profile.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    return userLevel >= requiredLevel;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
};

export default {
  getUserProfile,
  updateUserProfile,
  assignUserRole,
  getCompanies,
  createCompany,
  getUserProjects,
  assignUserToProject,
  getUserDrugScreens,
  getUserCertifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  getTeamMembers,
  hasPermission
};