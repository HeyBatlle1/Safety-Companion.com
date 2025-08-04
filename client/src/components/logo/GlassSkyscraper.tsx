import React from 'react';
import { motion } from 'framer-motion';

const GlassSkyscraper = () => {
  return (
    <motion.svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Base gradient for glass effect */}
      <defs>
        <linearGradient id="glass-gradient" x1="0" y1="0" x2="100" y2="100">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="reflection-gradient" x1="0" y1="0" x2="100" y2="100">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Rotating container */}
      <motion.g
        animate={{ rotateY: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {/* Main building structure */}
        <motion.path
          d="M50 10 L30 90 L70 90 Z"
          fill="url(#glass-gradient)"
          stroke="#38BDF8"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />

        {/* Glass panels - vertical */}
        {[...Array(5)].map((_, i) => (
          <motion.line
            key={`v-${i}`}
            x1={40 + (i * 5)}
            y1={20}
            x2={35 + (i * 5)}
            y2={85}
            stroke="#38BDF8"
            strokeWidth="0.2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: i * 0.2 }}
          />
        ))}

        {/* Glass panels - horizontal */}
        {[...Array(8)].map((_, i) => (
          <motion.line
            key={`h-${i}`}
            x1={35 + (i * 2)}
            y1={25 + (i * 8)}
            x2={65 - (i * 2)}
            y2={25 + (i * 8)}
            stroke="#38BDF8"
            strokeWidth="0.2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: i * 0.2 }}
          />
        ))}

        {/* Reflection effect */}
        <motion.path
          d="M50 10 L30 90 L70 90 Z"
          fill="url(#reflection-gradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
        />

        {/* Animated highlight */}
        <motion.rect
          width="5"
          height="80"
          fill="white"
          opacity="0.1"
          initial={{ x: -10 }}
          animate={{ x: 100 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear",
          }}
        />
      </motion.g>
    </motion.svg>
  );
};

export default GlassSkyscraper;