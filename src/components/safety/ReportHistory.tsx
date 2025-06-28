import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Eye, Trash2 } from 'lucide-react';
import { SafetyReport } from '../../types/safety';
import ReportDetail from './ReportDetail';

interface ReportHistoryProps {
  reports: SafetyReport[];
  onDeleteReport?: (id: string) => void;
}

const ReportHistory: React.FC<ReportHistoryProps> = ({ reports, onDeleteReport }) => {
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedReportId(expandedReportId === id ? null : id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'investigating':
        return <AlertCircle className="w-4 h-4 text-blue-400" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-green-500/20 text-green-400';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'high':
        return 'bg-orange-500/20 text-orange-400';
      case 'critical':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Report History</h3>

      {reports.length === 0 ? (
        <div className="text-center py-6 bg-slate-800/30 rounded-lg">
          <AlertTriangle className="w-10 h-10 text-yellow-400 mx-auto mb-3 opacity-50" />
          <p className="text-gray-400">No safety reports have been submitted yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).map((report) => (
            <div key={report.id} className="bg-slate-800/30 backdrop-blur-sm rounded-lg overflow-hidden">
              <div
                className="p-4 cursor-pointer"
                onClick={() => toggleExpand(report.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(report.status)}
                    <div>
                      <div className="text-white font-medium">
                        {report.category.charAt(0).toUpperCase() + report.category.slice(1)} Issue
                      </div>
                      <div className="text-sm text-gray-400">
                        {formatDate(report.submittedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(report.severity)}`}>
                      {report.severity.toUpperCase()}
                    </span>
                    {expandedReportId === report.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {expandedReportId === report.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <ReportDetail report={report} />
                    
                    <div className="p-4 pt-0 flex justify-end space-x-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center space-x-1 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-md text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(report.id);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        <span>Close</span>
                      </motion.button>
                      
                      {onDeleteReport && (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center space-x-1 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this report?')) {
                              onDeleteReport(report.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportHistory;