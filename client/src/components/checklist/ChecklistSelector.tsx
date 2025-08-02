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

const templates: Template[] = [
  {
    id: 'safety-assessment',
    title: 'Site Safety Assessment',
    icon: ClipboardCheck,
    description: 'Comprehensive site safety evaluation and risk assessment',
    color: 'from-emerald-500 to-teal-500'
  },
  {
    id: 'fall-protection',
    title: 'Fall Protection',
    icon: Shield,
    description: 'Ensures compliance with regulations preventing falls from heights',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'scaffold-safety',
    title: 'Scaffold Safety',
    icon: Construction,
    description: 'Safe scaffold setup and usage guidelines',
    color: 'from-cyan-500 to-blue-500'
  },
  {
    id: 'electrical-safety',
    title: 'Electrical Safety',
    icon: Zap,
    description: 'Addresses electrical hazards and compliance',
    color: 'from-blue-400 to-indigo-500'
  },
  {
    id: 'hazard-communication',
    title: 'Hazard Communication',
    icon: Beaker,
    description: 'Chemical hazards identification and labeling',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'respiratory-protection',
    title: 'Respiratory Protection',
    icon: Wind,
    description: 'Respiratory protection and PPE guidelines',
    color: 'from-teal-500 to-cyan-500'
  },
  {
    id: 'ppe',
    title: 'Personal Protective Equipment',
    icon: HardHat,
    description: 'PPE usage and maintenance guidelines',
    color: 'from-indigo-500 to-blue-500'
  },
  {
    id: 'ladder-safety',
    title: 'Ladder Safety',
    icon: Stairs,
    description: 'Safe ladder usage and inspection protocols',
    color: 'from-blue-500 to-teal-500'
  },
  {
    id: 'confined-space',
    title: 'Confined Space Entry',
    icon: Box,
    description: 'Procedures for confined space entry',
    color: 'from-emerald-500 to-green-500'
  },
  {
    id: 'fire-prevention',
    title: 'Fire Prevention',
    icon: Flame,
    description: 'Fire prevention strategies and protocols',
    color: 'from-blue-600 to-cyan-600'
  },
  {
    id: 'emergency-action',
    title: 'Emergency Action Plan',
    icon: AlertTriangle,
    description: 'Comprehensive emergency response procedures',
    color: 'from-indigo-600 to-blue-600'
  },
  {
    id: 'roche-hse',
    title: 'Roche SHE',
    icon: TestTube,
    description: 'Comprehensive SHE checklist for Roche laboratory operations',
    color: 'from-emerald-500 to-teal-500'
  },
  {
    id: 'lilly-hse',
    title: 'Eli Lilly & Co HSE',
    icon: Microscope,
    description: 'Complete HSE assessment for Eli Lilly facilities',
    color: 'from-blue-500 to-indigo-500'
  }
];

const ChecklistSelector: React.FC<ChecklistSelectorProps> = ({ onChecklistClick }) => {
  const [enterpriseMode, setEnterpriseMode] = useState(false);

  return (
    <>
      {/* Enterprise Mode Toggle */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-center"
      >
        <div className="bg-slate-800/60 backdrop-blur-sm border border-blue-500/20 rounded-full px-6 py-3 flex items-center space-x-4">
          <Label htmlFor="enterprise-mode" className="text-sm font-medium text-gray-300 cursor-pointer">
            Standard Mode
          </Label>
          <Switch
            id="enterprise-mode"
            checked={enterpriseMode}
            onCheckedChange={setEnterpriseMode}
          />
          <Label htmlFor="enterprise-mode" className="text-sm font-medium text-gray-300 cursor-pointer flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Enterprise Mode</span>
            <Badge variant="secondary" className="ml-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0">
              NEW
            </Badge>
          </Label>
        </div>
      </motion.div>

      {/* Mode Description */}
      <motion.div
        key={enterpriseMode ? "enterprise" : "standard"}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-center mb-8"
      >
        {enterpriseMode ? (
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white flex items-center justify-center space-x-2">
              <Star className="w-6 h-6 text-yellow-400" />
              <span>Enterprise Professional Interface</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Advanced inspection tools with toggle switches, photo uploads, severity sliders, and professional 
              UI components designed for tablet use in the field. Perfect for construction supervisors and safety managers.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Standard Safety Checklists</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Traditional text-based checklists with comprehensive questions and intelligent AI analysis. 
              Ideal for quick assessments and compliance documentation.
            </p>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {templates.map((template, index) => (
        <motion.div
          key={template.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChecklistClick(enterpriseMode ? `enterprise-${template.id}` : template.id)}
          className="relative group cursor-pointer"
        >
          <div className={`absolute inset-0 bg-gradient-to-r ${template.color} rounded-xl opacity-10 group-hover:opacity-20 transition-all duration-300 blur-sm group-hover:blur-md`} />
          <div className="relative p-6 rounded-xl bg-slate-800/60 backdrop-blur-sm border border-blue-500/20 group-hover:border-blue-400/40 transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg bg-gradient-to-r ${template.color} shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                <template.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                  {template.title}
                </h3>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                  {template.description}
                </p>
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
    </>
  );
};

export default ChecklistSelector;