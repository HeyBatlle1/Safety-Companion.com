import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Search, 
  Filter, 
  Trash2, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check,
  FileText,
  Shield,
  AlertTriangle,
  MessageCircle
} from 'lucide-react';
import { 
  getAnalysisHistory, 
  deleteAnalysisRecord, 
  clearAnalysisHistory,
  AnalysisRecord
} from '../../services/history';
import { showToast } from '../common/ToastContainer';
import AgentMetadataDisplay from './AgentMetadataDisplay';

interface AnalysisHistoryViewerProps {
  type?: AnalysisRecord['type'];
  limit?: number;
  onSelect?: (record: AnalysisRecord) => void;
}

const AnalysisHistoryViewer: React.FC<AnalysisHistoryViewerProps> = ({ 
  type,
  limit = 50,
  onSelect
}) => {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<AnalysisRecord['type'] | 'all'>(type || 'all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [selectedType, limit]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const historyType = selectedType === 'all' ? undefined : selectedType;
      const history = await getAnalysisHistory(historyType, limit);
      setRecords(history);
    } catch (error) {
      
      showToast('Failed to load analysis history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteAnalysisRecord(id);
      if (success) {
        setRecords(prev => prev.filter(record => record.id !== id));
        showToast('Record deleted successfully', 'success');
      } else {
        showToast('Failed to delete record', 'error');
      }
    } catch (error) {
      
      showToast('Error deleting record', 'error');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all history? This cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      const historyType = selectedType === 'all' ? undefined : selectedType;
      const success = await clearAnalysisHistory(historyType);
      
      if (success) {
        setRecords([]);
        showToast('History cleared successfully', 'success');
      } else {
        showToast('Failed to clear history', 'error');
      }
    } catch (error) {
      
      showToast('Error clearing history', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        showToast('Copied to clipboard', 'success');
      })
      .catch(err => {
        
        showToast('Failed to copy to clipboard', 'error');
      });
  };

  const handleExport = (record: AnalysisRecord) => {
    const data = JSON.stringify(record, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${record.id}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTypeIcon = (recordType: AnalysisRecord['type']) => {
    switch (recordType) {
      case 'safety_assessment':
        return <Shield className="w-4 h-4 text-blue-400" />;
      case 'risk_assessment':
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case 'sds_analysis':
        return <FileText className="w-4 h-4 text-green-400" />;
      case 'chat_response':
        return <MessageCircle className="w-4 h-4 text-purple-400" />;
      case 'eap_generation':
        return <Shield className="w-4 h-4 text-cyan-400" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeLabel = (recordType: AnalysisRecord['type']) => {
    switch (recordType) {
      case 'safety_assessment':
        return 'Safety Assessment';
      case 'risk_assessment':
        return 'Risk Assessment';
      case 'sds_analysis':
        return 'SDS Analysis';
      case 'chat_response':
        return 'Chat Response';
      case 'eap_generation':
        return 'Emergency Action Plan';
      default:
        return 'Unknown';
    }
  };

  const filteredRecords = records.filter(record => {
    return (
      (record.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
       record.response.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedType === 'all' || record.type === selectedType)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Clock className="w-5 h-5 mr-2 text-blue-400" />
          Analysis History
        </h2>
        
        <div className="flex space-x-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleClearAll}
            disabled={isDeleting || records.length === 0}
            className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={loadHistory}
            className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
          >
            <Clock className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-blue-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/40"
          />
        </div>
        
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as AnalysisRecord['type'] | 'all')}
          className="px-4 py-2 bg-slate-700/50 border border-blue-500/20 rounded-lg text-white focus:outline-none focus:border-blue-500/40"
        >
          <option value="all">All Types</option>
          <option value="safety_assessment">Safety Assessments</option>
          <option value="risk_assessment">Risk Assessments</option>
          <option value="sds_analysis">SDS Analyses</option>
          <option value="chat_response">Chat Responses</option>
          <option value="eap_generation">Emergency Action Plans</option>
        </select>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-8 bg-slate-800/30 rounded-lg">
          <Clock className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No analysis history found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-lg overflow-hidden"
            >
              <div 
                className="p-4 cursor-pointer"
                onClick={() => {
                  if (onSelect) {
                    onSelect(record);
                  } else {
                    setExpandedId(expandedId === record.id ? null : record.id);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(record.type)}
                    <div>
                      <div className="text-white font-medium">
                        {getTypeLabel(record.type)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(record.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-1 bg-slate-700/50 rounded-full text-gray-300">
                      {record.query.length > 30 ? record.query.substring(0, 30) + '...' : record.query}
                    </span>
                    {expandedId === record.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
              
              <AnimatePresence>
                {expandedId === record.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-blue-500/20"
                  >
                    <div className="p-4">
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Query</h4>
                        <div className="p-3 bg-slate-700/50 rounded-lg text-white text-sm">
                          {record.query}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Response</h4>
                        <div className="p-3 bg-slate-700/50 rounded-lg text-white text-sm max-h-60 overflow-y-auto">
                          <pre className="whitespace-pre-wrap font-sans">{record.response}</pre>
                        </div>
                      </div>
                      
                      {record.metadata && Object.keys(record.metadata).length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Metadata</h4>
                          <div className="p-3 bg-slate-700/50 rounded-lg text-white text-sm">
                            <pre className="whitespace-pre-wrap font-sans">{JSON.stringify(record.metadata, null, 2)}</pre>
                          </div>
                        </div>
                      )}
                      
                      {/* Agent Metadata Display */}
                      {record.id && (
                        <div className="mb-4">
                          <AgentMetadataDisplay analysisId={record.id} />
                        </div>
                      )}
                      
                      <div className="flex justify-end space-x-2 mt-4">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(record.response, record.id || '');
                          }}
                          className="px-3 py-1 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
                        >
                          {copiedId === record.id ? (
                            <>
                              <Check className="w-4 h-4 text-green-400" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy</span>
                            </>
                          )}
                        </motion.button>
                        
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExport(record);
                          }}
                          className="px-3 py-1 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
                        >
                          <Download className="w-4 h-4" />
                          <span>Export</span>
                        </motion.button>
                        
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this record?')) {
                              handleDelete(record.id || '');
                            }
                          }}
                          className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors flex items-center space-x-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnalysisHistoryViewer;