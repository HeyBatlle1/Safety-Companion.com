// components/SafetyAnalysis/Agent2Card.tsx

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, TrendingUp, AlertTriangle, Shield } from 'lucide-react';
import { Agent2Output, Hazard } from '../../types/safety-analysis';

interface Agent2CardProps {
  data: Agent2Output;
  isExpanded: boolean;
  onToggle: () => void;
}

export const Agent2Card: React.FC<Agent2CardProps> = ({
  data,
  isExpanded,
  onToggle
}) => {
  const topHazard = data.hazards[0];
  const riskColor = getRiskLevelColor(topHazard.riskLevel);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden hover:border-purple-500/30 transition-all duration-300"
    >
      {/* Card Header */}
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between cursor-pointer hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>

          <div className="text-left">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Agent 2: Risk Assessor
              <span className="text-xs text-slate-500 font-normal">Gemini 2.5 Flash</span>
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-sm font-semibold ${riskColor.text}`}>
                Top Risk: {topHazard.riskScore}/100
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${riskColor.bg} ${riskColor.text} ${riskColor.border} border`}>
                {topHazard.riskLevel}
              </span>
            </div>
          </div>
        </div>

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
              {/* Risk Score Gauge */}
              <div className="flex items-center gap-6">
                <RiskGauge score={topHazard.riskScore} />
                
                <div className="flex-1">
                  <h4 className="text-white font-bold mb-2">Industry Comparison</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Your Risk</span>
                      <span className="text-white font-semibold">{topHazard.riskScore}/100</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Industry Baseline</span>
                      <span className="text-slate-400">42/100</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-400">Above Baseline</span>
                      <span className="text-red-400 font-semibold">
                        +{Math.round((topHazard.riskScore / 42 - 1) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hazard Details */}
              {data.hazards.map((hazard, idx) => (
                <HazardCard key={idx} hazard={hazard} index={idx} />
              ))}

              {/* OSHA Context */}
              {data.riskSummary?.industryContext && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Industry Context
                  </h4>
                  <p className="text-sm text-slate-300">
                    {data.riskSummary.industryContext}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Risk Gauge Component
const RiskGauge: React.FC<{ score: number }> = ({ score }) => {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getColor = (score: number) => {
    if (score >= 95) return '#ef4444'; // red-500
    if (score >= 75) return '#f97316'; // orange-500
    if (score >= 50) return '#eab308'; // yellow-500
    return '#22c55e'; // green-500
  };

  return (
    <div className="relative w-32 h-32">
      <svg className="transform -rotate-90 w-32 h-32">
        {/* Background circle */}
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-slate-700"
        />
        {/* Progress circle */}
        <motion.circle
          cx="64"
          cy="64"
          r="45"
          stroke={getColor(score)}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-xs text-slate-400">/ 100</span>
      </div>
    </div>
  );
};

// Hazard Card Component
const HazardCard: React.FC<{ hazard: Hazard; index: number }> = ({ hazard, index }) => {
  const riskColor = getRiskLevelColor(hazard.riskLevel);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index }}
      className={`bg-slate-700/30 border ${riskColor.border} rounded-lg p-4`}
    >
      {/* Hazard Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h5 className="text-white font-bold mb-1">Hazard #{index + 1}</h5>
          <p className="text-sm text-slate-300">{hazard.name}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${riskColor.bg} ${riskColor.text}`}>
          {hazard.riskScore}
        </span>
      </div>

      {/* Probability & Consequence */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <div className="text-xs text-slate-400 mb-1">Probability</div>
          <div className="text-sm font-semibold text-white">
            {(hazard.probability * 100).toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-1">Consequence</div>
          <div className={`text-sm font-semibold ${
            hazard.consequence === 'Fatal' ? 'text-red-400' :
            hazard.consequence === 'Critical' ? 'text-orange-400' :
            hazard.consequence === 'Serious' ? 'text-yellow-400' :
            'text-green-400'
          }`}>
            {hazard.consequence}
          </div>
        </div>
      </div>

      {/* OSHA Context */}
      {hazard.oshaContext && (
        <div className="bg-slate-800/50 rounded p-2 mb-3">
          <p className="text-xs text-slate-400 italic">"{hazard.oshaContext}"</p>
        </div>
      )}

      {/* Inadequate Controls */}
      {hazard.inadequateControls && hazard.inadequateControls.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-bold text-red-400 mb-2">Inadequate Controls:</div>
          <ul className="space-y-1">
            {hazard.inadequateControls.map((control, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="text-red-400">✗</span>
                {control}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Controls */}
      {hazard.recommendedControls && hazard.recommendedControls.length > 0 && (
        <div>
          <div className="text-xs font-bold text-green-400 mb-2 flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Recommended Controls:
          </div>
          <ul className="space-y-1">
            {hazard.recommendedControls.slice(0, 3).map((control, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="text-green-400">✓</span>
                {control}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
};

// Helper function
const getRiskLevelColor = (level: string) => {
  const colorMap = {
    'EXTREME': {
      text: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30'
    },
    'HIGH': {
      text: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30'
    },
    'MEDIUM': {
      text: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30'
    },
    'LOW': {
      text: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30'
    }
  };
  return colorMap[level] || colorMap['MEDIUM'];
};
