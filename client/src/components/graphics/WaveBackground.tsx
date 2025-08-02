import React from 'react';
import { motion } from 'framer-motion';

const WaveBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 1 }}
      >
        <motion.path
          d="M0 50 Q25 40 50 50 T100 50 V100 H0 Z"
          fill="url(#wave-gradient)"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{
            repeat: Infinity,
            repeatType: "reverse",
            duration: 10,
            ease: "easeInOut",
          }}
        />
        <defs>
          <linearGradient id="wave-gradient" x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
      </motion.svg>
    </div>
  );
};

export default WaveBackground;