import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ChecklistBuilding from '@/components/graphics/ChecklistBuilding';

interface Template {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
  color: string;
  iconColor?: string;
}

interface ChecklistSelectorProps {
  onChecklistClick: (templateId: string) => void;
}

// Master JHA - Consolidated checklist with weather integration
const primaryTemplates: Template[] = [
  {
    id: 'master-jha',
    title: 'Master Job Hazard Analysis (JHA)',
    icon: ChecklistBuilding,
    description: 'Comprehensive OSHA-compliant safety analysis with automatic weather integration',
    color: 'from-slate-800 to-slate-900',
    iconColor: '#1E40AF'
  },
  {
    id: 'safety-assessment',
    title: '(BACKUP) Site Safety Assessment',
    icon: ChecklistBuilding,
    description: 'Original checklist - backup version',
    color: 'from-slate-700 to-slate-800',
    iconColor: '#374151'
  },
  {
    id: 'fall-protection',
    title: '(BACKUP) Fall Protection Systems',
    icon: ChecklistBuilding,
    description: 'Critical height work safety with OSHA compliance tracking',
    color: 'from-slate-700 to-slate-800',
    iconColor: '#374151'
  },
  {
    id: 'electrical-safety',
    title: '(BACKUP) Electrical Safety Audit',
    icon: ChecklistBuilding,
    description: 'High-voltage and electrical systems hazard assessment',
    color: 'from-slate-800 to-slate-900',
    iconColor: '#1E40AF'
  },
  {
    id: 'hazard-communication',
    title: '(BACKUP) HazCom & Chemical Safety',
    icon: ChecklistBuilding,
    description: 'Material safety with AI chemical analysis integration',
    color: 'from-slate-700 to-slate-800',
    iconColor: '#374151'
  },
  {
    id: 'emergency-action',
    title: '(BACKUP) Emergency Action Plan',
    icon: ChecklistBuilding,
    description: 'Critical incident protocols with automated alerts',
    color: 'from-slate-800 to-slate-900',
    iconColor: '#1E40AF'
  },
  {
    id: 'ppe',
    title: '(BACKUP) PPE Compliance Check',
    icon: ChecklistBuilding,
    description: 'Personal protective equipment verification system',
    color: 'from-slate-700 to-slate-800',
    iconColor: '#374151'
  }
];

// Secondary checklists
const secondaryTemplates: Template[] = [
  {
    id: 'scaffold-safety',
    title: 'Scaffold Safety',
    icon: ChecklistBuilding,
    description: 'Scaffold setup and inspection protocols',
    color: 'from-slate-600 to-slate-700',
    iconColor: '#4B5563'
  },
  {
    id: 'respiratory-protection',
    title: 'Respiratory Protection',
    icon: ChecklistBuilding,
    description: 'Breathing apparatus and air quality checks',
    color: 'from-slate-600 to-slate-700',
    iconColor: '#4B5563'
  },
  {
    id: 'ladder-safety',
    title: 'Ladder Safety',
    icon: ChecklistBuilding,
    description: 'Ladder inspection and usage protocols',
    color: 'from-slate-600 to-slate-700',
    iconColor: '#4B5563'
  },
  {
    id: 'confined-space',
    title: 'Confined Space Entry',
    icon: ChecklistBuilding,
    description: 'Confined space procedures and permits',
    color: 'from-slate-600 to-slate-700',
    iconColor: '#4B5563'
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
          <span>Strategic Safety Assessment System</span>
          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
            Gemini AI Powered
          </Badge>
        </h2>
        <p className="text-gray-300 max-w-3xl mx-auto">
          Each checklist contains strategic questions with weighted scoring, OSHA compliance tracking, and intelligent prompting 
          that feeds directly into our Gemini AI algorithms for real-time risk analysis and safety recommendations.
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
              whileHover={{ scale: 1.02, y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChecklistClick(template.id)}
              className="relative group cursor-pointer"
            >
              <div className="relative p-6 rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-gray-200/80 dark:border-slate-700/80 group-hover:border-blue-300/60 dark:group-hover:border-blue-500/60 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200/50 dark:border-blue-800/50 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60 transition-all duration-300 flex items-center justify-center">
                    <ChecklistBuilding delay={index * 0.1} color={template.iconColor} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                      {template.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors leading-relaxed">
                      {template.description}
                    </p>
                    <div className="mt-4 flex items-center space-x-2">
                      <Badge className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/50 text-xs font-medium">AI Analysis</Badge>
                      <Badge className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200/50 dark:border-green-800/50 text-xs font-medium">Submit</Badge>
                    </div>
                  </div>
                </div>
                
                {/* Professional accent line */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChecklistClick(template.id)}
              className="relative group cursor-pointer"
            >
              <div className="relative p-4 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-gray-200/60 dark:border-slate-700/60 group-hover:border-gray-300/80 dark:group-hover:border-slate-600/80 transition-all duration-300 shadow-md group-hover:shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-200/50 dark:border-slate-600/50 group-hover:bg-gray-100 dark:group-hover:bg-slate-600/60 transition-all duration-300 flex items-center justify-center">
                    <ChecklistBuilding delay={0.6 + index * 0.05} color={template.iconColor} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200 group-hover:text-gray-800 dark:group-hover:text-white transition-colors">
                      {template.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
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