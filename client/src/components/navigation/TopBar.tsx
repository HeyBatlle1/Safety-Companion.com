import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../logo/Logo';

const TopBar: React.FC = () => {
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
    } catch (error) {
      
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-blue-500/20"
    >
      <div className="max-w-md mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Logo />
          
          <div className="flex items-center space-x-3">
            {/* User Menu */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 bg-slate-800/50 rounded-lg text-gray-300 hover:text-white hover:bg-slate-700/50 transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="text-sm hidden sm:block">
                  {user?.email?.split('@')[0] || 'User'}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </motion.button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 bg-slate-800/95 backdrop-blur-sm border border-blue-500/20 rounded-lg shadow-xl"
                    style={{ zIndex: 1000 }}
                  >
                    <div className="p-3 border-b border-slate-700/50">
                      <p className="text-sm text-gray-300 truncate">{user?.email}</p>
                      <p className="text-xs text-gray-400">Safety Companion User</p>
                    </div>
                    
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSignOut}
                      className="w-full flex items-center space-x-2 p-3 text-left text-gray-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Sign Out</span>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </motion.header>
  );
};

export default TopBar;