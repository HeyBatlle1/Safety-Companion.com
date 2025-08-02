import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Server, RefreshCw, Check, AlertTriangle, Table } from 'lucide-react';
import { getSupabaseStatus } from '../../services/supabase';
import { checkDatabaseSchema } from '../../utils/databaseChecker';

interface ProfileDatabaseInfoProps {
  className?: string;
}

const ProfileDatabaseInfo: React.FC<ProfileDatabaseInfoProps> = ({ className = '' }) => {
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    authenticated: boolean;
    tables: string[];
  }>({
    connected: false,
    authenticated: false,
    tables: []
  });
  const [schemaStatus, setSchemaStatus] = useState<{
    success: boolean;
    missingTables: string[];
    missingColumns: { table: string; column: string }[];
  }>({
    success: false,
    missingTables: [],
    missingColumns: []
  });

  const loadStatus = async () => {
    try {
      setLoading(true);
      
      // Get basic status
      const status = await getSupabaseStatus();
      setDbStatus(status);
      
      // If connected, check schema
      if (status.connected) {
        const schema = await checkDatabaseSchema();
        setSchemaStatus(schema);
      }
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Database className="w-5 h-5 mr-2 text-blue-400" />
          Database Status
        </h3>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={loadStatus}
          disabled={loading}
          className="p-2 bg-slate-700/50 rounded-lg text-gray-300 hover:text-white hover:bg-slate-600/50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="p-4 rounded-lg bg-slate-700/50">
            <div className="flex items-center space-x-3 mb-3">
              <Server className="w-5 h-5 text-gray-400" />
              <h4 className="font-medium text-white">Connection</h4>
              <div className={`ml-auto flex items-center rounded-full text-xs px-2 py-1 ${
                dbStatus.connected 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {dbStatus.connected ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    <span>Connected</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    <span>Disconnected</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-400">Authentication:</div>
              <div className={`flex items-center text-sm ${
                dbStatus.authenticated 
                  ? 'text-green-400' 
                  : 'text-yellow-400'
              }`}>
                {dbStatus.authenticated ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    <span>Authenticated</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    <span>Not Authenticated</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Schema Status */}
          {dbStatus.connected && (
            <div className="p-4 rounded-lg bg-slate-700/50">
              <div className="flex items-center space-x-3 mb-3">
                <Table className="w-5 h-5 text-gray-400" />
                <h4 className="font-medium text-white">Database Schema</h4>
                <div className={`ml-auto flex items-center rounded-full text-xs px-2 py-1 ${
                  schemaStatus.success 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {schemaStatus.success ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      <span>Compatible</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      <span>Issues Detected</span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Available Tables */}
              <div className="mb-3">
                <div className="text-sm font-medium text-gray-300 mb-1">Available Tables:</div>
                <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto p-2">
                  {dbStatus.tables.length > 0 ? (
                    dbStatus.tables.map((table) => (
                      <span key={table} className="px-2 py-1 bg-slate-600/50 rounded text-xs text-gray-300">
                        {table}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">No tables found</span>
                  )}
                </div>
              </div>

              {/* Missing Tables */}
              {schemaStatus.missingTables.length > 0 && (
                <div className="mb-3">
                  <div className="text-sm font-medium text-red-400 mb-1">Missing Tables:</div>
                  <div className="flex flex-wrap gap-2">
                    {schemaStatus.missingTables.map((table) => (
                      <span key={table} className="px-2 py-1 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
                        {table}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Columns */}
              {schemaStatus.missingColumns.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-yellow-400 mb-1">Missing Columns:</div>
                  <div className="max-h-20 overflow-y-auto p-1">
                    {schemaStatus.missingColumns.map((col, index) => (
                      <div key={index} className="text-xs text-yellow-400 mb-1">
                        {col.table}.{col.column}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Help Text */}
          <div className="text-xs text-gray-400 mt-2">
            {!dbStatus.connected ? (
              <p>
                Database connection issues could be due to network problems or incorrect configuration.
                User data will be stored locally until connection is restored.
              </p>
            ) : !schemaStatus.success ? (
              <p>
                Schema issues may affect some functionality. The application will use fallbacks when possible.
                Please contact support if issues persist.
              </p>
            ) : (
              <p>
                Database connection is healthy and all required tables are present. The application
                is fully operational.
              </p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ProfileDatabaseInfo;