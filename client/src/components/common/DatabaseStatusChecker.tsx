import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Database, X, RefreshCw } from 'lucide-react';
import { checkDatabaseSchema, checkDatabaseConnection } from '../../utils/databaseChecker';
import { getSupabaseStatus } from '../../services/supabase';
import { showToast } from './ToastContainer';

interface DatabaseStatusCheckerProps {
  onStatusChange?: (status: 'ok' | 'warning' | 'error') => void;
}

const DatabaseStatusChecker: React.FC<DatabaseStatusCheckerProps> = ({ onStatusChange }) => {
  const [showStatus, setShowStatus] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'ok' | 'warning' | 'error' | 'unknown'>('unknown');
  const [schemaStatus, setSchemaStatus] = useState<'ok' | 'warning' | 'error' | 'unknown'>('unknown');
  const [details, setDetails] = useState<any>(null);
  const [message, setMessage] = useState<string>('');

  const checkStatus = async () => {
    try {
      setIsChecking(true);
      
      // First check basic connectivity
      const supabaseStatus = await getSupabaseStatus();
      
      if (!supabaseStatus.connected) {
        setConnectionStatus('error');
        setSchemaStatus('unknown');
        setMessage('Cannot connect to Supabase. Please check your configuration.');
        
        if (onStatusChange) {
          onStatusChange('error');
        }
        
        setIsChecking(false);
        return;
      }
      
      // Now check if we're authenticated
      if (!supabaseStatus.authenticated) {
        setConnectionStatus('warning');
        setSchemaStatus('unknown');
        setMessage('Connected to Supabase but not authenticated');
        
        if (onStatusChange) {
          onStatusChange('warning');
        }
        
        setIsChecking(false);
        return;
      }
      
      // Check more detailed connection status
      const connection = await checkDatabaseConnection();
      const connectionStatus = connection.connected 
        ? connection.authenticated ? 'ok' : 'warning'
        : 'error';
      setConnectionStatus(connectionStatus);
      
      // Only check schema if connected
      if (connection.connected) {
        const schema = await checkDatabaseSchema();
        const schemaStatus = schema.success 
          ? 'ok' 
          : (schema.missingTables.length > 0 ? 'error' : 'warning');
        setSchemaStatus(schemaStatus);
        setDetails({
          connection,
          schema
        });
        
        // Set overall message
        if (!connection.connected) {
          setMessage('Database connection failed');
        } else if (!connection.authenticated) {
          setMessage('Connected to database but not authenticated');
        } else if (!schema.success) {
          setMessage(`Database schema issues: ${schema.missingTables.length} missing tables, ${schema.missingColumns.length} missing columns`);
        } else {
          setMessage('Database connection and schema are OK');
        }
      } else {
        setSchemaStatus('unknown');
        setDetails({ connection });
        setMessage(connection.message);
      }
      
      // Notify parent component
      if (onStatusChange) {
        if (connectionStatus === 'error' || schemaStatus === 'error') {
          onStatusChange('error');
        } else if (connectionStatus === 'warning' || schemaStatus === 'warning') {
          onStatusChange('warning');
        } else if (connectionStatus === 'ok' && schemaStatus === 'ok') {
          onStatusChange('ok');
        }
      }
    } catch (error) {
      console.error('Error checking database status:', error);
      setConnectionStatus('error');
      setSchemaStatus('unknown');
      setMessage('Error checking database status');
      if (onStatusChange) {
        onStatusChange('error');
      }
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Set up regular checking
    const interval = setInterval(checkStatus, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Determine overall status
  const getOverallStatus = (): 'ok' | 'warning' | 'error' | 'unknown' => {
    if (connectionStatus === 'error') return 'error';
    if (schemaStatus === 'error') return 'error';
    if (connectionStatus === 'warning' || schemaStatus === 'warning') return 'warning';
    if (connectionStatus === 'ok' && schemaStatus === 'ok') return 'ok';
    return 'unknown';
  };
  
  // Get status icon
  const StatusIcon = () => {
    const status = getOverallStatus();
    
    if (isChecking) {
      return <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />;
    }
    
    switch (status) {
      case 'ok':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Database className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="relative">
      {/* Status indicator button */}
      <button
        onClick={() => setShowStatus(!showStatus)}
        className={`p-2 rounded-full ${
          getOverallStatus() === 'ok'
            ? 'bg-green-100/10 text-green-500 hover:bg-green-100/20'
            : getOverallStatus() === 'warning'
            ? 'bg-yellow-100/10 text-yellow-500 hover:bg-yellow-100/20'
            : getOverallStatus() === 'error'
            ? 'bg-red-100/10 text-red-500 hover:bg-red-100/20'
            : 'bg-gray-100/10 text-gray-400 hover:bg-gray-100/20'
        } transition-colors`}
        title="Database Status"
      >
        <StatusIcon />
      </button>

      {/* Status popup */}
      <AnimatePresence>
        {showStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 bg-slate-800/90 backdrop-blur-sm border border-blue-500/20 rounded-lg shadow-xl z-10"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">Supabase Status</h3>
                <button
                  onClick={() => setShowStatus(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-gray-300 mb-3">
                {message}
              </p>

              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Connection</span>
                  <span className={`text-xs ${
                    connectionStatus === 'ok' ? 'text-green-500' :
                    connectionStatus === 'warning' ? 'text-yellow-500' :
                    connectionStatus === 'error' ? 'text-red-500' : 'text-gray-400'
                  }`}>
                    {connectionStatus === 'ok' ? 'Connected' :
                     connectionStatus === 'warning' ? 'Warning' :
                     connectionStatus === 'error' ? 'Failed' : 'Unknown'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Schema</span>
                  <span className={`text-xs ${
                    schemaStatus === 'ok' ? 'text-green-500' :
                    schemaStatus === 'warning' ? 'text-yellow-500' :
                    schemaStatus === 'error' ? 'text-red-500' : 'text-gray-400'
                  }`}>
                    {schemaStatus === 'ok' ? 'Compatible' :
                     schemaStatus === 'warning' ? 'Minor Issues' :
                     schemaStatus === 'error' ? 'Major Issues' : 'Unknown'}
                  </span>
                </div>
              </div>

              {details?.schema?.missingTables?.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs font-medium text-gray-300 mb-1">Missing Tables:</div>
                  <div className="text-xs text-gray-400 max-h-20 overflow-y-auto">
                    {details.schema.missingTables.map((table: string) => (
                      <div key={table} className="py-0.5">{table}</div>
                    ))}
                  </div>
                </div>
              )}

              {details?.schema?.missingColumns?.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs font-medium text-gray-300 mb-1">Missing Columns:</div>
                  <div className="text-xs text-gray-400 max-h-20 overflow-y-auto">
                    {details.schema.missingColumns.map((col: {table: string; column: string}, index: number) => (
                      <div key={index} className="py-0.5">
                        {col.table}.{col.column}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    checkStatus();
                    showToast('Checking database status...', 'info');
                  }}
                  disabled={isChecking}
                  className="flex items-center text-xs px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                >
                  {isChecking ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      <span>Refresh</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DatabaseStatusChecker;