import { UserProfile, UserCertification, DrugScreen, NotificationPreferences, TeamMember } from '../types/profile';
import supabase from './supabase';

const API_BASE = '/api';

// Helper function for API requests with Supabase JWT
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `Request failed with status ${response.status}`);
  }

  return response.json();
};

// Profile Management
export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const data = await apiRequest('/auth/user');
    // Transform the user data to match UserProfile interface
    return {
      id: data.user.id,
      email: data.user.email,
      display_name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || data.user.email,
      first_name: data.user.firstName,
      last_name: data.user.lastName,
      phone: data.user.phone,
      employee_id: data.user.employeeId,
      department: data.user.department,
      role: data.user.role,
      certifications: [],
      emergency_contact_name: data.user.emergencyContactName,
      emergency_contact_phone: data.user.emergencyContactPhone,
      avatar_url: null,
      created_at: data.user.createdAt,
      updated_at: data.user.updatedAt
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (updates: Partial<UserProfile>): Promise<UserProfile | null> => {
  try {
    const data = await apiRequest('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return data.user;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Team Members (Admin)
export const getTeamMembers = async (): Promise<TeamMember[]> => {
  try {
    const data = await apiRequest('/team/members');
    return data.members || [];
  } catch (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
};

// Drug Screens
export const getUserDrugScreens = async (): Promise<DrugScreen[]> => {
  try {
    // TODO: Implement when backend endpoint is ready
    return [];
  } catch (error) {
    console.error('Error fetching drug screens:', error);
    return [];
  }
};

// Certifications
export const getUserCertifications = async (): Promise<UserCertification[]> => {
  try {
    // TODO: Implement when backend endpoint is ready
    return [];
  } catch (error) {
    console.error('Error fetching certifications:', error);
    return [];
  }
};

// Notification Preferences
export const getNotificationPreferences = async (): Promise<NotificationPreferences | null> => {
  try {
    const data = await apiRequest('/users/notification-preferences');
    return data;
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    // Return default preferences if not found
    return {
      user_id: '',
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
  }
};

export const updateNotificationPreferences = async (updates: Partial<NotificationPreferences>): Promise<NotificationPreferences | null> => {
  try {
    const data = await apiRequest('/users/notification-preferences', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return data;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
};

// Role Management
export const assignUserRole = async (userId: string, role: string): Promise<boolean> => {
  try {
    await apiRequest(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    return true;
  } catch (error) {
    console.error('Error assigning user role:', error);
    return false;
  }
};

// Permission Check
export const hasPermission = async (resource: string): Promise<boolean> => {
  try {
    const profile = await getUserProfile();
    if (!profile) return false;
    
    // Simple role-based permission check
    return profile.role === 'admin' || profile.role === 'safety_manager';
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

// Export all functions
export default {
  getUserProfile,
  updateUserProfile,
  getTeamMembers,
  getUserDrugScreens,
  getUserCertifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  assignUserRole,
  hasPermission,
};