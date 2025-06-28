import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Server, Laptop } from 'lucide-react';
import WaveBackground from '../components/graphics/WaveBackground';

const Solutions = () => {
  const solutions = [
    {
      title: 'Enterprise Security',
      description: 'Comprehensive protection for large-scale organizations',
      icon: Shield,
      features: ['Advanced threat detection', 'Custom security policies', 'Enterprise-wide monitoring']
    },
    {
      title: 'Cloud Infrastructure',
      description: 'Secure cloud solutions with maximum uptime',
      icon: Server,
      features: ['Cloud security', 'Performance optimization', 'Automated scaling']
    },
    {
      title: 'Endpoint Protection',
      description: 'Complete device and network security',
      icon: Laptop,
      features: ['Device management', 'Threat prevention', 'Remote security']
    }
  ];

  return (
    <div className="relative max-w-md mx-auto px-4 py-8">
      <WaveBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="text-center">
          <motion.h1
            className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            Security Solutions
          </motion.h1>
          <p className="text-gray-300">
            Tailored security solutions for every need
          </p>
        </div>

        <div className="grid gap-6">
          {solutions.map(({ icon: Icon, title, description, features }, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-blue-500/20"
            >
              <Icon className="w-8 h-8 text-blue-400 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
              <p className="text-gray-400 mb-4">{description}</p>
              <ul className="space-y-2">
                {features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-gray-300">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Solutions;