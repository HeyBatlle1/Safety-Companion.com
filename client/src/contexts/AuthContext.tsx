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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state and set up listener
  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('Initializing authentication...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
        } else {
          console.log('Session initialized:', session?.user ? 'User logged in' : 'No active session');
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
      } finally {
        console.log('Auth initialization complete, setting loading to false');
        setLoading(false);
      }
    };

    // Add a timeout to ensure loading state doesn't persist indefinitely
    const timeoutId = setTimeout(() => {
      console.log('Auth initialization timeout - forcing loading to false');
      setLoading(false);
    }, 5000);

    initializeAuth().then(() => {
      clearTimeout(timeoutId);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        // Only update user state, don't touch loading here to avoid conflicts
        setUser(session?.user ?? null);
        
        // Handle auth events (but don't set loading here)
        switch (event) {
          case 'SIGNED_IN':
            showToast('Successfully signed in', 'success');
            break;
          case 'SIGNED_OUT':
            showToast('Successfully signed out', 'success');
            setUser(null); // Ensure user is cleared on signout
            break;
          case 'TOKEN_REFRESHED':
            console.log('Auth token refreshed');
            break;
          case 'INITIAL_SESSION':
            // This is just the initial session check, don't do anything special
            console.log('Initial session loaded');
            break;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await authSignIn(email, password);
      // The auth state change listener will handle setting the user
    } catch (error: any) {
      console.error('Sign in error:', error);
      showToast(error.message || 'Failed to sign in', 'error');
      throw error;
    }
  };

  const signUp = async (email: string, password: string, role: string = 'field_worker') => {
    try {
      await authSignUp(email, password, role);
      showToast('Account created successfully! Please check your email to verify your account.', 'success');
    } catch (error: any) {
      console.error('Sign up error:', error);
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
      console.error('Sign out error:', error);
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
        console.error('Error refreshing user:', error);
        setUser(null);
      } else {
        setUser(user);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
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