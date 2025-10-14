import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  Brain, 
  Gauge, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ChevronDown, 
  ChevronUp,
  Thermometer,
  Zap
} from 'lucide-react';

interface AgentOutput {
  id: string;
  agentId: string;
  agentName: string;
  agentType: string;
  outputData: any;
  executionMetadata: any;
  success: boolean;
  errorDetails?: string;
  createdAt: string;
}

interface AgentMetadataDisplayProps {
  analysisId: string;
}

const AgentMetadataDisplay: React.FC<AgentMetadataDisplayProps> = ({ analysisId }) => {
  const [agentOutputs, setAgentOutputs] = useState<AgentOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgentOutputs = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/agent-outputs/${analysisId}`);
        const data = await response.json();
        
        if (data.success) {
          setAgentOutputs(data.agentOutputs);
        }
      } catch (error) {
        console.error('Failed to fetch agent outputs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentOutputs();
  }, [analysisId]);

  const getAgentIcon = (agentId: string) => {
    if (agentId.includes('validator') || agentId.includes('agent_1')) {
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    } else if (agentId.includes('classifier') || agentId.includes('assessor') || agentId.includes('agent_2')) {
      return <Brain className="w-4 h-4 text-blue-400" />;
    } else if (agentId.includes('predictor') || agentId.includes('agent_3')) {
      return <Zap className="w-4 h-4 text-yellow-400" />;
    } else {
      return <Cpu className="w-4 h-4 text-purple-400" />;
    }
  };

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="w-6 h-6 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (agentOutputs.length === 0) {
    return (
      <div className="text-center py-4 text-gray-400 text-sm">
        No agent metadata available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2 mb-3">
        <Cpu className="w-4 h-4 text-blue-400" />
        <h5 className="text-sm font-semibold text-gray-200">AI Agent Pipeline</h5>
        <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
          {agentOutputs.length} agents
        </span>
      </div>

      {agentOutputs.map((agent, index) => (
        <motion.div
          key={agent.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-slate-700/30 border border-blue-500/10 rounded-lg overflow-hidden"
        >
          <div
            onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
            className="p-3 cursor-pointer hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-slate-800/50 rounded-lg">
                  {getAgentIcon(agent.agentId)}
                </div>
                <div>
                  <div className="text-sm font-medium text-white flex items-center space-x-2">
                    <span>{agent.agentName}</span>
                    {agent.success ? (
                      <CheckCircle className="w-3 h-3 text-green-400" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-400" />
                    )}
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-gray-400 mt-0.5">
                    {agent.executionMetadata?.executionTime !== undefined && (
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatExecutionTime(agent.executionMetadata.executionTime || agent.executionMetadata.executionTimeMs)}</span>
                      </span>
                    )}
                    {agent.executionMetadata?.temperature !== undefined && (
                      <span className="flex items-center space-x-1">
                        <Thermometer className="w-3 h-3" />
                        <span>T={agent.executionMetadata.temperature}</span>
                      </span>
                    )}
                    {agent.executionMetadata?.model && (
                      <span className="flex items-center space-x-1">
                        <Gauge className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{agent.executionMetadata.model}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {expandedAgent === agent.id ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>

          <AnimatePresence>
            {expandedAgent === agent.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-blue-500/10"
              >
                <div className="p-3 space-y-3">
                  {/* Execution Metadata */}
                  <div>
                    <h6 className="text-xs font-medium text-gray-400 mb-1.5">Execution Metadata</h6>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {agent.executionMetadata && Object.entries(agent.executionMetadata).map(([key, value]) => (
                        <div key={key} className="bg-slate-800/50 rounded px-2 py-1">
                          <span className="text-gray-500">{key}:</span>
                          <span className="text-gray-300 ml-1">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Output Data Preview */}
                  {agent.outputData && (
                    <div>
                      <h6 className="text-xs font-medium text-gray-400 mb-1.5">Output Data</h6>
                      <div className="bg-slate-800/50 rounded p-2 max-h-40 overflow-y-auto">
                        <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                          {JSON.stringify(agent.outputData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Error Details */}
                  {!agent.success && agent.errorDetails && (
                    <div>
                      <h6 className="text-xs font-medium text-red-400 mb-1.5">Error Details</h6>
                      <div className="bg-red-500/10 border border-red-500/20 rounded p-2">
                        <p className="text-xs text-red-300">{agent.errorDetails}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
};

export default AgentMetadataDisplay;
