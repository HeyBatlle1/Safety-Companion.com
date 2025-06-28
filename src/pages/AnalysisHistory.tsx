import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Filter, Download, Trash2 } from 'lucide-react';
import AnalysisHistoryViewer from '../components/history/AnalysisHistoryViewer';
import { AnalysisRecord } from '../services/history';
import BackButton from '../components/navigation/BackButton';

const AnalysisHistory: React.FC = () => {
  const [selectedType, setSelectedType] = useState<AnalysisRecord['type'] | 'all'>('all');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex items-center justify-between">
          <BackButton />
          <div className="text-center flex-1">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center space-x-2 mb-4"
            >
              <Clock className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                Analysis History
              </h1>
            </motion.div>
          </div>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>

        <div className="text-center">
          <motion.p 
            className="text-gray-300 max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            View your history of AI safety analyses, risk assessments, and SDS queries.
            All your interactions are stored securely for future reference.
          </motion.p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Analysis Records</h2>
              
              <div className="flex items-center space-x-3">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as AnalysisRecord['type'] | 'all')}
                  className="px-3 py-2 bg-slate-700/50 border border-blue-500/20 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/40"
                >
                  <option value="all">All Types</option>
                  <option value="safety_assessment">Safety Assessments</option>
                  <option value="risk_assessment">Risk Assessments</option>
                  <option value="sds_analysis">SDS Analyses</option>
                  <option value="chat_response">Chat Responses</option>
                </select>
              </div>
            </div>
          </div>
          
          <AnalysisHistoryViewer type={selectedType === 'all' ? undefined : selectedType} limit={100} />
        </div>
      </motion.div>
    </div>
  );
};

export default AnalysisHistory;