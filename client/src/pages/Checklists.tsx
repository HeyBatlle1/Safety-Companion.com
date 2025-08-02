import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardCheck, ArrowRight } from 'lucide-react';
import ChecklistSelector from '../components/checklist/ChecklistSelector';

const Checklists: React.FC = () => {
  const navigate = useNavigate();

  const handleChecklistClick = (templateId: string) => {

    navigate(`/checklist/${templateId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <ClipboardCheck className="w-10 h-10 text-cyan-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Safety Checklists
            </h1>
          </div>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            AI-powered safety assessments with intelligent algorithms and prompting logic. 
            Select a checklist to begin your comprehensive safety evaluation.
          </p>
        </motion.div>

        {/* Checklist Selector */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <ChecklistSelector onChecklistClick={handleChecklistClick} />
        </motion.div>

        {/* Algorithm Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl p-8 border border-blue-500/20"
        >
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
            <ArrowRight className="w-6 h-6 text-cyan-400" />
            <span>Smart Assessment Features</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-gray-300">
            <div>
              <h3 className="font-semibold text-cyan-400 mb-2">AI Analysis</h3>
              <p className="text-sm">Advanced algorithms analyze your responses and provide intelligent safety recommendations.</p>
            </div>
            <div>
              <h3 className="font-semibold text-cyan-400 mb-2">Risk Scoring</h3>
              <p className="text-sm">Each response is weighted and scored to calculate comprehensive risk assessments.</p>
            </div>
            <div>
              <h3 className="font-semibold text-cyan-400 mb-2">Compliance Tracking</h3>
              <p className="text-sm">Automatic compliance verification against OSHA standards and industry regulations.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Checklists;