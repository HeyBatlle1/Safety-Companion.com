import React from 'react';
import { motion } from 'framer-motion';

interface ChecklistBuildingProps {
  delay?: number;
  color?: string;
}

const ChecklistBuilding: React.FC<ChecklistBuildingProps> = ({ 
  delay = 0, 
  color = '#38BDF8' 
}) => {
  const gradientId = `building-gradient-${Math.random().toString(36).substr(2, 9)}`;
  const reflectionId = `glass-reflection-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <motion.div
      className="w-8 h-8 flex items-center justify-center bg-slate-900/80 rounded-md backdrop-blur-sm border border-slate-700/50"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        delay: delay,
        type: "spring", 
        stiffness: 100, 
        damping: 10 
      }}
    >
      <motion.svg
        width="32"
        height="32"
        viewBox="0 0 200 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{
          rotateY: [0, 5, -5, 0],
          rotateZ: [0, 1, -1, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="200" y2="300">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id={reflectionId} x1="0" y1="0" x2="200" y2="300">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        <motion.g>
          {/* Main Tower */}
          <motion.path
            d="M100 20 L70 280 L130 280 L100 20"
            fill={`url(#${gradientId})`}
            stroke={color}
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: delay }}
          />

          {/* Left Tower */}
          <motion.path
            d="M85 50 L60 280 L80 280 L85 50"
            fill={`url(#${gradientId})`}
            stroke={color}
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: delay + 0.1 }}
          />

          {/* Right Tower */}
          <motion.path
            d="M115 50 L120 280 L140 280 L115 50"
            fill={`url(#${gradientId})`}
            stroke={color}
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: delay + 0.2 }}
          />

          {/* Window Grid - Main Tower */}
          {[...Array(12)].map((_, i) => (
            <motion.line
              key={`window-${i}`}
              x1={80}
              y1={40 + (i * 20)}
              x2={120}
              y2={40 + (i * 20)}
              stroke={color}
              strokeWidth="0.8"
              opacity="0.7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: delay + 0.3 + (i * 0.02) }}
            />
          ))}

          {/* Vertical dividers */}
          {[90, 100, 110].map((x, i) => (
            <motion.line
              key={`vertical-${i}`}
              x1={x}
              y1={30}
              x2={x - (i * 2)}
              y2={275}
              stroke={color}
              strokeWidth="0.5"
              opacity="0.6"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: delay + 0.4 + (i * 0.1) }}
            />
          ))}

          {/* Reflection Overlay */}
          <motion.path
            d="M100 20 L70 280 L130 280 L100 20"
            fill={`url(#${reflectionId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              delay: delay + 1,
              ease: "easeInOut"
            }}
          />

          {/* Animated Light Streak */}
          <motion.rect
            width="6"
            height="260"
            fill="white"
            opacity="0.2"
            rx="1"
            initial={{ x: 65, opacity: 0 }}
            animate={{ 
              x: [65, 125, 65],
              opacity: [0, 0.4, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: delay + 2,
              ease: "easeInOut"
            }}
          />
        </motion.g>
      </motion.svg>
    </motion.div>
  );
};

export default ChecklistBuilding;