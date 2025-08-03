import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Upload, X, Camera, MapPin, Loader, Check, ArrowLeft, Clock, Save, Printer, Share2, Flag, MessageSquare, Plus, Send, Sparkles, CheckCircle, XCircle, FileText, FileImage, Building, Eye } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { checklistData } from './checklistData';
import BackButton from '../navigation/BackButton';
import { getCurrentUser } from '../../services/supabase';
import { getMSDSResponse } from '../../services/msdsChat';
import { saveChecklistResponse } from '../../services/checklistService';
import { showToast } from '../common/ToastContainer';
import { safetyCompanionAPI, type RiskProfile, type SafetyAnalysis } from '../../services/safetyCompanionAPI';
import { blueprintStorage, type BlueprintUpload } from '../../services/blueprintStorage';
import { multiModalAnalysis } from '../../services/multiModalAnalysis';
import { ReportFormatter } from '../../services/reportFormatter';

interface ChecklistItem {
  id: string;
  question: string;
  options: string[];
  notes?: boolean;
  critical?: boolean;
  images?: boolean;
  deadline?: boolean;
}

interface Section {
  title: string;
  items: ChecklistItem[];
}

interface Response {
  value: string;
  timestamp: string;
  images?: string[];
  blueprints?: BlueprintUpload[];
  notes?: string;
  deadline?: string;
  flagged?: boolean;
}

const ChecklistForm = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromSDS = location.state?.fromSDS;
  
  const template = templateId && checklistData[templateId] 
    ? checklistData[templateId] 
    : { title: 'Unknown Checklist', sections: [] };
  
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [responseHistory, setResponseHistory] = useState<any[]>([]);
  const [shareSuccess, setShareSuccess] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [safetyAnalysis, setSafetyAnalysis] = useState<SafetyAnalysis | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'standard' | 'intelligent'>('intelligent');
  const [uploadingBlueprints, setUploadingBlueprints] = useState<Record<string, boolean>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const handleResponse = (itemId: string, value: string) => {
    const updatedResponses = {
      ...responses,
      [itemId]: {
        ...responses[itemId],
        value,
        timestamp: new Date().toISOString()
      }
    };
    setResponses(updatedResponses);
    localStorage.setItem(`checklist-${templateId}-responses`, JSON.stringify(updatedResponses));
  };

  const toggleFlag = (itemId: string) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        flagged: !prev[itemId]?.flagged,
        timestamp: new Date().toISOString()
      }
    }));
  };

  const handleNotes = (itemId: string, notes: string) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        notes,
        timestamp: new Date().toISOString()
      }
    }));
  };

  const handleDeadline = (itemId: string, deadline: string) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        deadline,
        timestamp: new Date().toISOString()
      }
    }));
  };

  const handleImageUpload = async (itemId: string, files: FileList) => {
    const imagePromises = Array.from(files).map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    try {
      const images = await Promise.all(imagePromises);
      setResponses(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          images: [...(prev[itemId]?.images || []), ...images],
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error) {
      
      showToast('Failed to upload images. Please try again.', 'error');
    }
  }

  const handleBlueprintUpload = async (itemId: string, files: FileList) => {
    setUploadingBlueprints(prev => ({ ...prev, [itemId]: true }));
    
    try {
      const user = await getCurrentUser();
      if (!user) {
        showToast('Please log in to upload blueprints', 'error');
        return;
      }

      const uploadPromises = Array.from(files).map(file => 
        blueprintStorage.uploadBlueprint(file, templateId || 'unknown', itemId, user.id)
      );

      const uploadedBlueprints = await Promise.all(uploadPromises);
      
      setResponses(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          blueprints: [...(prev[itemId]?.blueprints || []), ...uploadedBlueprints],
          timestamp: new Date().toISOString()
        }
      }));

      showToast(`Successfully uploaded ${files.length} blueprint(s)`, 'success');
    } catch (error) {
      console.error('Blueprint upload error:', error);
      showToast('Failed to upload blueprints. Please try again.', 'error');
    } finally {
      setUploadingBlueprints(prev => ({ ...prev, [itemId]: false }));
    }
  };

  useEffect(() => {
    // Load previous responses from localStorage
    const savedResponses = localStorage.getItem(`checklist-${templateId}-responses`);
    if (savedResponses) {
      setResponses(JSON.parse(savedResponses));
    }

    // Load response history
    const history = Object.keys(localStorage)
      .filter(key => key.startsWith(`checklist-${templateId}-`) && !key.endsWith('-responses'))
      .map(key => JSON.parse(localStorage.getItem(key) || '{}'))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setResponseHistory(history);
    
    // Expand all sections initially
    const initialExpandedState: Record<string, boolean> = {};
    template.sections.forEach((_, index) => {
      initialExpandedState[index] = true;
    });
    setExpandedSections(initialExpandedState);
  }, [templateId, template.sections]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);
    setAiResponse(null);
    setSafetyAnalysis(null);

    try {
      // Format checklist data for enhanced AI processing
      const checklistData = {
        template: template.title,
        templateId: templateId,
        sections: template.sections.map(section => ({
          title: section.title,
          responses: section.items.map(item => ({
            question: item.question,
            response: responses[item.id]?.value || 'No response',
            notes: responses[item.id]?.notes,
            critical: item.critical || false,
            flagged: responses[item.id]?.flagged || false,
            aiWeight: item.aiWeight || 1,
            riskCategory: item.riskCategory,
            complianceStandard: item.complianceStandard,
            images: responses[item.id]?.images || [],
            blueprints: responses[item.id]?.blueprints || []
          }))
        }))
      };

      if (analysisMode === 'intelligent') {
        // Collect all blueprints and images for multi-modal analysis
        const allBlueprints: BlueprintUpload[] = [];
        const allImages: string[] = [];
        
        template.sections.forEach(section => {
          section.items.forEach(item => {
            const itemResponse = responses[item.id];
            if (itemResponse?.blueprints && itemResponse.blueprints.length > 0) {
              allBlueprints.push(...itemResponse.blueprints);
            }
            if (itemResponse?.images && itemResponse.images.length > 0) {
              allImages.push(...itemResponse.images);
            }
          });
        });

        // Get real OSHA risk profile first
        const oshaRiskProfile = await safetyCompanionAPI.getRiskProfile(templateId || 'general-construction', checklistData);
        setRiskProfile(oshaRiskProfile);

        // Perform multi-modal analysis if blueprints or images exist
        if (allBlueprints.length > 0 || allImages.length > 0) {
          showToast('Analyzing blueprints and images with AI...', 'info');
          
          const multiModalResult = await multiModalAnalysis.analyzeComprehensive({
            checklistData,
            blueprints: allBlueprints,
            images: allImages,
            railwayData: oshaRiskProfile // Include railway system data
          });

          // Generate professional markdown report
          const formattedReport = ReportFormatter.formatMultiModalReport(
            multiModalResult, 
            template.title, 
            allBlueprints.length, 
            allImages.length
          );
          
          setAiResponse(formattedReport);
          showToast('Complete AI analysis with blueprint pattern recognition finished!', 'success');
        } else {
          // Standard intelligent analysis without visual data
          const intelligentAnalysis = await safetyCompanionAPI.analyzeChecklist(checklistData, oshaRiskProfile || undefined);
          
          // Convert SafetyAnalysis to SafetyAnalysisReport format
          const reportData = {
            risk_level: intelligentAnalysis.risk_level,
            overall_score: intelligentAnalysis.score || 75,
            critical_issues: intelligentAnalysis.critical_issues || [],
            recommendations: intelligentAnalysis.recommendations || [],
            action_items: intelligentAnalysis.action_items || [],
            compliance_status: intelligentAnalysis.compliance_status || 'Under Review',
            summary: intelligentAnalysis.summary || 'Safety analysis completed successfully.'
          };
          
          // Format the response as professional markdown
          const formattedReport = ReportFormatter.formatStandardSafetyReport(reportData, template.title);
          setAiResponse(formattedReport);
          setSafetyAnalysis(intelligentAnalysis);

          if (oshaRiskProfile) {
            showToast(`Analysis complete! Risk Level: ${intelligentAnalysis.risk_level.toUpperCase()}`, 'success');
          } else {
            showToast('Analysis complete using local intelligence (OSHA API unavailable)', 'success');
          }
        }
      } else {
        // Standard analysis using existing system
        const prompt = `As a safety expert, please analyze this comprehensive safety checklist and provide detailed recommendations:

${JSON.stringify(checklistData, null, 2)}

Please provide a structured analysis including:
1. Critical safety risks identified
2. Compliance status assessment
3. Immediate action items
4. Long-term recommendations
5. Training needs
6. Follow-up requirements

Format your response professionally with clear sections and actionable insights.`;

        const aiAnalysis = await getMSDSResponse(prompt);
        setAiResponse(aiAnalysis);
        showToast('Standard analysis completed successfully!', 'success');
      }

      // Save to database (handle gracefully if fails)
      try {
        await saveChecklistResponse(
          templateId || 'unknown',
          template.title,
          responses
        );
      } catch (saveError) {
        
        showToast('Analysis completed! (Database save pending - check connection)', 'warning');
      }
    } catch (error) {
      
      setError(error instanceof Error ? error.message : 'Failed to process checklist');
      showToast('Error processing checklist', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    try {
      const timestamp = new Date().toISOString();
      
      // Check authentication before saving
      const user = await getCurrentUser();
      if (!user) {
        setError('Please sign in to save the checklist');
        showToast('Authentication required', 'error');
        return;
      }
      
      const data = {
        templateId,
        responses,
        timestamp,
        title: template.title
      };
      
      // Save current state
      localStorage.setItem(`checklist-${templateId}-responses`, JSON.stringify(responses));
      
      // Save to history
      localStorage.setItem(`checklist-${templateId}-${timestamp}`, JSON.stringify(data));
      
      // Show success toast
      showToast('Checklist saved successfully!', 'success');
      
      // Update history
      const history = Object.keys(localStorage)
        .filter(key => key.startsWith(`checklist-${templateId}-`) && !key.endsWith('-responses'))
        .map(key => JSON.parse(localStorage.getItem(key) || '{}'))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setResponseHistory(history);
    } catch (error) {
      setError('Failed to save checklist');
      showToast('Error saving checklist', 'error');
    }
  };

  const handlePrint = () => {
    // Create a printable version
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <style>
        @media print {
          body { font-family: Arial, sans-serif; }
          .header { margin-bottom: 20px; }
          .section { margin-bottom: 15px; }
          .item { margin-bottom: 10px; }
          .response { margin-left: 20px; }
          .notes { margin-left: 20px; font-style: italic; }
          .timestamp { color: #666; font-size: 0.9em; }
          @page { margin: 2cm; }
        }
      </style>
      <div class="header">
        <h1>${template.title}</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
      </div>
    `;

    template.sections.forEach(section => {
      const sectionDiv = document.createElement('div');
      sectionDiv.className = 'section';
      sectionDiv.innerHTML = `<h2>${section.title}</h2>`;

      section.items.forEach(item => {
        const response = responses[item.id];
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item';
        itemDiv.innerHTML = `
          <p><strong>${item.question}</strong></p>
          ${response ? `
            <p class="response">Response: ${response.value}</p>
            ${response.notes ? `<p class="notes">Notes: ${response.notes}</p>` : ''}
            ${response.deadline ? `<p class="timestamp">Deadline: ${new Date(response.deadline).toLocaleString()}</p>` : ''}
          ` : '<p class="response">No response recorded</p>'}
        `;
        sectionDiv.appendChild(itemDiv);
      });

      printContent.appendChild(sectionDiv);
    });

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent.innerHTML);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const shareReport = async () => {
    if (!aiResponse) {
      showToast('No report available to share', 'error');
      return;
    }

    try {
      const formattedForSharing = ReportFormatter.formatForSharing(aiResponse);
      
      if (navigator.share) {
        await navigator.share({
          title: `Safety Report: ${template.title}`,
          text: formattedForSharing
        });
        showToast('Report shared successfully!', 'success');
      } else {
        await navigator.clipboard.writeText(formattedForSharing);
        showToast('Report copied to clipboard!', 'success');
      }
    } catch (error) {
      showToast('Failed to share report', 'error');
    }
  };

  const emailReport = async () => {
    if (!aiResponse) {
      showToast('No report available to email', 'error');
      return;
    }

    try {
      const emailData = ReportFormatter.formatForEmail(aiResponse, template.title);
      const mailtoLink = `mailto:?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
      window.open(mailtoLink);
      showToast('Email client opened with report!', 'success');
    } catch (error) {
      showToast('Failed to prepare email', 'error');
    }
  };

  const saveReportToDatabase = async () => {
    if (!aiResponse) {
      showToast('No report available to save', 'error');
      return;
    }

    try {
      const user = await getCurrentUser();
      if (!user) {
        showToast('Please log in to save reports', 'error');
        return;
      }

      const reportData = ReportFormatter.formatForDatabase(aiResponse, templateId || 'unknown', user.id);
      // Save as simple object since saveChecklistResponse expects basic data
      await saveChecklistResponse(reportData.id, reportData);
      showToast('Report saved to database successfully!', 'success');
    } catch (error) {
      showToast('Failed to save report to database', 'error');
    }
  };

  const handleShare = async () => {
    try {
      setShareSuccess(null);
      const data = {
        templateId,
        title: template.title,
        responses,
        timestamp: new Date().toISOString()
      };

      // Create a shareable format - simplified for smaller size
      const shareableText = `${template.title} Checklist - ${new Date().toLocaleDateString()}`;
      const shareableUrl = window.location.href;
      
      // Try to use the native share API if available
      if (navigator.share) {
        try {
          await navigator.share({
            title: template.title,
            text: shareableText,
            url: shareableUrl
          });
          setShareSuccess(true);
        } catch (shareError: any) {
          // Many browsers throw permission denied errors in certain contexts
          // Fall back to clipboard if sharing fails
          if (shareError.name === 'NotAllowedError' || 
              shareError.name === 'AbortError' ||
              shareError.message.includes('Permission')) {
            await navigatorShareFallback();
          } else {
            throw shareError;
          }
        }
      } else {
        // Fallback for browsers that don't support navigator.share
        await navigatorShareFallback();
      }
    } catch (error) {
      
      setShareSuccess(false);
      showToast('Failed to share checklist. Data copied to clipboard instead.', 'warning');
    }
  };

  const navigatorShareFallback = async () => {
    // Create a simplified version for clipboard
    const shareableSummary = `
${template.title}
Date: ${new Date().toLocaleDateString()}
URL: ${window.location.href}
Progress: ${Math.round(calculateProgress())}% complete
    `;
    
    try {
      await navigator.clipboard.writeText(shareableSummary);
      setShareSuccess(true);
      showToast('Checklist data copied to clipboard!', 'success');
    } catch (clipboardError) {
      
      setShareSuccess(false);
      throw new Error('Could not share or copy to clipboard.');
    }
  };

  const handleTimeView = () => {
    setShowHistory(!showHistory);
    if (!showHistory) {
      // Load and sort history when opening
      const history = Object.keys(localStorage)
        .filter(key => key.startsWith(`checklist-${templateId}-`) && !key.endsWith('-responses'))
        .map(key => JSON.parse(localStorage.getItem(key) || '{}'))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setResponseHistory(history);
    }
  };

  const loadHistoricalData = (historicalResponses: any) => {
    setResponses(historicalResponses.responses);
    setShowHistory(false);
  };

  const handleBack = () => {
    if (fromSDS) {
      navigate('/sds', { state: { fromChecklist: true } });
    } else {
      navigate(-1);
    }
  };

  const handleCaptureImage = async (itemId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Create video element
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      // Wait for video to initialize
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Create canvas and capture image
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      
      // Get data URL
      const imageUrl = canvas.toDataURL('image/jpeg');
      
      // Add to images
      setResponses(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          images: [...(prev[itemId]?.images || []), imageUrl],
          timestamp: new Date().toISOString()
        }
      }));
      
      // Stop camera
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      
      showToast('Unable to access camera. Please check permissions.', 'error');
    }
  };

  const calculateProgress = () => {
    const totalItems = template.sections.reduce((acc, section) => acc + section.items.length, 0);
    const answeredItems = Object.keys(responses).length;
    return (answeredItems / totalItems) * 100;
  };

  // Helper functions for intelligent analysis display
  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'requires_attention':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'non_compliant':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'high': return 'text-orange-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <BackButton />
          
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                {template.title}
              </h2>
              <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
            <p className="text-sm text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleTimeView}
              className={`p-3 rounded-xl transition-all duration-300 ${
                showHistory 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                  : 'bg-slate-700/50 text-gray-400 hover:text-white hover:bg-slate-600/50'
              }`}
              title="View History"
            >
              <Clock className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg"
              title="Save Checklist"
            >
              <Save className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handlePrint}
              className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white hover:from-indigo-600 hover:to-blue-600 transition-all duration-300 shadow-lg"
              title="Print Checklist"
            >
              <Printer className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className={`p-3 rounded-xl transition-all duration-300 shadow-lg ${
                shareSuccess === true ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                shareSuccess === false ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
              } text-white`}
              title="Share Checklist"
            >
              <Share2 className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-slate-700/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${calculateProgress()}%` }}
            className="absolute h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
            transition={{ duration: 0.8 }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
        </div>

        {/* History Section */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl bg-slate-800/60 backdrop-blur-sm border border-blue-500/20 p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Response History</h3>
              <div className="space-y-3">
                {responseHistory.length > 0 ? (
                  responseHistory.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700/70 transition-colors"
                    >
                      <span className="text-gray-300">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => loadHistoricalData(entry)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
                      >
                        Load
                      </motion.button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    No saved history found
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400 text-sm flex items-center space-x-2"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}

        {/* AI Analysis Results */}
        {aiResponse && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-6 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 backdrop-blur-sm border border-emerald-500/20"
          >
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-6 h-6 text-emerald-400" />
              <h3 className="text-lg font-semibold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                AI Safety Analysis
              </h3>
            </div>
            <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap leading-relaxed">
              {aiResponse}
            </div>
          </motion.div>
        )}

        {/* Checklist Sections */}
        {template.sections.map((section, sectionIndex) => (
          <motion.div
            key={sectionIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
            className="rounded-xl bg-slate-800/60 backdrop-blur-sm border border-blue-500/20"
          >
            <button
              onClick={() => setExpandedSections(prev => ({ ...prev, [sectionIndex]: !prev[sectionIndex] }))}
              className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-700/30 transition-colors rounded-t-xl"
            >
              <h3 className="text-lg font-semibold text-white">{section.title}</h3>
              <motion.div
                animate={{ rotate: expandedSections[sectionIndex] ? 180 : 0 }}
                className="text-gray-400"
                transition={{ duration: 0.3 }}
              >
                ▼
              </motion.div>
            </button>

            <AnimatePresence>
              {expandedSections[sectionIndex] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-6 border-t border-blue-500/20 space-y-6"
                >
                  {section.items.map((item) => (
                    <motion.div
                      key={item.id}
                      layoutId={item.id}
                      onClick={() => setActiveItem(activeItem === item.id ? null : item.id)}
                      className={`p-6 rounded-xl cursor-pointer transition-all duration-300 ${
                        activeItem === item.id
                          ? 'bg-slate-700/60 border-blue-400/60 shadow-lg'
                          : 'bg-slate-700/30 border-transparent hover:bg-slate-700/40'
                      } border`}
                    >
                      <div className="flex items-start space-x-4">
                        {item.critical && (
                          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-white font-medium leading-relaxed">{item.question}</p>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFlag(item.id);
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                responses[item.id]?.flagged
                                  ? 'text-red-400 bg-red-400/20'
                                  : 'text-gray-400 hover:text-gray-300 hover:bg-slate-600/50'
                              }`}
                            >
                              <Flag className="w-5 h-5" />
                            </motion.button>
                          </div>

                          {/* Enhanced Input System */}
                          <div className="mb-4">
                            {item.inputType === 'select' && item.options.length > 0 ? (
                              // Dropdown select for multiple choice questions
                              <select
                                value={responses[item.id]?.value || ''}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleResponse(item.id, e.target.value);
                                }}
                                className="w-full p-4 rounded-xl bg-slate-700/50 border border-blue-500/20 text-white focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all"
                                required={item.required}
                              >
                                <option value="">Select an option...</option>
                                {item.options.map((option, optionIndex) => (
                                  <option key={optionIndex} value={option} className="bg-slate-800 text-white">
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : item.inputType === 'textarea' ? (
                              // Text area for detailed responses
                              <textarea
                                value={responses[item.id]?.value || ''}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleResponse(item.id, e.target.value);
                                }}
                                placeholder={item.placeholder || 'Enter detailed response...'}
                                className="w-full h-32 p-4 rounded-xl bg-slate-700/50 border border-blue-500/20 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all resize-none"
                                required={item.required}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : item.inputType === 'number' ? (
                              // Number input for measurements, quantities
                              <input
                                type="number"
                                value={responses[item.id]?.value || ''}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleResponse(item.id, e.target.value);
                                }}
                                placeholder={item.placeholder || 'Enter number...'}
                                className="w-full p-4 rounded-xl bg-slate-700/50 border border-blue-500/20 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all"
                                required={item.required}
                                onClick={(e) => e.stopPropagation()}
                                step="0.1"
                              />
                            ) : (
                              // Default text input
                              <input
                                type={item.inputType || 'text'}
                                value={responses[item.id]?.value || ''}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleResponse(item.id, e.target.value);
                                }}
                                placeholder={item.placeholder || 'Enter response...'}
                                className="w-full p-4 rounded-xl bg-slate-700/50 border border-blue-500/20 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all"
                                required={item.required}
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}
                            {item.required && !responses[item.id]?.value && (
                              <p className="text-red-400 text-sm mt-2 flex items-center">
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                This field is required
                              </p>
                            )}
                          </div>

                          <AnimatePresence>
                            {activeItem === item.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-4 pt-4 border-t border-blue-500/20"
                              >
                                {item.notes && (
                                  <div className="flex items-start space-x-3">
                                    <MessageSquare className="w-5 h-5 text-gray-400 mt-3" />
                                    <textarea
                                      value={responses[item.id]?.notes || ''}
                                      onChange={(e) => handleNotes(item.id, e.target.value)}
                                      placeholder="Add detailed notes here..."
                                      className="flex-1 h-32 p-4 rounded-xl bg-slate-700/50 border border-blue-500/20 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all resize-none"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                )}

                                {/* Enhanced File and Image Upload System */}
                                {(item.images || item.files) && (
                                  <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                      <Upload className="w-5 h-5 text-gray-400" />
                                      <span className="text-gray-400 font-medium">
                                        {item.files ? 'Files & Blueprints' : 'Images'}
                                      </span>
                                    </div>
                                    
                                    {/* Display uploaded files/images */}
                                    {responses[item.id]?.images && responses[item.id]?.images && responses[item.id]!.images!.length > 0 && (
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {responses[item.id]!.images!.map((image, index) => (
                                          <div key={index} className="relative group">
                                            <img
                                              src={image}
                                              alt={`Attachment ${index + 1}`}
                                              className="w-full h-20 object-cover rounded-lg border border-blue-500/20"
                                            />
                                            <motion.button
                                              whileTap={{ scale: 0.9 }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const newImages = responses[item.id]?.images?.filter((_, i) => i !== index) || [];
                                                setResponses(prev => ({
                                                  ...prev,
                                                  [item.id]: {
                                                    ...prev[item.id],
                                                    images: newImages
                                                  }
                                                }));
                                              }}
                                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                              <X className="w-4 h-4 text-white" />
                                            </motion.button>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Display uploaded blueprints */}
                                    {responses[item.id]?.blueprints && responses[item.id]!.blueprints!.length > 0 && (
                                      <div className="space-y-2 mb-4">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <Building className="w-5 h-5 text-blue-400" />
                                          <span className="text-blue-400 font-medium">Uploaded Blueprints</span>
                                        </div>
                                        {responses[item.id]?.blueprints?.map((blueprint, index) => (
                                          <div key={blueprint.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 border border-blue-500/20">
                                            <div className="flex items-center space-x-3">
                                              <FileImage className="w-5 h-5 text-blue-400" />
                                              <div>
                                                <p className="text-white text-sm font-medium">{blueprint.fileName}</p>
                                                <p className="text-gray-400 text-xs">
                                                  {(blueprint.fileSize / 1024 / 1024).toFixed(2)} MB
                                                  {blueprint.analysisStatus === 'completed' && (
                                                    <span className="ml-2 text-green-400">✓ AI Analyzed</span>
                                                  )}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                              <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  window.open(blueprint.fileUrl, '_blank');
                                                }}
                                                className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
                                                title="View Blueprint"
                                              >
                                                <Eye className="w-4 h-4" />
                                              </motion.button>
                                              <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                onClick={async (e) => {
                                                  e.stopPropagation();
                                                  await blueprintStorage.deleteBlueprint(blueprint.id, blueprint.fileName);
                                                  const newBlueprints = responses[item.id]?.blueprints?.filter(b => b.id !== blueprint.id) || [];
                                                  setResponses(prev => ({
                                                    ...prev,
                                                    [item.id]: {
                                                      ...prev[item.id],
                                                      blueprints: newBlueprints
                                                    }
                                                  }));
                                                }}
                                                className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                                                title="Delete Blueprint"
                                              >
                                                <X className="w-4 h-4" />
                                              </motion.button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Upload controls */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                      {/* Blueprint upload */}
                                      {item.files && (
                                        <>
                                          <input
                                            type="file"
                                            accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png,.svg"
                                            multiple
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              if (e.target.files) handleBlueprintUpload(item.id, e.target.files);
                                            }}
                                            className="hidden"
                                            id={`blueprint-${item.id}`}
                                          />
                                          <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              document.getElementById(`blueprint-${item.id}`)?.click();
                                            }}
                                            disabled={uploadingBlueprints[item.id]}
                                            className="h-12 flex items-center justify-center space-x-2 border-2 border-dashed border-cyan-500/30 rounded-lg hover:border-cyan-400/60 hover:bg-cyan-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            {uploadingBlueprints[item.id] ? (
                                              <Loader className="w-5 h-5 text-cyan-400 animate-spin" />
                                            ) : (
                                              <Building className="w-5 h-5 text-cyan-400" />
                                            )}
                                            <span className="text-cyan-400 text-sm font-medium">
                                              {uploadingBlueprints[item.id] ? 'Uploading...' : 'Blueprints'}
                                            </span>
                                          </motion.button>
                                        </>
                                      )}
                                      
                                      {/* Image upload */}
                                      {item.images && (
                                        <>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              if (e.target.files) handleImageUpload(item.id, e.target.files);
                                            }}
                                            className="hidden"
                                            id={`image-${item.id}`}
                                          />
                                          <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              document.getElementById(`image-${item.id}`)?.click();
                                            }}
                                            className="h-12 flex items-center justify-center space-x-2 border-2 border-dashed border-blue-500/30 rounded-lg hover:border-blue-400/60 hover:bg-blue-500/10 transition-all"
                                          >
                                            <Upload className="w-5 h-5 text-blue-400" />
                                            <span className="text-blue-400 text-sm font-medium">Upload Images</span>
                                          </motion.button>
                                          
                                          {/* Camera capture */}
                                          <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleCaptureImage(item.id);
                                            }}
                                            className="h-12 flex items-center justify-center space-x-2 border-2 border-dashed border-purple-500/30 rounded-lg hover:border-purple-400/60 hover:bg-purple-500/10 transition-all"
                                          >
                                            <Camera className="w-5 h-5 text-purple-400" />
                                            <span className="text-purple-400 text-sm font-medium">Take Photo</span>
                                          </motion.button>
                                        </>
                                      )}
                                    </div>
                                    
                                    {item.files && (
                                      <p className="text-gray-400 text-xs">
                                        Supported: PDF, DWG, Images, Documents (Max 10MB each)
                                      </p>
                                    )}
                                  </div>
                                )}

                                {item.deadline && (
                                  <div className="flex items-center space-x-3">
                                    <Clock className="w-5 h-5 text-gray-400" />
                                    <input
                                      type="datetime-local"
                                      value={responses[item.id]?.deadline || ''}
                                      onChange={(e) => handleDeadline(item.id, e.target.value)}
                                      className="bg-slate-700/50 border border-blue-500/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {/* Analysis Mode Toggle */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 bg-slate-800/60 rounded-xl border border-blue-500/20 mb-6"
        >
          <div className="flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span className="text-white font-medium">Analysis Mode:</span>
          </div>
          <button
            type="button"
            onClick={() => setAnalysisMode(analysisMode === 'standard' ? 'intelligent' : 'standard')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              analysisMode === 'intelligent'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
            }`}
          >
            {analysisMode === 'intelligent' ? (
              <>
                <Sparkles className="w-4 h-4 inline mr-2" />
                Intelligent Analysis (OSHA Data)
              </>
            ) : (
              'Standard Analysis'
            )}
          </button>
        </motion.div>

        {/* Submit Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={isProcessing}
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium flex items-center justify-center space-x-3 hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {isProcessing ? (
            <>
              <Loader className="w-6 h-6 animate-spin" />
              <span>Processing Analysis...</span>
            </>
          ) : (
            <>
              <Send className="w-6 h-6" />
              <span>
                {analysisMode === 'intelligent' ? 'Smart AI Analysis with OSHA Data' : 'Submit for AI Analysis'}
              </span>
              <Sparkles className="w-5 h-5 animate-pulse" />
            </>
          )}
        </motion.button>

        {/* OSHA Risk Profile Display */}
        {riskProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 shadow-2xl"
          >
            <div className="flex items-center mb-4">
              <FileText className="w-6 h-6 text-cyan-400 mr-3" />
              <h3 className="text-xl font-bold text-white">OSHA Industry Risk Profile</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                <div className="text-sm text-gray-300 mb-1">Industry</div>
                <div className="text-lg font-semibold text-white">{riskProfile.industry}</div>
              </div>
              <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20">
                <div className="text-sm text-gray-300 mb-1">Injury Rate</div>
                <div className="text-lg font-semibold text-orange-300">{riskProfile.injury_rate}/100 workers</div>
              </div>
              <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                <div className="text-sm text-gray-300 mb-1">2023 Fatalities</div>
                <div className="text-lg font-semibold text-red-300">{riskProfile.fatalities_2023}</div>
              </div>
              <div className={`${
                riskProfile.risk_category === 'CRITICAL' ? 'bg-red-500/10 border-red-500/20' :
                riskProfile.risk_category === 'HIGH' ? 'bg-orange-500/10 border-orange-500/20' :
                'bg-yellow-500/10 border-yellow-500/20'
              } rounded-xl p-4 border`}>
                <div className="text-sm text-gray-300 mb-1">Risk Category</div>
                <div className={`text-lg font-semibold ${
                  riskProfile.risk_category === 'CRITICAL' ? 'text-red-300' :
                  riskProfile.risk_category === 'HIGH' ? 'text-orange-300' :
                  'text-yellow-300'
                }`}>
                  {riskProfile.risk_category}
                </div>
              </div>
            </div>

            {riskProfile.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold text-cyan-400 mb-3">Industry-Specific Recommendations:</h4>
                <ul className="space-y-2">
                  {riskProfile.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-300 text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        {/* Intelligent Analysis Results */}
        {safetyAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Sparkles className="w-6 h-6 text-cyan-400 mr-3 animate-pulse" />
                <h3 className="text-xl font-bold text-white">Professional Safety Report</h3>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={shareReport}
                  className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors duration-200 flex items-center space-x-2 text-sm"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
                <button
                  onClick={emailReport}
                  className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors duration-200 flex items-center space-x-2 text-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Email</span>
                </button>
                <button
                  onClick={saveReportToDatabase}
                  className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors duration-200 flex items-center space-x-2 text-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex items-center space-x-3 p-4 bg-slate-700/50 rounded-xl">
                {getComplianceIcon(safetyAnalysis.compliance_status)}
                <div>
                  <div className="text-sm text-gray-300">Compliance Status</div>
                  <div className="font-semibold text-white">
                    {safetyAnalysis.compliance_status.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-slate-700/50 rounded-xl">
                <AlertTriangle className={`w-5 h-5 ${getRiskColor(safetyAnalysis.risk_level)}`} />
                <div>
                  <div className="text-sm text-gray-300">Risk Level</div>
                  <div className={`font-semibold ${getRiskColor(safetyAnalysis.risk_level)}`}>
                    {safetyAnalysis.risk_level.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            {safetyAnalysis.specific_violations.length > 0 && (
              <div className="mb-6 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                <h4 className="font-semibold text-red-300 mb-3 flex items-center">
                  <XCircle className="w-5 h-5 mr-2" />
                  OSHA Violations Identified:
                </h4>
                <ul className="space-y-2">
                  {safetyAnalysis.specific_violations.map((violation, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-red-200 text-sm">{violation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {safetyAnalysis.immediate_hazards.length > 0 && (
              <div className="mb-6 p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
                <h4 className="font-semibold text-orange-300 mb-3 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Immediate Hazards:
                </h4>
                <ul className="space-y-2">
                  {safetyAnalysis.immediate_hazards.map((hazard, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-orange-200 text-sm">{hazard}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-6">
              <h4 className="font-semibold text-blue-300 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Required Corrective Actions:
              </h4>
              <div className="space-y-3">
                {safetyAnalysis.corrective_actions.map((action, idx) => (
                  <div key={idx} className="p-4 bg-slate-700/50 rounded-xl border-l-4 border-blue-400">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-white text-sm">{action.action}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        action.priority === 'immediate' ? 'bg-red-500/20 text-red-300' :
                        action.priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
                        'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {action.priority.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      <span className="font-medium">{action.osha_standard}</span> • {action.implementation_timeframe}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {safetyAnalysis.additional_recommendations.length > 0 && (
                <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                  <h4 className="font-semibold text-green-300 mb-3">Additional Recommendations:</h4>
                  <ul className="space-y-2">
                    {safetyAnalysis.additional_recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-green-200 text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {safetyAnalysis.insurance_risk_factors.length > 0 && (
                <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                  <h4 className="font-semibold text-purple-300 mb-3">Insurance Risk Factors:</h4>
                  <ul className="space-y-2">
                    {safetyAnalysis.insurance_risk_factors.map((factor, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-purple-200 text-sm">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Standard AI Response */}
        {aiResponse && !safetyAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FileText className="w-6 h-6 text-cyan-400 mr-3" />
                <h3 className="text-xl font-bold text-white">Professional Safety Report</h3>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={shareReport}
                  className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors duration-200 flex items-center space-x-2 text-sm"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
                <button
                  onClick={emailReport}
                  className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors duration-200 flex items-center space-x-2 text-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Email</span>
                </button>
                <button
                  onClick={saveReportToDatabase}
                  className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors duration-200 flex items-center space-x-2 text-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
              </div>
            </div>
            <div className="prose prose-invert max-w-none">
              <div className="text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">{aiResponse}</div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ChecklistForm;