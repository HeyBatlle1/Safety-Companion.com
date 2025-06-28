import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Upload, X, Camera, MapPin, Loader, Check, ArrowLeft, Clock, Save, Printer, Share2, Flag, MessageSquare, Plus, Send, Sparkles } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { checklistData } from './checklistData';
import BackButton from '../navigation/BackButton';
import { getCurrentUser } from '../../services/supabase';
import { getMSDSResponse } from '../../services/msdsChat';
import { saveChecklistResponse } from '../../services/checklistService';
import { showToast } from '../common/ToastContainer';

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
      console.error('Error uploading images:', error);
      showToast('Failed to upload images. Please try again.', 'error');
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

    // Check if user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      setError('Please sign in to submit the checklist');
      setIsProcessing(false);
      showToast('Authentication required', 'error');
      return;
    }

    // Additional check for user ID
    if (!user.id) {
      setError('Invalid user session');
      setIsProcessing(false);
      showToast('Invalid session', 'error');
      return;
    }
    
    try {
      // Format checklist data for AI processing
      const checklistData = {
        template: template.title,
        sections: template.sections.map(section => ({
          title: section.title,
          responses: section.items.map(item => ({
            question: item.question,
            response: responses[item.id]?.value || 'No response',
            notes: responses[item.id]?.notes,
            critical: item.critical || false,
            flagged: responses[item.id]?.flagged || false
          }))
        }))
      };

      // Enhanced prompt for better analysis
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

      // Save to database
      await saveChecklistResponse(
        templateId || 'unknown',
        template.title,
        responses
      );

      showToast('Checklist submitted and analyzed successfully!', 'success');
    } catch (error) {
      console.error('Error processing checklist:', error);
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
      console.error('Error sharing checklist:', error);
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
      console.error('Clipboard fallback failed:', clipboardError);
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
      console.error('Error capturing image:', error);
      showToast('Unable to access camera. Please check permissions.', 'error');
    }
  };

  const calculateProgress = () => {
    const totalItems = template.sections.reduce((acc, section) => acc + section.items.length, 0);
    const answeredItems = Object.keys(responses).length;
    return (answeredItems / totalItems) * 100;
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

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            {item.options.map((option, optionIndex) => (
                              <motion.button
                                key={optionIndex}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResponse(item.id, option);
                                }}
                                className={`p-4 rounded-xl border transition-all duration-300 ${
                                  responses[item.id]?.value === option
                                    ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-400 shadow-lg'
                                    : 'border-blue-500/20 hover:border-blue-400/60 hover:bg-slate-600/30'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                    responses[item.id]?.value === option
                                      ? 'border-blue-400 bg-blue-400'
                                      : 'border-gray-400'
                                  }`}>
                                    {responses[item.id]?.value === option && (
                                      <Check className="w-3 h-3 text-white" />
                                    )}
                                  </div>
                                  <span className="text-white font-medium">{option}</span>
                                </div>
                              </motion.button>
                            ))}
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

                                {item.images && (
                                  <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                      <Camera className="w-5 h-5 text-gray-400" />
                                      <span className="text-gray-400 font-medium">Attachments</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-3">
                                      {responses[item.id]?.images?.map((image, index) => (
                                        <div key={index} className="relative group">
                                          <img
                                            src={image}
                                            alt={`Attachment ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-lg"
                                          />
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all rounded-lg">
                                            <motion.button
                                              whileTap={{ scale: 0.9 }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setResponses(prev => ({
                                                  ...prev,
                                                  [item.id]: {
                                                    ...prev[item.id],
                                                    images: prev[item.id]?.images?.filter((_, i) => i !== index) || []
                                                  }
                                                }))
                                              }}
                                              className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                                            >
                                              <X className="w-4 h-4" />
                                            </motion.button>
                                          </div>
                                        </div>
                                      ))}
                                      <div className="flex flex-col gap-2">
                                        <label
                                          className="w-full h-12 flex items-center justify-center border-2 border-dashed border-blue-500/30 rounded-lg cursor-pointer hover:border-blue-400/60 hover:bg-blue-500/10 transition-all"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => e.target.files && handleImageUpload(item.id, e.target.files)}
                                          />
                                          <Plus className="w-5 h-5 text-blue-400" />
                                        </label>
                                        <motion.button
                                          whileTap={{ scale: 0.95 }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCaptureImage(item.id);
                                          }}
                                          className="h-12 flex items-center justify-center border-2 border-dashed border-blue-500/30 rounded-lg hover:border-blue-400/60 hover:bg-blue-500/10 transition-all"
                                        >
                                          <Camera className="w-5 h-5 text-blue-400" />
                                        </motion.button>
                                      </div>
                                    </div>
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
              <span>Submit for AI Analysis</span>
              <Sparkles className="w-5 h-5 animate-pulse" />
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default ChecklistForm;