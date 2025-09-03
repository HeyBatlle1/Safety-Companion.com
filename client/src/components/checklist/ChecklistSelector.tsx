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
    color: 'from-gradient-to-r from-blue-600 via-purple-600 to-cyan-600',
    iconColor: '#8B5CF6'
  },
  {
    id: 'safety-assessment',
    title: '(BACKUP) Site Safety Assessment',
    icon: ChecklistBuilding,
    description: 'Original checklist - backup version',
    color: 'from-gray-600 to-gray-700',
    iconColor: '#6B7280'
  },
  {
    id: 'fall-protection',
    title: 'Fall Protection Systems',
    icon: ChecklistBuilding,
    description: 'Critical height work safety with OSHA compliance tracking',
    color: 'from-red-500 to-orange-500',
    iconColor: '#EF4444'
  },
  {
    id: 'electrical-safety',
    title: 'Electrical Safety Audit',
    icon: ChecklistBuilding,
    description: 'High-voltage and electrical systems hazard assessment',
    color: 'from-yellow-500 to-amber-500',
    iconColor: '#EAB308'
  },
  {
    id: 'hazard-communication',
    title: 'HazCom & Chemical Safety',
    icon: ChecklistBuilding,
    description: 'Material safety with AI chemical analysis integration',
    color: 'from-purple-500 to-pink-500',
    iconColor: '#A855F7'
  },
  {
    id: 'emergency-action',
    title: 'Emergency Action Plan',
    icon: ChecklistBuilding,
    description: 'Critical incident protocols with automated alerts',
    color: 'from-green-500 to-emerald-500',
    iconColor: '#22C55E'
  },
  {
    id: 'ppe',
    title: 'PPE Compliance Check',
    icon: ChecklistBuilding,
    description: 'Personal protective equipment verification system',
    color: 'from-indigo-500 to-blue-500',
    iconColor: '#6366F1'
  }
];

// Secondary checklists
const secondaryTemplates: Template[] = [
  {
    id: 'scaffold-safety',
    title: 'Scaffold Safety',
    icon: ChecklistBuilding,
    description: 'Scaffold setup and inspection protocols',
    color: 'from-gray-500 to-gray-600',
    iconColor: '#6B7280'
  },
  {
    id: 'respiratory-protection',
    title: 'Respiratory Protection',
    icon: ChecklistBuilding,
    description: 'Breathing apparatus and air quality checks',
    color: 'from-gray-500 to-gray-600',
    iconColor: '#6B7280'
  },
  {
    id: 'ladder-safety',
    title: 'Ladder Safety',
    icon: ChecklistBuilding,
    description: 'Ladder inspection and usage protocols',
    color: 'from-gray-500 to-gray-600',
    iconColor: '#6B7280'
  },
  {
    id: 'confined-space',
    title: 'Confined Space Entry',
    icon: ChecklistBuilding,
    description: 'Confined space procedures and permits',
    color: 'from-gray-500 to-gray-600',
    iconColor: '#6B7280'
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
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChecklistClick(template.id)}
              className="relative group cursor-pointer"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${template.color} rounded-xl opacity-20 group-hover:opacity-30 transition-all duration-300 blur-md group-hover:blur-lg`} />
              <div className="relative p-6 rounded-xl bg-slate-800/80 backdrop-blur-sm border-2 border-blue-500/30 group-hover:border-blue-400/50 transition-all duration-300">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${template.color} shadow-xl group-hover:shadow-2xl transition-all duration-300 flex items-center justify-center`}>
                    <ChecklistBuilding delay={index * 0.1} color={template.iconColor} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                      {template.title}
                    </h3>
                    <p className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors">
                      {template.description}
                    </p>
                    <div className="mt-3 flex items-center space-x-2">
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">AI Analysis</Badge>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Submit</Badge>
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
              onClick={() => onChecklistClick(template.id)}
              className="relative group cursor-pointer"
            >
              <div className="relative p-4 rounded-lg bg-slate-800/40 backdrop-blur-sm border border-gray-600/30 group-hover:border-gray-500/50 transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <div className={`p-1 rounded-lg bg-gradient-to-r ${template.color} flex items-center justify-center`}>
                    <ChecklistBuilding delay={0.6 + index * 0.05} color={template.iconColor} />
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