/* @refresh reset */
import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '@/services/supabase';

interface User {
  id: string;
  email: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: string, profileData?: any) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const event = new CustomEvent('showToast', { 
      detail: { message, type }
    });
    window.dispatchEvent(event);
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session || !mounted) {
          if (mounted) setLoading(false);
          return;
        }

        // Set basic user first
        const basicUser = {
          id: session.user.id,
          email: session.user.email || '',
          role: 'field_worker' as string
        };
        
        if (mounted) setUser(basicUser);

        // Try to fetch profile for role
        const { data: userData } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (mounted && userData?.role) {
          setUser({ ...basicUser, role: userData.role });
        }
        
        if (mounted) setLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && mounted) {
        const basicUser = {
          id: session.user.id,
          email: session.user.email || '',
          role: 'field_worker' as string
        };
        
        setUser(basicUser);

        // Try to get role from profile
        const { data: userData } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (userData?.role && mounted) {
          setUser({ ...basicUser, role: userData.role });
        }
      } else if (mounted) {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data?.user) throw new Error('Sign in failed');

      const basicUser = {
        id: data.user.id,
        email: data.user.email || '',
        role: 'field_worker' as string
      };

      // Try to get role from profile
      const { data: userData } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      setUser(userData?.role ? { ...basicUser, role: userData.role } : basicUser);
      showToast('Successfully signed in');
    } catch (error: any) {
      const message = error?.message || 'Failed to sign in';
      showToast(message, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, role: string, profileData?: any) => {
    try {
      setLoading(true);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData?.user) throw new Error('Sign up failed');

      // Create user profile
      const { error: dbError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          role,
          firstName: profileData?.firstName,
          lastName: profileData?.lastName,
          phone: profileData?.phone,
          employeeId: profileData?.employeeId,
          department: profileData?.department,
          emergencyContactName: profileData?.emergencyContactName,
          emergencyContactPhone: profileData?.emergencyContactPhone
        });

      if (dbError) throw dbError;

      setUser({
        id: authData.user.id,
        email: authData.user.email || '',
        role
      });
      
      showToast('Account created successfully!');
    } catch (error: any) {
      const message = error?.message || 'Failed to create account';
      showToast(message, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      showToast('Successfully signed out');
    } catch (error: any) {
      const message = error?.message || 'Failed to sign out';
      showToast(message, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
