import React from 'react';
import { motion } from 'framer-motion';
import ModernSkyscraper from './ModernSkyscraper';

const BackgroundSkyscraper = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 opacity-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <ModernSkyscraper />
        </motion.div>
      </div>
      <div className="absolute left-0 bottom-0 w-64 h-64 opacity-5 rotate-180">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <ModernSkyscraper />
        </motion.div>
      </div>
    </div>
  );
};

export default BackgroundSkyscraper;