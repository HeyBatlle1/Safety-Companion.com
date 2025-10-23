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

// Helper to properly log errors
const logError = (prefix: string, error: any) => {
  console.error(prefix, {
    message: error?.message,
    status: error?.status,
    statusText: error?.statusText,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
    name: error?.name,
    stack: error?.stack
  });
};

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
        console.log('🔐 Initializing auth...');
        console.log('🔐 Supabase URL configured:', !!import.meta.env.VITE_SUPABASE_URL);
        console.log('🔐 Supabase Anon Key configured:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
        
        // Check session with proper timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout - Supabase connection failed after 10s')), 10000)
        );
        
        const { data: { session }, error: sessionError } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (sessionError) {
          logError('❌ Session error:', sessionError);
          if (mounted) setLoading(false);
          return;
        }
        
        console.log('🔐 Session check complete:', !!session);
        
        if (!session) {
          console.log('🔐 No session found, user not logged in');
          if (mounted) setLoading(false);
          return;
        }

        console.log('🔐 Session found, loading user profile...');

        // Set basic user first
        if (mounted) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: 'field_worker'
          });
        }

        // Try to fetch user profile
        try {
          const { data: userData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.warn('⚠️ Could not load user profile:', profileError.message);
            // Continue with basic user info
          } else if (mounted && userData) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role: userData.role || 'field_worker'
            });
          }
        } catch (profileErr) {
          logError('⚠️ Profile fetch error:', profileErr);
          // Continue with basic user info
        }
        
        if (mounted) setLoading(false);
      } catch (error) {
        logError('❌ Auth initialization error:', error);
        if (mounted) setLoading(false);
      }
    };

    console.log('🔐 Starting auth initialization...');
    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event);
      
      if (session?.user) {
        try {
          const { data: userData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: userData?.role || 'field_worker'
          });
        } catch (err) {
          logError('⚠️ Profile load error in state change:', err);
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: 'field_worker'
          });
        }
      } else {
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
      console.log('🔐 Attempting sign in for:', email);
      
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign in timeout - Supabase connection issue after 15s')), 15000)
      );
      
      const { data, error } = await Promise.race([signInPromise, timeoutPromise]) as any;

      if (error) {
        logError('❌ Sign in error from Supabase:', error);
        throw new Error(error.message || 'Invalid email or password');
      }

      if (!data?.user) {
        throw new Error('Sign in failed - no user data returned');
      }

      console.log('🔐 Sign in successful, user ID:', data.user.id);
      
      // Fetch user profile
      try {
        const { data: userData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.warn('⚠️ Could not load profile:', profileError.message);
        }

        setUser({
          id: data.user.id,
          email: data.user.email || '',
          role: userData?.role || 'field_worker'
        });
      } catch (profileErr) {
        logError('⚠️ Profile fetch error:', profileErr);
        // Continue with basic user
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          role: 'field_worker'
        });
      }
      
      showToast('Successfully signed in');
    } catch (error: any) {
      logError('❌ Sign in failed:', error);
      showToast(error?.message || 'Failed to sign in. Please check your credentials.', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, role: string, profileData?: any) => {
    try {
      setLoading(true);
      console.log('🔐 Attempting sign up for:', email);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        logError('❌ Sign up error:', authError);
        throw new Error(authError.message || 'Failed to create account');
      }

      if (!authData?.user) {
        throw new Error('Sign up failed - no user data returned');
      }

      console.log('🔐 User created, creating profile...');

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

      if (dbError) {
        logError('❌ Profile creation error:', dbError);
        throw new Error(dbError.message || 'Failed to create user profile');
      }

      setUser({
        id: authData.user.id,
        email: authData.user.email || '',
        role
      });
      
      showToast('Account created successfully! You are now logged in.');
    } catch (error: any) {
      logError('❌ Sign up failed:', error);
      showToast(error?.message || 'Failed to create account', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      console.log('🔐 Signing out...');
      
      const { error } = await supabase.auth.signOut();

      if (error) {
        logError('❌ Sign out error:', error);
        throw new Error(error.message || 'Failed to sign out');
      }

      setUser(null);
      showToast('Successfully signed out');
    } catch (error: any) {
      logError('❌ Sign out failed:', error);
      showToast(error?.message || 'Failed to sign out', 'error');
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
