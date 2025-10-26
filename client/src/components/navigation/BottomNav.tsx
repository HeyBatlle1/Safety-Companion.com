import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  House, 
  MapPin, 
  MessagesSquare, 
  ClipboardList, 
  FileImage,
  History,
  FileBarChart, 
  BarChart3, 
  UserCircle, 
  Users,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import supabase from '@/services/supabase';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasNewReports, setHasNewReports] = useState(false);
  const [lastCheckedReports, setLastCheckedReports] = useState<number>(0);

  // Check for new reports
  useEffect(() => {
    const checkForNewReports = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const response = await fetch('/api/analysis-history', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });

        if (response.ok) {
          const data = await response.json();
          const reports = data.history || data;
          const safetyReports = reports.filter((item: any) => 
            item.type === 'safety_assessment' || 
            item.type === 'jha_analysis' || 
            item.type === 'jha_multi_agent_analysis'
          );
          
          // Check if there are new reports since last visit
          const storedCount = localStorage.getItem('lastReportCount');
          const previousCount = storedCount ? parseInt(storedCount, 10) : 0;
          
          if (safetyReports.length > previousCount) {
            setHasNewReports(true);
          }
          
          // If on reports page, mark as seen
          if (location.pathname === '/reports') {
            localStorage.setItem('lastReportCount', safetyReports.length.toString());
            setHasNewReports(false);
          }
        }
      } catch (error) {
        console.error('Error checking reports:', error);
      }
    };

    checkForNewReports();
    const interval = setInterval(checkForNewReports, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [location.pathname]);

  const navItems = [
    { icon: House, label: 'Home', path: '/', testId: 'nav-home' },
    { icon: MapPin, label: 'Maps', path: '/maps', testId: 'nav-maps' },
    { icon: MessagesSquare, label: 'Chat', path: '/chat', testId: 'nav-chat' },
    { icon: ClipboardList, label: 'JHA', path: '/checklists', testId: 'nav-jha' },
    { icon: FileImage, label: 'Drawings', path: '/drawings', testId: 'nav-drawings' },
    { icon: History, label: 'History', path: '/history', testId: 'nav-history' },
    { icon: FileBarChart, label: 'Reports', path: '/reports', testId: 'nav-reports', hasNotification: hasNewReports },
    { icon: BarChart3, label: 'Analytics', path: '/analytics', testId: 'nav-analytics' },
    { icon: UserCircle, label: 'Profile', path: '/profile', testId: 'nav-profile' },
    { icon: Users, label: 'Team', path: '/profiles', testId: 'nav-team' },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-40 pointer-events-none">
      {/* Transparent backdrop with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/80 to-transparent backdrop-blur-xl" />
      
      {/* Navigation content */}
      <div className="relative w-full pointer-events-auto">
        <div className="flex justify-center py-4">
          <div className="flex justify-around max-w-3xl w-full px-6 gap-1">
          {navItems.map(({ icon: Icon, label, path, testId, hasNotification }) => {
            const isActive = location.pathname === path;
            return (
              <motion.button
                key={path}
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.08 }}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center p-3 relative transition-all duration-300 min-w-[60px] ${
                  isActive ? 'text-blue-400' : 'text-gray-400 hover:text-gray-300'
                }`}
                data-testid={testId}
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
                  animate={isActive ? { y: -3 } : { y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Icon 
                    className={`w-7 h-7 transition-all duration-300 ${
                      isActive 
                        ? 'drop-shadow-[0_0_10px_rgba(59,130,246,0.6)] stroke-[2]' 
                        : 'hover:drop-shadow-[0_0_6px_rgba(156,163,175,0.4)] stroke-[1.5]'
                    }`} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  
                  {/* Notification Badge */}
                  <AnimatePresence>
                    {hasNotification && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900 z-20"
                      >
                        <motion.div
                          className="absolute inset-0 bg-red-500 rounded-full"
                          animate={{
                            scale: [1, 1.4, 1],
                            opacity: [0.8, 0, 0.8]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                
                {/* Label with enhanced typography */}
                <motion.span 
                  className={`text-[11px] mt-1.5 relative z-10 font-semibold tracking-wide transition-all duration-300 ${
                    isActive 
                      ? 'text-blue-400 drop-shadow-[0_0_6px_rgba(59,130,246,0.4)]' 
                      : 'text-gray-400'
                  }`}
                  animate={isActive ? { y: -2 } : { y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {label}
                </motion.span>
                
                {/* Subtle pulse animation for active state */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-2xl"
                    animate={{ 
                      scale: [1, 1.06, 1],
                      opacity: [0.5, 0.9, 0.5]
                    }}
                    transition={{ 
                      duration: 2.5,
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
