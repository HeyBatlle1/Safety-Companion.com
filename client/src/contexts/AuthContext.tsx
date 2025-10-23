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
        console.log('🔐 Initializing auth...');
        
        // Add timeout to prevent infinite loading
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        );
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        console.log('🔐 Session check complete:', !!session);
        
        if (!session) {
          console.log('🔐 No session found, setting loading to false');
          if (mounted) setLoading(false);
          return;
        }

        if (mounted) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: 'field_worker'
          });
        }

        const { data: userData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (mounted) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: userData?.role || 'field_worker'
          });
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Auth error:', error);
        if (mounted) setLoading(false);
      }
    };

    console.log('🔐 Starting auth initialization...');
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: userData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        setUser({
          id: data.user.id,
          email: data.user.email || '',
          role: userData?.role || 'field_worker'
        });
        
        showToast('Successfully signed in');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to sign in', 'error');
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

      if (authData.user) {
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
        
        showToast('Account created successfully! You are now logged in.');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to create account', 'error');
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
      showToast(error.message || 'Failed to sign out', 'error');
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
