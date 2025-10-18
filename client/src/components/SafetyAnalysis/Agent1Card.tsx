// components/SafetyAnalysis/Agent1Card.tsx

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Agent1Output } from '../../types/safety-analysis';

interface Agent1CardProps {
  data: Agent1Output;
  isExpanded: boolean;
  onToggle: () => void;
}

export const Agent1Card: React.FC<Agent1CardProps> = ({
  data,
  isExpanded,
  onToggle
}) => {
  const qualityConfig = {
    HIGH: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
    MEDIUM: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
    LOW: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' }
  };

  const config = qualityConfig[data.dataQuality];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden hover:border-cyan-500/30 transition-all duration-300"
    >
      {/* Card Header - Always Visible */}
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between cursor-pointer hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* Agent Icon */}
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <span className="text-2xl">🔍</span>
          </div>

          {/* Agent Info */}
          <div className="text-left">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Agent 1: Data Validator
              <span className="text-xs text-slate-500 font-normal">Gemini 2.5 Flash</span>
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-sm font-semibold ${config.color}`}>
                Quality Score: {data.qualityScore}/10
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${config.bg} ${config.color} ${config.border} border`}>
                {data.dataQuality}
              </span>
            </div>
          </div>
        </div>

        {/* Expand Icon */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-6 h-6 text-slate-400" />
        </motion.div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-slate-700/50"
          >
            <div className="p-6 space-y-6">
              {/* Quality Score Visualization */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Data Completeness</span>
                  <span className="text-sm font-semibold text-white">{data.qualityScore * 10}%</span>
                </div>
                <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${data.qualityScore * 10}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className={`h-full ${config.bg.replace('/10', '/30')} border-r-2 ${config.border}`}
                  />
                </div>
              </div>

              {/* Missing Critical Fields */}
              {data.missingCritical.length > 0 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Critical Gaps ({data.missingCritical.length})
                  </h4>
                  <ul className="space-y-2">
                    {data.missingCritical.map((field, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * idx }}
                        className="flex items-start gap-2 text-sm text-slate-300"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                        {field}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Insufficient Responses */}
              {data.insufficientResponses && data.insufficientResponses.length > 0 && (
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-yellow-400 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Needs More Detail ({data.insufficientResponses.length})
                  </h4>
                  <div className="space-y-3">
                    {data.insufficientResponses.map((item, idx) => (
                      <div key={idx} className="text-sm">
                        <div className="text-slate-300 font-medium">{item.field}</div>
                        <div className="text-slate-500 text-xs mt-1">{item.issue}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weather Risks */}
              {data.weatherRisks && data.weatherRisks.length > 0 && (
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-orange-400 mb-3">Weather Risks</h4>
                  <ul className="space-y-2">
                    {data.weatherRisks.map((risk, idx) => (
                      <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-orange-400">⚠️</span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Concerns by Priority */}
              {data.concerns && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.concerns.CRITICAL?.length > 0 && (
                    <ConcernBadge
                      level="CRITICAL"
                      items={data.concerns.CRITICAL}
                      color="red"
                    />
                  )}
                  {data.concerns.HIGH?.length > 0 && (
                    <ConcernBadge
                      level="HIGH"
                      items={data.concerns.HIGH}
                      color="orange"
                    />
                  )}
                  {data.concerns.MEDIUM?.length > 0 && (
                    <ConcernBadge
                      level="MEDIUM"
                      items={data.concerns.MEDIUM}
                      color="yellow"
                    />
                  )}
                </div>
              )}

              {/* Recommended Action */}
              {data.recommendedAction && (
                <div className={`px-4 py-3 rounded-lg text-sm font-semibold text-center ${
                  data.recommendedAction === 'PROCEED' ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
                  data.recommendedAction === 'REQUEST_CLARIFICATION' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' :
                  'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}>
                  Recommendation: {data.recommendedAction.replace('_', ' ')}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Helper Component
const ConcernBadge: React.FC<{
  level: string;
  items: string[];
  color: string;
}> = ({ level, items, color }) => {
  const colorMap = {
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    orange: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
  };

  return (
    <div className={`p-3 rounded-lg border ${colorMap[color]}`}>
      <div className="text-xs font-bold mb-2">{level}</div>
      <div className="text-xs text-slate-300">{items.length} issue{items.length > 1 ? 's' : ''}</div>
    </div>
  );
};
