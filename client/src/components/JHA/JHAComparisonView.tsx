import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface JHAComparisonViewProps {
  baseline: {
    id: string;
    riskScore: number;
    query: string;
  };
  comparison: {
    updateNumber: number;
    goNoGoDecision: string;
    decisionReason: string;
    comparison: {
      agent2: {
        currentRiskScore: number;
        riskScoreDelta: number;
        improvements?: Array<{ category: string; impact: string; riskReduction: number }>;
        degradations?: Array<{ category: string; impact: string; riskIncrease: number }>;
        newHazards?: Array<{ hazard: string; severity: string; riskScore: number }>;
      };
      agent3: {
        decision: string;
        reasoning: string;
        requiredActions?: string[];
        workRestrictions?: string[];
      };
      agent4: {
        executiveSummary: string;
        comparisonReport: string;
        keyFindings?: string[];
        criticalChanges?: string[];
      };
    };
  };
}

export function JHAComparisonView({ baseline, comparison }: JHAComparisonViewProps) {
  const agent2 = comparison.comparison?.agent2 || {};
  const agent3 = comparison.comparison?.agent3 || {};
  const agent4 = comparison.comparison?.agent4 || {};

  const riskDelta = agent2.riskScoreDelta || 0;
  const currentRisk = agent2.currentRiskScore || baseline.riskScore;
  
  // Decision styling
  const getDecisionStyle = (decision: string) => {
    switch (decision?.toLowerCase()) {
      case 'go':
        return { bg: 'bg-green-500/20', border: 'border-green-500/40', text: 'text-green-400', icon: CheckCircle };
      case 'no_go':
        return { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400', icon: XCircle };
      default:
        return { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400', icon: AlertTriangle };
    }
  };

  const decisionStyle = getDecisionStyle(comparison.goNoGoDecision || agent3.decision);
  const DecisionIcon = decisionStyle.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
          JHA Update #{comparison.updateNumber} - Comparison Analysis
        </h2>
        <p className="text-gray-400">{agent4.executiveSummary || 'Comparing baseline conditions with current state'}</p>
      </div>

      {/* GO/NO-GO Decision Banner */}
      <Card className={`${decisionStyle.bg} border-2 ${decisionStyle.border} p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <DecisionIcon className={`w-12 h-12 ${decisionStyle.text}`} />
            <div>
              <h3 className={`text-2xl font-bold ${decisionStyle.text} uppercase`}>
                {comparison.goNoGoDecision || agent3.decision || 'Review Required'}
              </h3>
              <p className="text-gray-300 mt-1">{agent3.reasoning}</p>
            </div>
          </div>
          
          {/* Risk Score Change */}
          <div className="text-right">
            <div className="text-sm text-gray-400">Risk Score</div>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-2xl font-bold text-white">{baseline.riskScore}</span>
              <ArrowRight className={`w-6 h-6 ${riskDelta > 0 ? 'text-red-400' : riskDelta < 0 ? 'text-green-400' : 'text-gray-400'}`} />
              <span className={`text-2xl font-bold ${currentRisk > baseline.riskScore ? 'text-red-400' : currentRisk < baseline.riskScore ? 'text-green-400' : 'text-white'}`}>
                {currentRisk}
              </span>
              {riskDelta !== 0 && (
                <Badge variant={riskDelta > 0 ? 'destructive' : 'default'} className="ml-2">
                  {riskDelta > 0 ? '+' : ''}{riskDelta}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Side-by-side Comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Improvements */}
        {agent2.improvements && agent2.improvements.length > 0 && (
          <Card className="bg-green-500/10 border-green-500/30 p-4">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingDown className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-green-400">Improvements</h3>
            </div>
            <div className="space-y-2">
              {agent2.improvements.map((item, idx) => (
                <div key={idx} className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-white">{item.category}</div>
                      <div className="text-sm text-gray-300 mt-1">{item.impact}</div>
                    </div>
                    <Badge className="bg-green-600 text-white">
                      {item.riskReduction}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Degradations */}
        {agent2.degradations && agent2.degradations.length > 0 && (
          <Card className="bg-red-500/10 border-red-500/30 p-4">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-semibold text-red-400">Degradations</h3>
            </div>
            <div className="space-y-2">
              {agent2.degradations.map((item, idx) => (
                <div key={idx} className="bg-slate-800/50 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-white">{item.category}</div>
                      <div className="text-sm text-gray-300 mt-1">{item.impact}</div>
                    </div>
                    <Badge variant="destructive">
                      +{item.riskIncrease}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* New Hazards */}
      {agent2.newHazards && agent2.newHazards.length > 0 && (
        <Card className="bg-orange-500/10 border-orange-500/30 p-4">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-orange-400">New Hazards Identified</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {agent2.newHazards.map((hazard, idx) => (
              <div key={idx} className="bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-white">{hazard.hazard}</div>
                    <Badge 
                      variant={hazard.severity === 'high' ? 'destructive' : 'default'}
                      className="mt-2"
                    >
                      {hazard.severity} severity
                    </Badge>
                  </div>
                  <span className="text-lg font-bold text-orange-400">+{hazard.riskScore}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Required Actions */}
      {agent3.requiredActions && agent3.requiredActions.length > 0 && (
        <Card className="bg-blue-500/10 border-blue-500/30 p-4">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">Required Actions</h3>
          <ul className="space-y-2">
            {agent3.requiredActions.map((action, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-gray-300">
                <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Work Restrictions */}
      {agent3.workRestrictions && agent3.workRestrictions.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30 p-4">
          <h3 className="text-lg font-semibold text-red-400 mb-3">Work Restrictions</h3>
          <ul className="space-y-2">
            {agent3.workRestrictions.map((restriction, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-gray-300">
                <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <span>{restriction}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Full Comparison Report */}
      {agent4.comparisonReport && (
        <Card className="bg-slate-800/60 border-blue-500/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Detailed Analysis</h3>
          <div className="prose prose-invert max-w-none">
            <div className="text-gray-300 whitespace-pre-wrap">{agent4.comparisonReport}</div>
          </div>
        </Card>
      )}

      {/* Key Findings */}
      {agent4.keyFindings && agent4.keyFindings.length > 0 && (
        <Card className="bg-slate-800/60 border-blue-500/20 p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Key Findings</h3>
          <ul className="space-y-2">
            {agent4.keyFindings.map((finding, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-gray-300">
                <Minus className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span>{finding}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </motion.div>
  );
}
