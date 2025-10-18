// components/SafetyAnalysis/Agent3Card.tsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  AlertTriangle, 
  Eye, 
  Zap,
  ArrowRight,
  Clock,
  Target,
  Shield
} from 'lucide-react';
import { Agent3Output } from '../../types/safety-analysis';

interface Agent3CardProps {
  data: Agent3Output;
  isExpanded: boolean;
  onToggle: () => void;
}

export const Agent3Card: React.FC<Agent3CardProps> = ({
  data,
  isExpanded,
  onToggle
}) => {
  const [activeTab, setActiveTab] = useState<'chain' | 'indicators' | 'interventions'>('chain');
  
  const confidenceColor = {
    HIGH: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    MEDIUM: { text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
    LOW: { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' }
  };

  const config = confidenceColor[data.confidence];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden hover:border-red-500/30 transition-all duration-300"
    >
      {/* Card Header */}
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between cursor-pointer hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <span className="text-2xl">🔮</span>
          </div>

          <div className="text-left">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Agent 3: Incident Predictor
              <span className="text-xs text-slate-500 font-normal">Gemini 2.5 Flash</span>
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-sm font-semibold ${config.text}`}>
                Probability: {data.probability}%
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${config.bg} ${config.text} ${config.border} border`}>
                {data.confidence} CONFIDENCE
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
              {/* Incident Overview */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <div className="flex items-start gap-4 mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-red-400 mb-2">
                      Predicted Incident
                    </h4>
                    <p className="text-white text-sm leading-relaxed">
                      {data.incidentName}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-red-500/20">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Timeframe</div>
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-red-400" />
                      {data.timeframe}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Probability</div>
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      <Target className="w-4 h-4 text-red-400" />
                      {data.probability}% ({data.confidence})
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-2 bg-slate-700/30 p-1 rounded-lg">
                <TabButton
                  active={activeTab === 'chain'}
                  onClick={() => setActiveTab('chain')}
                  icon={<ArrowRight className="w-4 h-4" />}
                  label="Causal Chain"
                />
                <TabButton
                  active={activeTab === 'indicators'}
                  onClick={() => setActiveTab('indicators')}
                  icon={<Eye className="w-4 h-4" />}
                  label="Leading Indicators"
                />
                <TabButton
                  active={activeTab === 'interventions'}
                  onClick={() => setActiveTab('interventions')}
                  icon={<Shield className="w-4 h-4" />}
                  label="Interventions"
                />
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'chain' && (
                  <CausalChainView causalChain={data.causalChain} />
                )}
                {activeTab === 'indicators' && (
                  <LeadingIndicatorsView indicators={data.leadingIndicators} />
                )}
                {activeTab === 'interventions' && (
                  <InterventionsView interventions={data.interventions} />
                )}
              </AnimatePresence>

              {/* OSHA Pattern Match */}
              {data.oshaPatternMatch && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="text-sm font-bold text-blue-400 mb-2">
                    OSHA Pattern Match
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Similar Incidents:</span>
                      <span className="text-white font-semibold ml-2">
                        {data.oshaPatternMatch.similarIncidents}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Match Confidence:</span>
                      <span className={`ml-2 font-semibold ${
                        data.oshaPatternMatch.matchConfidence === 'HIGH' ? 'text-green-400' :
                        data.oshaPatternMatch.matchConfidence === 'MEDIUM' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {data.oshaPatternMatch.matchConfidence}
                      </span>
                    </div>
                  </div>
                  {data.oshaPatternMatch.citationsExpected && (
                    <div className="mt-3 pt-3 border-t border-blue-500/20">
                      <div className="text-xs text-slate-400 mb-2">Expected OSHA Citations:</div>
                      <div className="flex flex-wrap gap-2">
                        {data.oshaPatternMatch.citationsExpected.map((citation, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs font-mono"
                          >
                            {citation}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Tab Button Component
const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
      active
        ? 'bg-slate-800 text-white shadow-lg'
        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
    }`}
  >
    {icon}
    <span className="hidden md:inline">{label}</span>
  </button>
);

// Causal Chain View
const CausalChainView: React.FC<{ causalChain: any[] }> = ({ causalChain }) => {
  const stageIcons = {
    'Organizational Influences': '🏢',
    'Unsafe Supervision': '👷',
    'Preconditions - Worker State': '😓',
    'Preconditions - Equipment State': '🔧',
    'Preconditions - Environment': '🌤️',
    'Unsafe Act (Trigger)': '⚡',
    'Loss of Control': '🚨',
    'Defense Failure 1': '🛡️',
    'Defense Failure 2': '🛡️',
    'Injury Mechanism': '💥'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-3"
    >
      <div className="text-sm font-semibold text-slate-400 mb-4">
        Swiss Cheese Model: How the incident unfolds
      </div>
      
      {causalChain.map((stage, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="relative"
        >
          {/* Connector Line */}
          {idx < causalChain.length - 1 && (
            <div className="absolute left-6 top-16 w-0.5 h-8 bg-gradient-to-b from-red-500/50 to-transparent" />
          )}

          <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-4 hover:border-red-500/30 transition-colors">
            <div className="flex items-start gap-3">
              {/* Stage Number & Icon */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">{stageIcons[stage.stage] || '⚠️'}</span>
                </div>
                <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
              </div>

              {/* Stage Content */}
              <div className="flex-1">
                <h5 className="text-sm font-bold text-red-400 mb-2">
                  {stage.stage}
                </h5>
                <p className="text-sm text-slate-300 mb-2 leading-relaxed">
                  {stage.description}
                </p>

                {/* Additional Fields */}
                {stage.evidence && (
                  <div className="mt-2 p-2 bg-slate-800/50 rounded text-xs text-slate-400 border-l-2 border-yellow-500/50">
                    <span className="font-semibold text-yellow-400">Evidence:</span> {stage.evidence}
                  </div>
                )}

                {stage.why && (
                  <div className="mt-2 p-2 bg-slate-800/50 rounded text-xs text-slate-400">
                    <span className="font-semibold text-orange-400">Why:</span> {stage.why}
                  </div>
                )}

                {stage.errorType && (
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-xs font-semibold">
                      {stage.errorType}
                    </span>
                  </div>
                )}

                {stage.timeToIntervene && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <Clock className="w-3 h-3 text-red-400" />
                    <span className="text-red-400 font-semibold">
                      Time to intervene: {stage.timeToIntervene}
                    </span>
                  </div>
                )}

                {stage.severity && (
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                      stage.severity === 'Fatal' ? 'bg-red-500/20 text-red-400' :
                      stage.severity === 'Critical' ? 'bg-orange-500/20 text-orange-400' :
                      stage.severity === 'Serious' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      Severity: {stage.severity}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

// Leading Indicators View
const LeadingIndicatorsView: React.FC<{ indicators: any[] }> = ({ indicators }) => {
  const typeIcons = {
    'Behavioral': '👥',
    'Environmental': '🌍',
    'Organizational': '🏢',
    'Near-Miss': '⚠️'
  };

  const typeColors = {
    'Behavioral': 'border-purple-500/30 bg-purple-500/5',
    'Environmental': 'border-orange-500/30 bg-orange-500/5',
    'Organizational': 'border-blue-500/30 bg-blue-500/5',
    'Near-Miss': 'border-red-500/30 bg-red-500/5'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-400 mb-2">
          <Eye className="w-5 h-5" />
          <h4 className="font-bold">Observable Warning Signs</h4>
        </div>
        <p className="text-sm text-slate-300">
          Supervisors can see these conditions RIGHT NOW. Taking action on these indicators can prevent the predicted incident.
        </p>
      </div>

      {indicators.map((indicator, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className={`border rounded-lg p-4 ${typeColors[indicator.type]}`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">{typeIcons[indicator.type]}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {indicator.type}
                </span>
              </div>
              
              <h5 className="text-white font-semibold mb-2">
                {indicator.indicator}
              </h5>

              <div className="space-y-2 text-sm">
                {indicator.whereToLook && (
                  <div className="flex gap-2">
                    <span className="text-slate-400 font-medium min-w-[80px]">Where:</span>
                    <span className="text-slate-300">{indicator.whereToLook}</span>
                  </div>
                )}

                {indicator.whatToSee && (
                  <div className="flex gap-2">
                    <span className="text-slate-400 font-medium min-w-[80px]">What:</span>
                    <span className="text-slate-300">{indicator.whatToSee}</span>
                  </div>
                )}

                {indicator.threshold && (
                  <div className="flex gap-2">
                    <span className="text-red-400 font-medium min-w-[80px]">Threshold:</span>
                    <span className="text-red-300">{indicator.threshold}</span>
                  </div>
                )}

                {indicator.actionRequired && (
                  <div className="mt-3 p-3 bg-slate-800/50 rounded border-l-2 border-green-500/50">
                    <div className="text-xs font-bold text-green-400 mb-1">ACTION REQUIRED:</div>
                    <div className="text-xs text-slate-300">{indicator.actionRequired}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

// Interventions View
const InterventionsView: React.FC<{ interventions: any }> = ({ interventions }) => {
  const tierColors = {
    'Elimination': 'border-green-500/30 bg-green-500/5 text-green-400',
    'Engineering': 'border-blue-500/30 bg-blue-500/5 text-blue-400',
    'Administrative': 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400',
    'PPE': 'border-orange-500/30 bg-orange-500/5 text-orange-400'
  };

  const tierIcons = {
    'Elimination': '🎯',
    'Engineering': '🔧',
    'Administrative': '📋',
    'PPE': '🦺'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      {/* Recommended Action Banner */}
      {interventions.recommended && (
        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <Zap className="w-5 h-5" />
            <h4 className="font-bold">Recommended Approach</h4>
          </div>
          <p className="text-sm text-white leading-relaxed">
            {interventions.recommended}
          </p>
        </div>
      )}

      {/* Preventive Interventions */}
      <div>
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          Preventive Barriers (Stop Incident From Happening)
        </h4>
        <div className="space-y-3">
          {interventions.preventive.map((intervention, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`border rounded-lg p-4 ${tierColors[intervention.tier]}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{tierIcons[intervention.tier]}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                      {intervention.tier}
                    </span>
                    <span className="text-xs font-bold">
                      {intervention.effectivenessReduction} Risk Reduction
                    </span>
                  </div>

                  <p className="text-white font-semibold mb-3">
                    {intervention.action}
                  </p>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <div className="opacity-70 mb-1">Feasibility</div>
                      <div className="font-semibold">{intervention.feasibility}</div>
                    </div>
                    <div>
                      <div className="opacity-70 mb-1">Time</div>
                      <div className="font-semibold">{intervention.timeToImplement}</div>
                    </div>
                    <div>
                      <div className="opacity-70 mb-1">Cost</div>
                      <div className="font-semibold">{intervention.cost}</div>
                    </div>
                  </div>

                  {intervention.breaksChainAt && (
                    <div className="mt-3 p-2 bg-slate-800/50 rounded text-xs">
                      <span className="opacity-70">Breaks chain at:</span>
                      <span className="ml-2 font-semibold">{intervention.breaksChainAt}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mitigative Interventions */}
      {interventions.mitigative && interventions.mitigative.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            Mitigative Barriers (Reduce Harm If Incident Occurs)
          </h4>
          <div className="space-y-2">
            {interventions.mitigative.map((mitigation, idx) => (
              <div
                key={idx}
                className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3"
              >
                <div className="text-sm text-white font-medium mb-1">
                  {mitigation.action}
                </div>
                <div className="text-xs text-slate-400">
                  {mitigation.reducesHarm}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
