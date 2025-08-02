import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import ModernSkyscraper from '../components/graphics/ModernSkyscraper';
import WaveBackground from '../components/graphics/WaveBackground';
import WeatherObservationCenter from '../components/weather/WeatherObservationCenter';

const Home = () => {
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    // Cycle through animation phases for dynamic building display
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative max-w-2xl mx-auto px-4 py-8">
      <WaveBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        {/* Hero Section with Building Animation */}
        <div className="text-center">
          <motion.div 
            className="flex justify-center mb-8"
            initial={{ scale: 0.8, rotateY: -15 }}
            animate={{ 
              scale: 1,
              rotateY: 0,
              rotateX: animationPhase * 2,
            }}
            transition={{ 
              type: "spring", 
              stiffness: 100, 
              damping: 15,
              duration: 0.8 
            }}
          >
            <div className="w-64 h-80 md:w-80 md:h-96 relative">
              {/* Animated glow effect */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-t from-blue-400/30 via-cyan-400/20 to-transparent rounded-2xl blur-3xl"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              {/* Building with dynamic lighting */}
              <motion.div
                animate={{
                  y: [0, -5, 0],
                  rotateZ: [0, 1, -1, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <ModernSkyscraper />
              </motion.div>
              
              {/* Floating particles around building */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-blue-400/60 rounded-full"
                  style={{
                    left: `${20 + Math.cos(i * 0.8) * 30}%`,
                    top: `${30 + Math.sin(i * 0.8) * 40}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 0.8, 0.3],
                    scale: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 3 + i * 0.2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          </motion.div>
          
          <motion.h1
            className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 mb-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Safety Companion
          </motion.h1>
          
          <motion.p
            className="text-gray-300 text-lg mb-8 max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Your AI-powered construction safety assistant for real-time guidance and site protection
          </motion.p>
        </div>

        {/* Weather Observation Center */}
        <motion.div 
          className="w-full max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              delay: 0.8, 
              type: "spring",
              stiffness: 200 
            }}
          >
            <WeatherObservationCenter />
          </motion.div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2 }}
        >
          <motion.button
            onClick={() => window.location.href = '/checklists'}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-full font-semibold"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 10px 30px rgba(59, 130, 246, 0.5)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            <Shield className="w-5 h-5" />
            <span>Start Safety Check</span>
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Home;