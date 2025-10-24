import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader } from 'lucide-react';
import { SafetyAnalysisReport } from '@/components/SafetyAnalysis/SafetyAnalysisReport';
import supabase from '@/services/supabase';

const ReportView: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any | null>(null);

  useEffect(() => {
    if (reportId) {
      fetchReport(reportId);
    }
  }, [reportId]);

  const fetchReport = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/analysis-history/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Report not found');
      }

      const data = await response.json();
      
      // Check if we have structured agent data in metadata
      if (data.metadata && data.metadata.agent1 && data.metadata.agent2 && data.metadata.agent3 && data.metadata.agent4) {
        setReportData({
          agent1: data.metadata.agent1,
          agent2: data.metadata.agent2,
          agent3: data.metadata.agent3,
          agent4: data.metadata.agent4,
          metadata: data.metadata.reportMetadata || {
            reportId: data.id,
            generatedAt: new Date(data.createdAt),
            projectName: data.metadata.projectName || 'Safety Analysis',
            location: data.metadata.location || 'Unknown',
            inspector: 'AI Multi-Agent System'
          }
        });
      } else {
        // Fallback: Try to parse from response text if it's JSON
        try {
          const parsedResponse = JSON.parse(data.response);
          if (parsedResponse.agent1) {
            setReportData({
              agent1: parsedResponse.agent1,
              agent2: parsedResponse.agent2,
              agent3: parsedResponse.agent3,
              agent4: parsedResponse.agent4,
              metadata: parsedResponse.metadata || {
                reportId: data.id,
                generatedAt: new Date(data.createdAt),
                projectName: 'Safety Analysis',
                location: 'Unknown',
                inspector: 'AI Multi-Agent System'
              }
            });
          } else {
            setError('Report data format not supported');
          }
        } catch (parseError) {
          setError('Unable to display this report format');
        }
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Report Not Found</h2>
          <p className="text-slate-400 mb-6">{error || "The report you're looking for doesn't exist or couldn't be loaded."}</p>
          <button
            onClick={() => navigate('/reports')}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 inline-flex items-center gap-2"
            data-testid="button-back-to-reports"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header with Back Navigation */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 to-blue-900 border-b border-blue-500/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/reports')}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            data-testid="button-back-navigation"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Reports</span>
          </button>
        </div>
      </div>

      {/* Report Content - Using existing SafetyAnalysisReport component */}
      <SafetyAnalysisReport
        agent1={reportData.agent1}
        agent2={reportData.agent2}
        agent3={reportData.agent3}
        agent4={reportData.agent4}
        metadata={reportData.metadata}
      />
    </div>
  );
};

export default ReportView;
