import React from 'react';
import { motion } from 'framer-motion';

const CelticKnot = () => {
  return (
    <motion.svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="transform rotate-45"
      initial={{ rotate: 0 }}
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    >
      {/* Outer circle */}
      <motion.circle
        cx="50"
        cy="50"
        r="45"
        stroke="currentColor"
        strokeWidth="2"
        className="text-blue-400"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />
      
      {/* Celtic knot pattern */}
      <motion.path
        d="M30 50 C30 30, 50 30, 50 50 C50 70, 70 70, 70 50 C70 30, 50 30, 50 50 C50 70, 30 70, 30 50"
        stroke="currentColor"
        strokeWidth="3"
        className="text-cyan-300"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
      />
      
      {/* Inner trinity knots */}
      <motion.path
        d="M40 50 C40 40, 50 40, 50 50 C50 60, 60 60, 60 50 C60 40, 50 40, 50 50 C50 60, 40 60, 40 50"
        stroke="currentColor"
        strokeWidth="2"
        className="text-blue-500"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, delay: 1, ease: "easeInOut" }}
      />
      
      {/* Center dot */}
      <motion.circle
        cx="50"
        cy="50"
        r="3"
        className="fill-blue-400"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 1.5 }}
      />
    </motion.svg>
  );
};

export default CelticKnot;