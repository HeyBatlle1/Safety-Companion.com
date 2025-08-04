import React from 'react';
import { motion } from 'framer-motion';

const LogoText = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="ml-3"
    >
      <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
        Safety Companion
      </span>
    </motion.div>
  );
};

export default LogoText;