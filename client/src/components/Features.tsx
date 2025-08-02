import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Shield, Lock, Bell, Users, Cloud, Database } from 'lucide-react';

const Features = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

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
    <section className="py-20 bg-slate-900" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-4">
            Comprehensive Security Features
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Discover our advanced security features designed to keep your digital assets safe and your mind at peace.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const [ref, inView] = useInView({
              triggerOnce: true,
              threshold: 0.1,
            });

            return (
              <motion.div
                key={index}
                ref={ref}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="p-6 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 hover:border-blue-500/40 transition-all"
              >
                <feature.icon className="w-12 h-12 text-blue-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;