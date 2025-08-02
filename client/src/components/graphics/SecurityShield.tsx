import React from 'react';
import { motion } from 'framer-motion';

const SecurityShield = () => {
  return (
    <motion.svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.path
        d="M100 20L40 50V95C40 138 65 178 100 190C135 178 160 138 160 95V50L100 20Z"
        stroke="url(#shield-gradient)"
        strokeWidth="4"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />
      <motion.path
        d="M80 95L95 110L120 85"
        stroke="#38BDF8"
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 1 }}
      />
      <defs>
        <linearGradient id="shield-gradient" x1="40" y1="20" x2="160" y2="190">
          <stop stopColor="#38BDF8" />
          <stop offset="1" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
};

export default SecurityShield;