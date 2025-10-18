// components/SafetyAnalysis/ExecutiveSummary.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  StopCircle 
} from 'lucide-react';
import { GoNoGoDecision, ReportMetadata } from '../../types/safety-analysis';

interface ExecutiveSummaryProps {
  decision: GoNoGoDecision;
  riskLevel: string;
  riskScore: number;
  probability: number;
  dataQuality: number;
  topThreats: string[];
  criticalActions: string[];
  metadata: ReportMetadata;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  decision,
  riskLevel,
  riskScore,
  probability,
  dataQuality,
  topThreats,
  criticalActions,
  metadata
}) => {
  // Decision styling
  const decisionConfig = {
    'GO': {
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-600',
      textColor: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30'
    },
    'CONDITIONAL_GO': {
      icon: AlertTriangle,
      color: 'from-yellow-500 to-orange-600',
      textColor: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30'
    },
    'NO_GO': {
      icon: XCircle,
      color: 'from-red-500 to-rose-600',
      textColor: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30'
    },
    'STOP_WORK': {
      icon: StopCircle,
      color: 'from-red-600 to-red-800',
      textColor: 'text-red-300',
      bgColor: 'bg-red-600/20',
      borderColor: 'border-red-600/50'
    }
  };

  const config = decisionConfig[decision.decision];
  const DecisionIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 shadow-2xl"
    >
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-5`} />
      
      <div className="relative p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Safety Analysis Report
            </h1>
            <p className="text-slate-400">
              {metadata.projectName} • {metadata.location}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Generated {new Date(metadata.generatedAt).toLocaleString()}
            </p>
          </div>
          
          {/* Decision Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl ${config.bgColor} border ${config.borderColor}`}
          >
            <DecisionIcon className={`w-8 h-8 ${config.textColor}`} />
            <div>
              <div className={`text-2xl font-bold ${config.textColor}`}>
                {decision.decision.replace('_', ' ')}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Risk Score */}
          <MetricCard
            label="Risk Score"
            value={`${riskScore}/100`}
            level={riskLevel}
            color={getRiskColor(riskLevel)}
            delay={0.4}
          />

          {/* Incident Probability */}
          <MetricCard
            label="Incident Probability"
            value={`${probability}%`}
            subtitle="Next 4 hours"
            color={probability > 70 ? 'red' : probability > 40 ? 'yellow' : 'green'}
            delay={0.5}
          />

          {/* Data Quality */}
          <MetricCard
            label="Data Quality"
            value={`${dataQuality}/10`}
            level={dataQuality >= 8 ? 'HIGH' : dataQuality >= 5 ? 'MEDIUM' : 'LOW'}
            color={dataQuality >= 8 ? 'green' : dataQuality >= 5 ? 'yellow' : 'red'}
            delay={0.6}
          />
        </div>

        {/* Critical Actions */}
        {criticalActions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-6"
          >
            <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Critical Actions Required
            </h3>
            <ul className="space-y-3">
              {criticalActions.map((action, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + idx * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-400 text-sm font-bold">{idx + 1}</span>
                  </div>
                  <span className="text-slate-200">{action}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Top Threats Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-slate-700/30 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Top Safety Threats
          </h3>
          <div className="space-y-2">
            {topThreats.slice(0, 3).map((threat, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 text-slate-300"
              >
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-sm">{threat}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Conditions (if CONDITIONAL_GO) */}
        {decision.decision === 'CONDITIONAL_GO' && decision.conditions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6"
          >
            <h3 className="text-lg font-bold text-yellow-400 mb-4">
              Conditions for Proceeding
            </h3>
            <ul className="space-y-2">
              {decision.conditions.map((condition, idx) => (
                <li key={idx} className="flex items-start gap-3 text-slate-300">
                  <CheckCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{condition}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Helper Component: Metric Card
const MetricCard: React.FC<{
  label: string;
  value: string;
  subtitle?: string;
  level?: string;
  color: string;
  delay: number;
}> = ({ label, value, subtitle, level, color, delay }) => {
  const colorMap = {
    green: 'text-green-400 bg-green-500/10 border-green-500/30',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    red: 'text-red-400 bg-red-500/10 border-red-500/30'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30"
    >
      <div className="text-sm text-slate-400 mb-2">{label}</div>
      <div className={`text-3xl font-bold ${colorMap[color]?.split(' ')[0] || 'text-white'} mb-1`}>
        {value}
      </div>
      {level && (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${colorMap[color]}`}>
          {level}
        </span>
      )}
      {subtitle && (
        <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
      )}
    </motion.div>
  );
};

// Helper function
const getRiskColor = (level: string): string => {
  const map = {
    'EXTREME': 'red',
    'HIGH': 'red',
    'MEDIUM': 'yellow',
    'LOW': 'green',
    'MINIMAL': 'green'
  };
  return map[level] || 'yellow';
};
