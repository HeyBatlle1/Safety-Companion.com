import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  ChevronDown, 
  ChevronUp,
  Clock,
  Server,
  Activity,
  Zap,
  Users,
  HardDrive
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DatabaseHealth {
  status: 'healthy' | 'warning' | 'error';
  connection: boolean;
  responseTime: number;
  activeConnections: number;
  lastCheck: Date;
  version: string;
  uptime: string;
  tableCount: number;
  userCount: number;
  diskUsage: string;
  errors: string[];
  warnings: string[];
}

const DatabaseHealthCheck: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [health, setHealth] = useState<DatabaseHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkDatabaseHealth = async () => {
    try {
      const response = await fetch('/api/health/database');
      if (response.ok) {
        const data = await response.json();
        // Debug log removed for production
        setHealth(data);
      } else {
        console.error('Health check failed with status:', response.status);
        setHealth({
          status: 'error',
          connection: false,
          responseTime: 0,
          activeConnections: 0,
          lastCheck: new Date(),
          version: 'Unknown',
          uptime: 'Unknown',
          tableCount: 0,
          userCount: 0,
          diskUsage: 'Unknown',
          errors: [`HTTP ${response.status}: Failed to fetch database health`],
          warnings: []
        });
      }
    } catch (error) {
      console.error('Health check error:', error);
      setHealth({
        status: 'error',
        connection: false,
        responseTime: 0,
        activeConnections: 0,
        lastCheck: new Date(),
        version: 'Unknown',
        uptime: 'Unknown',
        tableCount: 0,
        userCount: 0,
        diskUsage: 'Unknown',
        errors: [error instanceof Error ? error.message : 'Database connection failed'],
        warnings: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkDatabaseHealth();
    // Check every 30 seconds
    const interval = setInterval(checkDatabaseHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (isLoading) return <Activity className="w-4 h-4 animate-pulse text-blue-400" />;
    
    switch (health?.status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Database className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (health?.status) {
      case 'healthy':
        return 'border-green-500/30 bg-green-500/5';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/5';
      case 'error':
        return 'border-red-500/30 bg-red-500/5';
      default:
        return 'border-gray-500/30 bg-gray-500/5';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <motion.div
        className={`border rounded-lg backdrop-blur-sm ${getStatusColor()}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Minimized View */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 p-3 hover:bg-white/5 transition-colors rounded-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {getStatusIcon()}
          <span className="text-sm font-medium text-gray-300">
            DB
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </motion.button>

        {/* Expanded View */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-gray-700/50 p-4 min-w-[300px]"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                    <Database className="w-5 h-5" />
                    <span>Database Health</span>
                  </h3>
                  <Badge 
                    variant="secondary" 
                    className={`
                      ${health?.status === 'healthy' ? 'bg-green-500/20 text-green-400' : ''}
                      ${health?.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                      ${health?.status === 'error' ? 'bg-red-500/20 text-red-400' : ''}
                    `}
                  >
                    {isLoading ? 'Checking...' : health?.status?.toUpperCase()}
                  </Badge>
                </div>

                {health && (
                  <div className="space-y-3">
                    {/* Connection Status */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-gray-300">Connection</span>
                        <Badge variant={health.connection ? "default" : "destructive"} className="text-xs">
                          {health.connection ? 'Active' : 'Failed'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-gray-300">Response</span>
                        <span className="text-sm font-mono text-white">
                          {health.responseTime}ms
                        </span>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>Users</span>
                          </span>
                          <span className="text-white font-mono">{health.userCount}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 flex items-center space-x-1">
                            <Server className="w-3 h-3" />
                            <span>Tables</span>
                          </span>
                          <span className="text-white font-mono">{health.tableCount}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 flex items-center space-x-1">
                            <Activity className="w-3 h-3" />
                            <span>Connections</span>
                          </span>
                          <span className="text-white font-mono">{health.activeConnections}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 flex items-center space-x-1">
                            <HardDrive className="w-3 h-3" />
                            <span>Disk</span>
                          </span>
                          <span className="text-white font-mono">{health.diskUsage}</span>
                        </div>
                      </div>
                    </div>

                    {/* Version & Uptime */}
                    <div className="border-t border-gray-700/50 pt-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Version</span>
                        <span className="text-white font-mono">{health.version}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Uptime</span>
                        <span className="text-white font-mono">{health.uptime}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Last Check</span>
                        <span className="text-white font-mono">
                          {health.lastCheck.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    {/* Errors */}
                    {health.errors.length > 0 && (
                      <div className="border-t border-gray-700/50 pt-3">
                        <h4 className="text-sm font-medium text-red-400 mb-2">Errors</h4>
                        <div className="space-y-1">
                          {health.errors.map((error, index) => (
                            <div key={index} className="text-xs text-red-300 bg-red-500/10 rounded p-2">
                              {error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Warnings */}
                    {health.warnings.length > 0 && (
                      <div className="border-t border-gray-700/50 pt-3">
                        <h4 className="text-sm font-medium text-yellow-400 mb-2">Warnings</h4>
                        <div className="space-y-1">
                          {health.warnings.map((warning, index) => (
                            <div key={index} className="text-xs text-yellow-300 bg-yellow-500/10 rounded p-2">
                              {warning}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Read-only notice */}
                <div className="border-t border-gray-700/50 pt-3">
                  <p className="text-xs text-gray-500 italic">
                    Read-only diagnostic information. No changes can be made from this interface.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default DatabaseHealthCheck;