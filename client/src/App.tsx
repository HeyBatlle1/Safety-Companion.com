import React, { useState, useEffect } from 'react';
import { signIn, signUp, getCurrentUser, signOut } from './lib/supabase';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignUp) {
        await signUp(email, password, { display_name: email });
      } else {
        await signIn(email, password);
      }
      await checkUser();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading Safety Companion...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">Safety Companion</h1>
          <p className="text-gray-300 text-center mb-6">Enterprise Safety Management Platform</p>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-400 hover:text-blue-300 transition duration-200"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">Test with existing users:</p>
            <p className="text-xs text-gray-500 mt-1">heybattle@proton.me • mofficer@agmcompany.com</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-400">Safety Companion</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">Welcome, {user.email}</span>
            <button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto p-6">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4">Dashboard</h2>
          <p className="text-xl text-gray-300 mb-8">Enterprise Safety Management Platform</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-blue-400 mb-2">Safety Checklists</h3>
              <p className="text-gray-300">Manage daily, weekly, and monthly safety checks</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-green-400 mb-2">AI Safety Chat</h3>
              <p className="text-gray-300">Get instant safety guidance and recommendations</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-purple-400 mb-2">Analytics</h3>
              <p className="text-gray-300">Track safety metrics and compliance data</p>
            </div>
          </div>
          
          <div className="mt-8 bg-green-800 p-4 rounded-lg">
            <p className="text-green-200">✅ Authentication restored with Supabase</p>
            <p className="text-green-300 text-sm mt-1">Your valuable data is safe. Use rollback to restore full application.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;