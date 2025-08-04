import React from 'react';
import { motion } from 'framer-motion';
import GlassSkyscraper from './GlassSkyscraper';
import LogoText from './LogoText';

const Logo = () => {
  return (
    <motion.div 
      className="flex items-center"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <div className="relative w-12 h-12">
        {/* Glowing effect */}
        <div className="absolute inset-0 blur-lg bg-blue-400/20 rounded-full" />
        <GlassSkyscraper />
      </div>
      <LogoText />
    </motion.div>
  );
};

export default Logo;