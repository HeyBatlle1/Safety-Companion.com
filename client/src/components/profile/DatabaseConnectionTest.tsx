import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap, 
  RefreshCw,
  Users,
  HardDrive,
  Activity
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ConnectionStatus {
  isConnected: boolean;
  responseTime: number;
  error?: string;
  stats?: {
    userCount: number;
    tableCount: number;
    activeConnections: number;
    diskUsage: string;
    version: string;
  };
}

const DatabaseConnectionTest: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const startTime = Date.now();
      const response = await fetch('/api/health/database');
      const endTime = Date.now();
      
      if (response.ok) {
        const data = await response.json();
        setStatus({
          isConnected: data.connection,
          responseTime: endTime - startTime,
          stats: {
            userCount: data.userCount,
            tableCount: data.tableCount,
            activeConnections: data.activeConnections,
            diskUsage: data.diskUsage,
            version: data.version
          }
        });
      } else {
        setStatus({
          isConnected: false,
          responseTime: endTime - startTime,
          error: 'Failed to fetch database status'
        });
      }
    } catch (error) {
      setStatus({
        isConnected: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Connection failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  const getStatusColor = () => {
    if (isLoading) return 'text-blue-400';
    return status?.isConnected ? 'text-green-400' : 'text-red-400';
  };

  const getStatusIcon = () => {
    if (isLoading) return <RefreshCw className="w-5 h-5 animate-spin" />;
    return status?.isConnected ? 
      <CheckCircle className="w-5 h-5" /> : 
      <XCircle className="w-5 h-5" />;
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <Database className="w-5 h-5 text-blue-400" />
          <span>Database Connection</span>
        </h3>
        
        <button
          onClick={testConnection}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Test</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={getStatusColor()}>
              {getStatusIcon()}
            </div>
            <div>
              <p className="font-medium text-white">
                {isLoading ? 'Testing...' : status?.isConnected ? 'Connected' : 'Disconnected'}
              </p>
              <p className="text-sm text-gray-400">
                {status && !isLoading && `Response: ${status.responseTime}ms`}
              </p>
            </div>
          </div>
          
          <Badge 
            variant={status?.isConnected ? "default" : "destructive"}
            className={status?.isConnected ? "bg-green-500/20 text-green-400" : ""}
          >
            {isLoading ? 'Testing' : status?.isConnected ? 'Healthy' : 'Error'}
          </Badge>
        </div>

        {/* Error Display */}
        {status?.error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
            <p className="text-red-400 text-sm">{status.error}</p>
          </div>
        )}

        {/* Database Stats */}
        {status?.isConnected && status.stats && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-gray-700 pt-4 space-y-3"
          >
            <h4 className="text-sm font-medium text-gray-300">Database Statistics</h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>Users</span>
                </span>
                <span className="text-white font-mono">{status.stats.userCount}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center space-x-1">
                  <Database className="w-3 h-3" />
                  <span>Tables</span>
                </span>
                <span className="text-white font-mono">{status.stats.tableCount}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center space-x-1">
                  <Activity className="w-3 h-3" />
                  <span>Connections</span>
                </span>
                <span className="text-white font-mono">{status.stats.activeConnections}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center space-x-1">
                  <HardDrive className="w-3 h-3" />
                  <span>Size</span>
                </span>
                <span className="text-white font-mono">{status.stats.diskUsage}</span>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Version</span>
                <span className="text-white font-mono">{status.stats.version}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Read-only Notice */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
          <p className="text-blue-400 text-xs">
            🔒 Read-only diagnostics for monitoring purposes. No database changes can be made from this interface.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DatabaseConnectionTest;