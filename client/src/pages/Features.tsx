import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Bell, Users, Cloud, Database } from 'lucide-react';
import WaveBackground from '../components/graphics/WaveBackground';

const Features = () => {
  const features = [
    {
      icon: Shield,
      title: 'Advanced Protection',
      description: 'Multi-layered security system with AI-powered threat detection',
    },
    {
      icon: Lock,
      title: 'Secure Access',
      description: 'Role-based access control with multi-factor authentication',
    },
    {
      icon: Bell,
      title: 'Real-time Alerts',
      description: 'Instant notifications for security events and system status',
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Collaborative security management for teams of any size',
    },
    {
      icon: Cloud,
      title: 'Cloud Security',
      description: 'Protected cloud infrastructure with automated backups',
    },
    {
      icon: Database,
      title: 'Data Protection',
      description: 'End-to-end encryption for all sensitive information',
    },
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
            Security Features
          </motion.h1>
          <p className="text-gray-300">
            Comprehensive protection for your digital assets
          </p>
        </div>

        <div className="grid gap-4">
          {features.map(({ icon: Icon, title, description }, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-blue-500/20"
            >
              <Icon className="w-8 h-8 text-blue-400 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
              <p className="text-gray-400">{description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Features;