import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

// Clean, professional checklist templates - no backup trash
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
    id: 'electrical-safety',
    title: 'Electrical Safety Audit',
    icon: ChecklistBuilding,
    description: 'High-voltage and electrical systems hazard assessment',
    color: 'from-slate-800 to-slate-900',
    iconColor: '#1E40AF'
  },
  {
    id: 'fall-protection',
    title: 'Fall Protection Systems',
    icon: ChecklistBuilding,
    description: 'Critical height work safety with OSHA compliance tracking',
    color: 'from-slate-700 to-slate-800',
    iconColor: '#374151'
  }
];

const ChecklistSelector: React.FC<ChecklistSelectorProps> = ({ onChecklistClick }) => {
  return (
    <div className="w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center space-x-3">
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

      {/* Clean checklist grid */}
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
            <div className="relative p-6 rounded-lg bg-slate-200 dark:bg-slate-700 backdrop-blur-sm border-2 border-slate-400 dark:border-slate-500 group-hover:border-blue-400 dark:group-hover:border-blue-400 transition-all duration-300 shadow-lg group-hover:shadow-xl">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200/50 dark:border-blue-800/50 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60 transition-all duration-300 flex items-center justify-center">
                  <ChecklistBuilding delay={index * 0.1} color={template.iconColor} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                    {template.title}
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-200 group-hover:text-slate-800 dark:group-hover:text-slate-100 transition-colors leading-relaxed">
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
  );
};

export default ChecklistSelector;