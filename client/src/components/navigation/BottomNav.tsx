import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, User, Map, MessageCircle, Layout, FileText, Wrench, Clock, ClipboardCheck, Users, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Map, label: 'Maps', path: '/maps' },
    { icon: MessageCircle, label: 'Chat', path: '/chat' },
    { icon: ClipboardCheck, label: 'JHA', path: '/checklists' },
    { icon: Layout, label: 'Drawings', path: '/drawings' },

    { icon: Clock, label: 'History', path: '/history' },
    { 
      icon: Wrench, 
      label: <div className="flex flex-col items-center leading-tight">
              <span className="text-xs">ToolBox</span>
              <span className="text-xs">Talks</span>
             </div>, 
      path: '/videos' 
    },
    { icon: TrendingUp, label: 'Analytics', path: '/analytics' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Users, label: 'Profiles', path: '/profiles' },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-40 pointer-events-none">
      {/* Transparent backdrop with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/80 to-transparent backdrop-blur-xl" />
      
      {/* Navigation content */}
      <div className="relative w-full pointer-events-auto">
        <div className="flex justify-center py-3">
          <div className="flex justify-around max-w-2xl w-full px-4">
          {navItems.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            return (
              <motion.button
                key={path}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center p-3 relative transition-all duration-300 ${
                  isActive ? 'text-blue-400' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {/* Active indicator with glow effect */}
                {isActive && (
                  <>
                    <motion.div
                      layoutId="bottomNav"
                      className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl border border-blue-500/30"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-cyan-400/10 rounded-2xl blur-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </>
                )}
                
                {/* Icon with enhanced styling */}
                <motion.div
                  className="relative z-10"
                  animate={isActive ? { y: -2 } : { y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Icon className={`w-6 h-6 transition-all duration-300 ${
                    isActive 
                      ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' 
                      : 'hover:drop-shadow-[0_0_4px_rgba(156,163,175,0.3)]'
                  }`} />
                </motion.div>
                
                {/* Label with enhanced typography */}
                <motion.div 
                  className={`text-xs mt-1 relative z-10 font-medium transition-all duration-300 ${
                    isActive 
                      ? 'text-blue-400 drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]' 
                      : 'text-gray-400'
                  }`}
                  animate={isActive ? { y: -1 } : { y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {label}
                </motion.div>
                
                {/* Subtle pulse animation for active state */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-2xl"
                    animate={{ 
                      scale: [1, 1.05, 1],
                      opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
              </motion.button>
            );
          })}
          </div>
        </div>
      </div>
      
      {/* Bottom safe area for mobile devices */}
      <div className="h-safe-area-inset-bottom bg-gradient-to-t from-slate-900/60 to-transparent" />
    </nav>
  );
};

export default BottomNav;