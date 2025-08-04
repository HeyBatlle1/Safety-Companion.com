import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Shield, Server, Laptop, Network, Lock, UserCheck } from 'lucide-react';

const Solutions = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

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
    <section className="py-20 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" id="solutions">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-4">
            Tailored Security Solutions
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Discover our comprehensive range of security solutions designed to protect your digital assets
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {solutions.map((solution, index) => {
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
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                <div className="relative p-8 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 hover:border-blue-500/40 transition-all">
                  <solution.icon className="w-12 h-12 text-blue-400 mb-6" />
                  <h3 className="text-xl font-semibold text-white mb-4">{solution.title}</h3>
                  <p className="text-gray-400 mb-6">{solution.description}</p>
                  <ul className="space-y-3">
                    {solution.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-gray-300">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-6 px-4 py-2 w-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:border-blue-500/40 rounded-lg text-blue-400 transition-all"
                  >
                    Learn More
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Celtic-inspired decorative element */}
        <div className="mt-20 flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8 }}
            className="w-24 h-24 relative"
          >
            <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl" />
            <svg className="w-full h-full text-blue-400/40" viewBox="0 0 100 100">
              <path
                d="M50 10 C20 10, 10 20, 10 50 C10 80, 20 90, 50 90 C80 90, 90 80, 90 50 C90 20, 80 10, 50 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M50 30 C30 30, 30 50, 50 50 C70 50, 70 70, 50 70 C30 70, 30 50, 50 50"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Solutions;