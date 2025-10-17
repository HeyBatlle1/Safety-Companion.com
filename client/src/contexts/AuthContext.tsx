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
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth session error:', error);
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          if (session?.user) {
            try {
              const { data: userData, error: dbError } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (dbError) {
                console.error('User data fetch error:', dbError);
              }

              setUser({
                id: session.user.id,
                email: session.user.email || '',
                role: userData?.role || 'field_worker'
              });
            } catch (err) {
              console.error('Error fetching user data:', err);
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                role: 'field_worker'
              });
            }
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    const fallbackTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn('Auth initialization timeout - forcing load complete');
        setLoading(false);
      }
    }, 3000);

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try {
          const { data: userData } = await supabase
            .from('users')
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
      isMounted = false;
      clearTimeout(fallbackTimeout);
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
          .from('users')
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
          .from('users')
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
