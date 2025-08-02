import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Plus, List, ArrowLeft, ArrowRight } from 'lucide-react';
import ReportForm from '../components/safety/ReportForm';
import ReportHistory from '../components/safety/ReportHistory';
import BackButton from '../components/navigation/BackButton';
import { SafetyReport } from '../types/safety';
import { addReport, getAllReports, deleteReport, processReportFiles } from '../services/safetyReports';
import { getCurrentUser } from '../services/supabase';

const Safety = () => {
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [showForm, setShowForm] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication and load existing reports
    const initPage = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if user is authenticated
        const user = await getCurrentUser();
        setIsAuthenticated(!!user);
        
        // Load reports from Supabase (or localStorage fallback)
        const existingReports = await getAllReports();
        setReports(existingReports);
      } catch (error) {
        
        setError('Failed to load safety reports. Using local storage instead.');
        
        // Try to get reports from localStorage as a fallback
        try {
          const reportsJSON = localStorage.getItem('safety-companion-reports');
          if (reportsJSON) {
            setReports(JSON.parse(reportsJSON));
          }
        } catch (localError) {
          
        }
      } finally {
        setLoading(false);
      }
    };
    
    initPage();
  }, []);

  const handleSubmitReport = async (formData: FormData) => {
    try {
      setError(null);
      
      // Extract file attachments
      const files: File[] = [];
      formData.getAll('files').forEach(file => {
        if (file instanceof File) {
          files.push(file);
        }
      });
      
      // Process file attachments
      const attachments = await processReportFiles(files);
      
      // Create report object
      const reportData = {
        severity: formData.get('severity') as 'low' | 'medium' | 'high' | 'critical',
        category: formData.get('category') as string,
        description: formData.get('description') as string,
        location: (formData.get('location') as string) || undefined,
        attachments
      };
      
      // Add report to Supabase (or localStorage fallback)
      const newReport = await addReport(reportData);
      
      // Update local state
      setReports(prev => [newReport, ...prev]);
      
      // Switch to history view after submission
      setShowForm(false);

      return newReport;
    } catch (error) {
      
      setError('Failed to submit report. Please try again.');
      throw error;
    }
  };

  const handleDeleteReport = async (id: string) => {
    try {
      setError(null);
      const success = await deleteReport(id);
      if (success) {
        setReports(prev => prev.filter(report => report.id !== id));
      } else {
        setError('Could not delete the report. Please try again.');
      }
    } catch (error) {
      
      setError('Failed to delete report. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex items-center justify-between">
          <BackButton />
          <div className="text-center flex-1">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center space-x-2 mb-4"
            >
              <AlertTriangle className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                Safety Reporting
              </h1>
            </motion.div>
          </div>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm flex items-center"
          >
            <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <div className="flex justify-center space-x-4 mb-6">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className={`px-5 py-2 rounded-full flex items-center space-x-2 ${
              showForm
                ? 'bg-blue-500 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            <Plus className="w-5 h-5" />
            <span>New Report</span>
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(false)}
            className={`px-5 py-2 rounded-full flex items-center space-x-2 ${
              !showForm
                ? 'bg-blue-500 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            <List className="w-5 h-5" />
            <span>History</span>
            {reports.length > 0 && (
              <span className="ml-1 bg-blue-600 text-xs px-2 py-0.5 rounded-full">
                {reports.length}
              </span>
            )}
          </motion.button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {showForm ? (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
                <p className="text-gray-300 mb-6">
                  Use this form to report any safety concerns, security vulnerabilities, or compliance issues.
                  All reports are treated confidentially and will be investigated promptly.
                </p>
                <ReportForm 
                  onSubmit={handleSubmitReport}
                  onSuccess={() => {
                    // Auto-switch to report history after successful submission
                    setTimeout(() => setShowForm(false), 1500);
                  }}
                />
              </div>
            ) : (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
                <ReportHistory 
                  reports={reports} 
                  onDeleteReport={handleDeleteReport}
                />
                {reports.length > 0 && (
                  <div className="mt-6 flex justify-center">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowForm(true)}
                      className="px-5 py-2 bg-blue-500 text-white rounded-lg flex items-center space-x-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Submit New Report</span>
                    </motion.button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Safety;