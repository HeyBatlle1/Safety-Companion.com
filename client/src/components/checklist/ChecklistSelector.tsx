import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Construction, Zap, Beaker, Wind, HardHat, Stars as Stairs, Box, Flame, AlertTriangle, TestTube, Microscope, ClipboardCheck, Sparkles, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Template {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  color: string;
}

interface ChecklistSelectorProps {
  onChecklistClick: (templateId: string) => void;
}

// First 6 priority checklists for railway & AI integration
const primaryTemplates: Template[] = [
  {
    id: 'site-safety-assessment',
    title: 'Daily Site Safety Inspection',
    icon: Shield,
    description: 'AI-powered comprehensive site evaluation with railway hazard detection',
    color: 'from-blue-600 to-cyan-600'
  },
  {
    id: 'fall-protection',
    title: 'Fall Protection Systems',
    icon: AlertTriangle,
    description: 'Critical height work safety with intelligent risk scoring',
    color: 'from-red-500 to-orange-500'
  },
  {
    id: 'electrical-safety',
    title: 'Electrical Safety Audit',
    icon: Zap,
    description: 'High-voltage and railway electrical systems inspection',
    color: 'from-yellow-500 to-amber-500'
  },
  {
    id: 'hazcom',
    title: 'HazCom & Chemical Safety',
    icon: Beaker,
    description: 'Material safety with AI chemical analysis integration',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'emergency-response',
    title: 'Emergency Response Plan',
    icon: HardHat,
    description: 'Critical incident protocols with automated alerts',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'ppe-compliance',
    title: 'PPE Compliance Check',
    icon: Construction,
    description: 'Personal protective equipment verification system',
    color: 'from-indigo-500 to-blue-500'
  }
];

// Secondary checklists
const secondaryTemplates: Template[] = [
  {
    id: 'scaffold-safety',
    title: 'Scaffold Safety',
    icon: Stairs,
    description: 'Scaffold setup and inspection protocols',
    color: 'from-gray-500 to-gray-600'
  },
  {
    id: 'respiratory-protection',
    title: 'Respiratory Protection',
    icon: Wind,
    description: 'Breathing apparatus and air quality checks',
    color: 'from-gray-500 to-gray-600'
  },
  {
    id: 'ladder-safety',
    title: 'Ladder Safety',
    icon: Box,
    description: 'Ladder inspection and usage protocols',
    color: 'from-gray-500 to-gray-600'
  },
  {
    id: 'confined-space',
    title: 'Confined Space Entry',
    icon: Flame,
    description: 'Confined space procedures and permits',
    color: 'from-gray-500 to-gray-600'
  }
];

const templates = [...primaryTemplates, ...secondaryTemplates];

const ChecklistSelector: React.FC<ChecklistSelectorProps> = ({ onChecklistClick }) => {
  return (
    <>
      {/* Priority Section Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h2 className="text-2xl font-bold text-white flex items-center justify-center space-x-3 mb-4">
          <Star className="w-6 h-6 text-yellow-400" />
          <span>Priority Safety Checklists</span>
          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
            AI + Railway Ready
          </Badge>
        </h2>
        <p className="text-gray-300 max-w-3xl mx-auto">
          Enterprise-grade safety inspection system with AI analysis, railway integration, and real-time hazard detection. 
          Optimized for tablets with professional components including photo uploads, severity sliders, and intelligent prompting.
        </p>
      </motion.div>

      {/* Priority Checklists - First 6 */}
      <div className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {primaryTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChecklistClick(`enterprise-${template.id}`)}
              className="relative group cursor-pointer"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${template.color} rounded-xl opacity-20 group-hover:opacity-30 transition-all duration-300 blur-md group-hover:blur-lg`} />
              <div className="relative p-6 rounded-xl bg-slate-800/80 backdrop-blur-sm border-2 border-blue-500/30 group-hover:border-blue-400/50 transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className={`p-4 rounded-lg bg-gradient-to-r ${template.color} shadow-xl group-hover:shadow-2xl transition-all duration-300`}>
                    <template.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                      {template.title}
                    </h3>
                    <p className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors">
                      {template.description}
                    </p>
                    <div className="mt-3 flex items-center space-x-2">
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">AI Ready</Badge>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Railway</Badge>
                    </div>
                  </div>
                </div>
                
                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Secondary Checklists */}
      <div>
        <h3 className="text-lg font-semibold text-gray-400 mb-4 text-center">Additional Safety Checklists</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {secondaryTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.05 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChecklistClick(`enterprise-${template.id}`)}
              className="relative group cursor-pointer"
            >
              <div className="relative p-4 rounded-lg bg-slate-800/40 backdrop-blur-sm border border-gray-600/30 group-hover:border-gray-500/50 transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${template.color}`}>
                    <template.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-md font-medium text-gray-300 group-hover:text-white transition-colors">
                      {template.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {template.description}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ChecklistSelector;