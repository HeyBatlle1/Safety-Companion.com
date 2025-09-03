import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Shield, 
  Activity,
  TrendingUp,
  AlertTriangle,
  Award,
  FileText,
  BarChart3,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { analyticsService, type AnalyticsData, type SafetyMetrics } from '../../services/googleAnalytics';

interface AdminMetrics {
  totalEmployees: number;
  activeProjects: number;
  safetyScore: number;
  incidentRate: number;
  trainingCompliance: number;
  certificationStatus: {
    current: number;
    expiringSoon: number;
    expired: number;
  };
  budgetUtilization: number;
  recentIncidents: Array<{
    id: string;
    date: string;
    severity: 'low' | 'medium' | 'high';
    location: string;
    status: 'open' | 'investigating' | 'resolved';
  }>;
}

const EnhancedAdminDashboard: React.FC = () => {
  // Real metrics will be loaded from API
  const [metrics, setMetrics] = React.useState<AdminMetrics>({
    totalEmployees: 0,
    activeProjects: 0,
    safetyScore: 0,
    incidentRate: 0,
    trainingCompliance: 0,
    certificationStatus: {
      current: 0,
      expiringSoon: 0,
      expired: 0
    },
    budgetUtilization: 0,
    recentIncidents: []
  });

  React.useEffect(() => {
    // TODO: Load real metrics from API
    // loadAdminMetrics().then(setMetrics);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-400 bg-green-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'high': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'text-green-400';
      case 'investigating': return 'text-yellow-400';
      case 'open': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
          Enterprise Safety Command Center
        </h2>
        <p className="text-gray-400 mt-2">Scalable workforce monitoring designed for mid-sized construction operations</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border border-blue-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Safety Score</p>
              <p className="text-3xl font-bold text-white">{metrics.safetyScore}%</p>
              <p className="text-xs text-green-400 mt-1">↑ 2.3% from last month</p>
            </div>
            <Shield className="w-10 h-10 text-blue-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-green-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Training Compliance</p>
              <p className="text-3xl font-bold text-white">{metrics.trainingCompliance}%</p>
              <p className="text-xs text-gray-400 mt-1">{Math.floor(metrics.totalEmployees * metrics.trainingCompliance / 100)} employees</p>
            </div>
            <Award className="w-10 h-10 text-green-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl border border-amber-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Incident Rate</p>
              <p className="text-3xl font-bold text-white">{metrics.incidentRate}</p>
              <p className="text-xs text-amber-400 mt-1">Per 100k hours</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-amber-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active Projects</p>
              <p className="text-3xl font-bold text-white">{metrics.activeProjects}</p>
              <p className="text-xs text-gray-400 mt-1">Across 6 sites</p>
            </div>
            <Activity className="w-10 h-10 text-purple-400" />
          </div>
        </motion.div>
      </div>

      {/* Certification Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-800/50 backdrop-blur-xl border border-blue-500/20 rounded-xl p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Award className="w-6 h-6 mr-2 text-blue-400" />
          Certification Overview
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{metrics.certificationStatus.current}</p>
            <p className="text-sm text-gray-400">Current</p>
          </div>
          <div className="text-center p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <Clock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{metrics.certificationStatus.expiringSoon}</p>
            <p className="text-sm text-gray-400">Expiring Soon</p>
          </div>
          <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{metrics.certificationStatus.expired}</p>
            <p className="text-sm text-gray-400">Expired</p>
          </div>
        </div>
      </motion.div>

      {/* Recent Incidents */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-slate-800/50 backdrop-blur-xl border border-blue-500/20 rounded-xl p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <AlertTriangle className="w-6 h-6 mr-2 text-amber-400" />
          Recent Safety Incidents
        </h3>
        <div className="space-y-3">
          {metrics.recentIncidents.map((incident) => (
            <div key={incident.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                  {incident.severity.toUpperCase()}
                </span>
                <div>
                  <p className="text-white font-medium">{incident.location}</p>
                  <p className="text-xs text-gray-400">{incident.date}</p>
                </div>
              </div>
              <span className={`text-sm font-medium ${getStatusColor(incident.status)}`}>
                {incident.status}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Financial Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-slate-800/50 backdrop-blur-xl border border-blue-500/20 rounded-xl p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <DollarSign className="w-6 h-6 mr-2 text-green-400" />
          Budget & Resource Utilization
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Safety Budget Utilization</span>
              <span className="text-white font-medium">{metrics.budgetUtilization}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metrics.budgetUtilization}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <p className="text-2xl font-bold text-white">$2.4M</p>
              <p className="text-xs text-gray-400">Annual Safety Budget</p>
            </div>
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <p className="text-2xl font-bold text-white">$1.87M</p>
              <p className="text-xs text-gray-400">YTD Spending</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transition-all"
        >
          <FileText className="w-6 h-6 mx-auto mb-2" />
          Generate Report
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transition-all"
        >
          <Users className="w-6 h-6 mx-auto mb-2" />
          Manage Teams
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transition-all"
        >
          <Award className="w-6 h-6 mx-auto mb-2" />
          Certifications
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transition-all"
        >
          <BarChart3 className="w-6 h-6 mx-auto mb-2" />
          Analytics
        </motion.button>
      </div>
    </div>
  );
};

export default EnhancedAdminDashboard;