import React from 'react';
import { motion } from 'framer-motion';
import Logo from '../logo/Logo';
import DatabaseStatusChecker from '../common/DatabaseStatusChecker';

interface TopBarProps {
  onDatabaseStatusChange?: (status: 'ok' | 'warning' | 'error') => void;
}

const TopBar: React.FC<TopBarProps> = ({ onDatabaseStatusChange }) => {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-blue-500/20"
    >
      <div className="max-w-md mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Logo />
          
          <div className="flex items-center space-x-2">
            <DatabaseStatusChecker onStatusChange={onDatabaseStatusChange} />
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default TopBar;