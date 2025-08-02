import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, signIn as authSignIn, signUp as authSignUp, signOut as authSignOut } from '../services/supabase';
import { showToast } from '../components/common/ToastContainer';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Default context value to prevent undefined errors
const defaultAuthContext: AuthContextType = {
  user: null,
  loading: true,
  signIn: async () => { throw new Error('Auth context not initialized'); },
  signUp: async () => { throw new Error('Auth context not initialized'); },
  signOut: async () => { throw new Error('Auth context not initialized'); },
  refreshUser: async () => { throw new Error('Auth context not initialized'); }
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Initialize user state from sessionStorage if available
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('supabase-auth-user');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  // Set up auth state listener
  useEffect(() => {
    // Check initial auth state with timeout
    const checkInitialAuth = async () => {
      try {
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Auth check timeout')), 1000); // 1 second timeout for faster fallback
        });

        // Race between auth check and timeout
        const authPromise = supabase.auth.getUser();
        
        const { data: { user: currentUser } } = await Promise.race([authPromise, timeoutPromise]) as any;
        
        if (currentUser) {
          setUser(currentUser);
          sessionStorage.setItem('supabase-auth-user', JSON.stringify(currentUser));
        } else {
          sessionStorage.removeItem('supabase-auth-user');
          setUser(null);
        }
      } catch (error) {
        // On timeout or error, fallback to sessionStorage or offline mode
        const stored = sessionStorage.getItem('supabase-auth-user');
        if (stored) {
          try {
            setUser(JSON.parse(stored));
          } catch {
            sessionStorage.removeItem('supabase-auth-user');
            setUser(null);
          }
        } else {
          // Set user to null to allow app to load in offline mode
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    checkInitialAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {

        const newUser = session?.user ?? null;
        setUser(newUser);
        
        // Persist to sessionStorage
        if (newUser) {
          sessionStorage.setItem('supabase-auth-user', JSON.stringify(newUser));
        } else {
          sessionStorage.removeItem('supabase-auth-user');
        }
        
        setLoading(false);

        // Handle auth events
        switch (event) {
          case 'SIGNED_IN':
            showToast('Successfully signed in', 'success');
            break;
          case 'SIGNED_OUT':
            showToast('Successfully signed out', 'success');
            break;
          case 'TOKEN_REFRESHED':

            break;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await authSignIn(email, password);
      // The auth state change listener will handle setting the user
    } catch (error: any) {

      showToast(error.message || 'Failed to sign in', 'error');
      throw error;
    }
  };

  const signUp = async (email: string, password: string, role: string = 'field_worker') => {
    try {
      await authSignUp(email, password, role);
      showToast('Account created successfully! Please check your email to verify your account.', 'success');
    } catch (error: any) {

      showToast(error.message || 'Failed to create account', 'error');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await authSignOut();
      // The auth state change listener will handle clearing the user
    } catch (error: any) {

      showToast(error.message || 'Failed to sign out', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {

        setUser(null);
      } else {
        setUser(user);
      }
    } catch (error) {

      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};