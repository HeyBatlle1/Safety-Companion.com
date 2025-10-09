import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Zap, Shield, ChevronRight } from 'lucide-react';
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
    title: '(BACKUP) Fall Protection Systems',
    icon: ChecklistBuilding,
    description: 'Critical height work safety with OSHA compliance tracking',
    color: 'from-gray-600 to-gray-700',
    iconColor: '#6B7280'
  },
  {
    id: 'electrical-safety',
    title: '(BACKUP) Electrical Safety Audit',
    icon: ChecklistBuilding,
    description: 'High-voltage and electrical systems hazard assessment',
    color: 'from-blue-600 via-purple-600 to-cyan-600',
    iconColor: '#8B5CF6'
  },
  {
    id: 'hazard-communication',
    title: '(BACKUP) HazCom & Chemical Safety',
    icon: ChecklistBuilding,
    description: 'Material safety with AI chemical analysis integration',
    color: 'from-gray-600 to-gray-700',
    iconColor: '#6B7280'
  },
  {
    id: 'emergency-action',
    title: '(BACKUP) Emergency Action Plan',
    icon: ChecklistBuilding,
    description: 'Critical incident protocols with automated alerts',
    color: 'from-blue-600 via-purple-600 to-cyan-600',
    iconColor: '#8B5CF6'
  },
  {
    id: 'ppe',
    title: '(BACKUP) PPE Compliance Check',
    icon: ChecklistBuilding,
    description: 'Personal protective equipment verification system',
    color: 'from-gray-600 to-gray-700',
    iconColor: '#6B7280'
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
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

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

      {/* Priority Checklists - Blueprint Technical Cards */}
      <div className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {primaryTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 30, rotateX: 10 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ 
                y: -8,
                rotateX: 5,
                rotateY: hoveredCard === template.id ? 2 : 0,
                transition: { duration: 0.3 }
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChecklistClick(template.id)}
              onMouseEnter={() => setHoveredCard(template.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className="relative group cursor-pointer perspective-1000"
              style={{ transformStyle: 'preserve-3d' }}
              data-testid={`card-checklist-${template.id}`}
            >
              {/* Floating depth shadow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${template.color} rounded-lg opacity-30 blur-2xl group-hover:opacity-50 transition-all duration-500 transform translate-y-8 group-hover:translate-y-12 scale-95`} />
              
              {/* Main card container with technical corners */}
              <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-lg overflow-hidden border border-blue-500/30 group-hover:border-cyan-400/60 transition-all duration-300 transform-gpu">
                {/* Technical corner cuts */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400/50" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400/50" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400/50" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400/50" />

                {/* Blueprint grid pattern overlay */}
                <div 
                  className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px'
                  }}
                />

                {/* Scan line effect */}
                <div className="absolute inset-0 overflow-hidden">
                  <motion.div
                    className="absolute inset-x-0 h-32 bg-gradient-to-b from-cyan-400/0 via-cyan-400/10 to-cyan-400/0"
                    animate={{
                      y: hoveredCard === template.id ? [-100, 400] : -100
                    }}
                    transition={{
                      duration: 2,
                      repeat: hoveredCard === template.id ? Infinity : 0,
                      ease: "linear"
                    }}
                  />
                </div>

                {/* Status indicator lights */}
                <div className="absolute top-4 right-4 flex items-center space-x-1">
                  <motion.div 
                    className="w-2 h-2 rounded-full bg-green-400"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div 
                    className="w-2 h-2 rounded-full bg-blue-400"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                  />
                  <motion.div 
                    className="w-2 h-2 rounded-full bg-cyan-400"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                  />
                </div>

                {/* Card content */}
                <div className="relative p-6 pt-8">
                  {/* Icon section with holographic effect */}
                  <div className="mb-4 flex items-center justify-between">
                    <motion.div
                      className={`relative p-3 rounded-lg bg-gradient-to-br ${template.color} shadow-2xl`}
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      {/* Holographic shimmer */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer rounded-lg" />
                      <ChecklistBuilding delay={index * 0.1} color={template.iconColor} />
                    </motion.div>

                    {/* Action chevron */}
                    <motion.div
                      className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      animate={{ x: hoveredCard === template.id ? [0, 5, 0] : 0 }}
                      transition={{ duration: 1, repeat: hoveredCard === template.id ? Infinity : 0 }}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </motion.div>
                  </div>

                  {/* Title with safety stripe accent */}
                  <div className="mb-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="h-1 w-12 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 rounded-full" />
                      <Shield className="w-4 h-4 text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors leading-tight">
                      {template.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors mb-4 line-clamp-2">
                    {template.description}
                  </p>

                  {/* Badges with glow effect */}
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 group-hover:bg-blue-500/30 transition-colors">
                      <Zap className="w-3 h-3 mr-1" />
                      AI Analysis
                    </Badge>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30 group-hover:bg-green-500/30 transition-colors">
                      Submit
                    </Badge>
                  </div>

                  {/* Bottom accent line */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Secondary Checklists - Compact Tech Style */}
      <div>
        <h3 className="text-lg font-semibold text-gray-400 mb-4 text-center flex items-center justify-center space-x-2">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-gray-500" />
          <span>Additional Safety Checklists</span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-gray-500" />
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {secondaryTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.05 }}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChecklistClick(template.id)}
              className="relative group cursor-pointer"
              data-testid={`card-checklist-${template.id}`}
            >
              <div className="relative p-4 rounded-lg bg-slate-800/60 backdrop-blur-sm border border-gray-600/30 group-hover:border-cyan-400/50 transition-all duration-300 overflow-hidden">
                {/* Subtle scan line */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-cyan-400/0 animate-pulse" />
                </div>

                <div className="relative flex items-center space-x-3">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${template.color} shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <ChecklistBuilding delay={0.6 + index * 0.05} color={template.iconColor} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-md font-medium text-gray-300 group-hover:text-white transition-colors">
                      {template.title}
                    </h3>
                    <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                      {template.description}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add shimmer animation to global styles */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </>
  );
};

export default ChecklistSelector;
