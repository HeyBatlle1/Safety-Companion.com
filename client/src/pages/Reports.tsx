import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Search,
  Filter,
  ChevronRight,
  Sparkles,
  Shield
} from 'lucide-react';
import supabase from '@/services/supabase';

interface ReportSummary {
  id: string;
  type: string;
  query: string;
  response: string;
  riskScore: number | null;
  urgencyLevel: string | null;
  createdAt: string;
  metadata: any;
}

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/analysis-history', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter for JHA/safety analysis reports
        const safetyReports = data.filter((item: any) => 
          item.type === 'safety_assessment' || item.type === 'jha_analysis'
        );
        setReports(safetyReports);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.query.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || 
      (filterType === 'critical' && report.urgencyLevel === 'critical') ||
      (filterType === 'high' && report.urgencyLevel === 'high');
    return matchesSearch && matchesFilter;
  });

  const getRiskBadge = (level: string | null, score: number | null) => {
    if (level === 'critical' || (score && score >= 80)) {
      return { color: 'bg-red-500/20 text-red-300 border-red-500/30', label: 'Critical' };
    } else if (level === 'high' || (score && score >= 60)) {
      return { color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', label: 'High' };
    } else if (level === 'medium' || (score && score >= 40)) {
      return { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', label: 'Medium' };
    }
    return { color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'Low' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 py-8 px-4">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-slate-900 to-blue-900/20 border-b border-blue-500/10 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">Safety Analysis Reports</h1>
                <p className="text-slate-400 text-sm mt-1">View and manage your safety assessments</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/checklists')}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
              data-testid="button-generate-report"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Generate New Report
              </span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md z-10 py-4 px-2 rounded-xl mb-6 border border-slate-700/50">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  data-testid="input-search"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'all' 
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-blue-500/30'
                }`}
                data-testid="filter-all"
              >
                All
              </button>
              <button
                onClick={() => setFilterType('critical')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'critical' 
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-red-500/30'
                }`}
                data-testid="filter-critical"
              >
                Critical
              </button>
              <button
                onClick={() => setFilterType('high')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'high' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-amber-500/30'
                }`}
                data-testid="filter-high"
              >
                High Priority
              </button>
            </div>
          </div>
        </div>

        {/* Reports Grid */}
        {filteredReports.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <FileText className="w-12 h-12 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No Reports Yet</h2>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Get started by generating your first safety analysis report from a checklist.
            </p>
            <button
              onClick={() => navigate('/checklists')}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
              data-testid="button-generate-first-report"
            >
              Generate Your First Report
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report, index) => {
              const riskBadge = getRiskBadge(report.urgencyLevel, report.riskScore);
              const createdDate = new Date(report.createdAt).toLocaleDateString();
              const previewText = report.query.substring(0, 120) + (report.query.length > 120 ? '...' : '');

              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => navigate(`/reports/${report.id}`)}
                  className="group bg-slate-800/90 border border-blue-500/10 rounded-xl p-6 cursor-pointer hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                  data-testid={`card-report-${report.id}`}
                >
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent rounded-xl pointer-events-none" />
                  
                  <div className="relative">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-400" />
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${riskBadge.color}`}>
                          {riskBadge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 text-sm">
                        <Clock className="w-4 h-4" />
                        {createdDate}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold text-white mb-3 line-clamp-1">
                      {report.metadata?.projectName || 'Safety Analysis'}
                    </h3>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {report.metadata?.location && (
                        <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded">
                          📍 {report.metadata.location}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded">
                        {report.type === 'jha_analysis' ? 'JHA' : 'Safety Assessment'}
                      </span>
                    </div>

                    {/* Key Metrics */}
                    {report.riskScore !== null && (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            {report.riskScore}
                          </p>
                          <p className="text-xs text-slate-400">Risk Score</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-400">
                            {report.metadata?.issuesFound || 0}
                          </p>
                          <p className="text-xs text-slate-400">Issues Found</p>
                        </div>
                      </div>
                    )}

                    {/* Preview Text */}
                    <p className="text-sm text-slate-300 line-clamp-2 mb-4">
                      {previewText}
                    </p>

                    {/* Action Row */}
                    <div className="flex items-center justify-between text-blue-400 group-hover:text-blue-300 transition-colors">
                      <span className="text-sm font-medium">View Full Report</span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
