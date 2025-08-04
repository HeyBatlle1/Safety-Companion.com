import React from 'react';
import { motion } from 'framer-motion';

const ProfileBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.svg
        className="w-full h-full opacity-10"
        viewBox="0 0 100 100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 1 }}
      >
        <pattern
          id="grid"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 10 0 L 0 0 0 10"
            fill="none"
            stroke="url(#grid-gradient)"
            strokeWidth="0.5"
          />
        </pattern>
        <rect width="100" height="100" fill="url(#grid)" />
        <defs>
          <linearGradient id="grid-gradient" x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
      </motion.svg>
    </div>
  );
};

export default ProfileBackground;