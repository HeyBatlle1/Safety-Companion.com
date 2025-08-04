import React from 'react';
import { motion } from 'framer-motion';

const ModernSkyscraper = () => {
  return (
    <motion.svg
      width="100%"
      height="100%"
      viewBox="0 0 200 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <defs>
        <linearGradient id="building-gradient" x1="0" y1="0" x2="200" y2="300">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="glass-reflection" x1="0" y1="0" x2="200" y2="300">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      <motion.g
        animate={{ rotateY: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {/* Main Tower */}
        <motion.path
          d="M100 10 L60 290 L140 290 L100 10"
          fill="url(#building-gradient)"
          stroke="#38BDF8"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2 }}
        />

        {/* Secondary Towers */}
        <motion.path
          d="M85 40 L55 290 L75 290 L85 40"
          fill="url(#building-gradient)"
          stroke="#38BDF8"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 0.2 }}
        />
        <motion.path
          d="M115 40 L125 290 L145 290 L115 40"
          fill="url(#building-gradient)"
          stroke="#38BDF8"
          strokeWidth="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 0.4 }}
        />

        {/* Horizontal Glass Panels - Main Tower */}
        {[...Array(20)].map((_, i) => (
          <motion.line
            key={`h-main-${i}`}
            x1={70 + (i * 0.5)}
            y1={25 + (i * 13)}
            x2={130 - (i * 0.5)}
            y2={25 + (i * 13)}
            stroke="#38BDF8"
            strokeWidth="0.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: i * 0.05 }}
          />
        ))}

        {/* Vertical Glass Panels */}
        {[...Array(8)].map((_, i) => (
          <motion.line
            key={`v-${i}`}
            x1={75 + (i * 7)}
            y1={20}
            x2={65 + (i * 10)}
            y2={285}
            stroke="#38BDF8"
            strokeWidth="0.3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: i * 0.1 }}
          />
        ))}

        {/* Reflection Overlay */}
        <motion.path
          d="M100 10 L60 290 L140 290 L100 10"
          fill="url(#glass-reflection)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
        />

        {/* Animated Light Reflection */}
        <motion.rect
          width="10"
          height="280"
          fill="white"
          opacity="0.1"
          initial={{ x: 50, opacity: 0 }}
          animate={{ 
            x: 140,
            opacity: [0, 0.2, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear"
          }}
        />
      </motion.g>
    </motion.svg>
  );
};

export default ModernSkyscraper;