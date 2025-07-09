import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn as supabaseSignIn, signUp as supabaseSignUp, signOut as supabaseSignOut, getCurrentUser, supabase } from '../services/supabase';
import { showToast } from '../components/common/ToastContainer';
import { logError } from '../utils/errorHandler';

interface AuthContextType {
  user: { id: string; email: string } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithProvider: (provider: 'google' | 'azure') => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          setUser({ 
            id: session.user.id, 
            email: session.user.email || '' 
          });
          
          // If user just signed in via OAuth, navigate to dashboard
          if (event === 'SIGNED_IN' && session.user.app_metadata?.provider) {
            navigate('/');
            showToast(`Successfully signed in with ${session.user.app_metadata.provider}`, 'success');
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        logError(error, 'Auth:StateChange');
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    // Initial user load
    const loadInitialUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser({
            id: currentUser.id,
            email: currentUser.email || ''
          });
        }
      } catch (error) {
        logError(error, 'Auth:InitialLoad');
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialUser();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const user = await supabaseSignIn(email, password);
      if (user) {
        setUser({ id: user.id, email: user.email || '' });
        navigate('/');
        showToast('Successfully signed in', 'success');
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      logError(error, 'Auth:SignIn');
      const message = error instanceof Error ? error.message : 'Invalid email or password';
      showToast(message, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const user = await supabaseSignUp(email, password);
      if (user) {
        setUser({ id: user.id, email: user.email || '' });
        navigate('/');
        showToast('Successfully registered and signed in', 'success');
      } else {
        throw new Error('Failed to create account');
      }
    } catch (error) {
      logError(error, 'Auth:SignUp');
      const message = error instanceof Error ? error.message : 'Failed to register. Please try again.';
      showToast(message, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithProvider = async (provider: 'google' | 'azure') => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider === 'azure' ? 'azure' : 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: provider === 'azure' ? {
            prompt: 'select_account',
          } : undefined,
        },
      });

      if (error) {
        throw error;
      }

      // Note: The actual sign-in completion will be handled by the auth state change listener
      // when the OAuth flow completes and redirects back to the app
    } catch (error) {
      logError(error, `Auth:OAuth:${provider}`);
      const message = error instanceof Error ? error.message : `Failed to sign in with ${provider}`;
      showToast(message, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabaseSignOut();
      setUser(null);
      navigate('/login');
      showToast('Successfully logged out', 'success');
    } catch (error) {
      logError(error, 'Auth:Logout');
      showToast('Failed to log out', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithProvider, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
