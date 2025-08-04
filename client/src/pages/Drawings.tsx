import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Search, Filter, Grid, List, Download, Share2, Eye, Edit3, MessageSquare, Layers, Ruler, Pen, Square, Circle, Type, Trash2, RotateCcw, ZoomIn, ZoomOut, Move, Save, Settings, Users, Clock, CheckCircle, AlertCircle, FolderSync as Sync, ExternalLink, FolderPlus, Archive, X, Plus } from 'lucide-react';
import { Drawing, DrawingVersion, DrawingAnnotation } from '../types/drawings';
import { 
  getAllDrawings, 
  getDrawingVersions, 
  getDrawingAnnotations, 
  uploadDrawing,
  addAnnotation,
  trackDrawingActivity,
  syncWithProCore,
  exportDrawingWithAnnotations
} from '../services/drawingsService';
import { showToast } from '../components/common/ToastContainer';
import BackButton from '../components/navigation/BackButton';

const Drawings: React.FC = () => {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null);
  const [versions, setVersions] = useState<DrawingVersion[]>([]);
  const [annotations, setAnnotations] = useState<DrawingAnnotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [activeAnnotationTool, setActiveAnnotationTool] = useState<string | null>(null);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDrawings();
  }, []);

  useEffect(() => {
    if (selectedDrawing) {
      loadDrawingData(selectedDrawing.id);
    }
  }, [selectedDrawing]);

  const loadDrawings = async () => {
    try {
      setLoading(true);
      const drawingsData = await getAllDrawings();
      setDrawings(drawingsData);
    } catch (error) {
      
      showToast('Failed to load drawings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDrawingData = async (drawingId: string) => {
    try {
      const [versionsData, annotationsData] = await Promise.all([
        getDrawingVersions(drawingId),
        getDrawingAnnotations(drawingId)
      ]);
      setVersions(versionsData);
      setAnnotations(annotationsData);
    } catch (error) {
      
      showToast('Failed to load drawing data', 'error');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      showToast('Please upload a PDF file', 'error');
      return;
    }

    try {
      const metadata = {
        title: file.name.replace('.pdf', ''),
        file_name: file.name,
        file_type: file.type,
        discipline: 'other' as const,
        current_version: 1,
        status: 'draft' as const
      };

      await uploadDrawing(file, metadata);
      showToast('Drawing uploaded successfully', 'success');
      setShowUploadModal(false);
      loadDrawings();
    } catch (error) {
      
      showToast('Failed to upload drawing', 'error');
    }
  };

  const handleDrawingClick = (drawing: Drawing) => {
    setSelectedDrawing(drawing);
    setShowViewer(true);
    trackDrawingActivity(drawing.id, 'viewed');
  };

  const handleAnnotationAdd = async (x: number, y: number) => {
    if (!selectedDrawing || !activeAnnotationTool) return;

    try {
      const annotation = {
        drawing_id: selectedDrawing.id,
        annotation_type: activeAnnotationTool as DrawingAnnotation['annotation_type'],
        content: 'New annotation',
        position_x: x,
        position_y: y,
        color: '#3B82F6',
        is_resolved: false
      };

      await addAnnotation(annotation);
      loadDrawingData(selectedDrawing.id);
      showToast('Annotation added', 'success');
    } catch (error) {
      
      showToast('Failed to add annotation', 'error');
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoomLevel(prev => {
      const newZoom = direction === 'in' ? prev + 25 : prev - 25;
      return Math.max(25, Math.min(400, newZoom));
    });
  };

  const handlePanStart = (e: React.MouseEvent) => {
    setIsPanning(true);
    setLastPanPoint({ x: e.clientX, y: e.clientY });
  };

  const handlePanMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    
    const deltaX = e.clientX - lastPanPoint.x;
    const deltaY = e.clientY - lastPanPoint.y;
    
    setPanPosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    setLastPanPoint({ x: e.clientX, y: e.clientY });
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  const handleExport = async () => {
    if (!selectedDrawing) return;
    
    try {
      await exportDrawingWithAnnotations(selectedDrawing.id);
      showToast('Drawing exported successfully', 'success');
    } catch (error) {
      
      showToast('Failed to export drawing', 'error');
    }
  };

  const handleProCoreSync = async () => {
    if (!selectedDrawing) return;
    
    try {
      const success = await syncWithProCore(selectedDrawing.id);
      if (success) {
        showToast('Synced with ProCore successfully', 'success');
      } else {
        showToast('ProCore sync failed', 'error');
      }
    } catch (error) {
      
      showToast('ProCore sync error', 'error');
    }
  };

  const filteredDrawings = drawings.filter(drawing => {
    const matchesSearch = drawing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         drawing.drawing_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiscipline = selectedDiscipline === 'all' || drawing.discipline === selectedDiscipline;
    const matchesStatus = selectedStatus === 'all' || drawing.status === selectedStatus;
    
    return matchesSearch && matchesDiscipline && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'review': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'draft': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'superseded': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'archived': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getDisciplineIcon = (discipline: string) => {
    switch (discipline) {
      case 'architectural': return '🏗️';
      case 'structural': return '🏢';
      case 'mechanical': return '⚙️';
      case 'electrical': return '⚡';
      case 'plumbing': return '🚰';
      case 'civil': return '🛣️';
      default: return '📋';
    }
  };

  const getDisciplineColor = (discipline: string) => {
    switch (discipline) {
      case 'architectural': return 'from-purple-500 to-pink-500';
      case 'structural': return 'from-blue-500 to-cyan-500';
      case 'mechanical': return 'from-orange-500 to-red-500';
      case 'electrical': return 'from-yellow-500 to-orange-500';
      case 'plumbing': return 'from-cyan-500 to-blue-500';
      case 'civil': return 'from-green-500 to-emerald-500';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <BackButton />
          <div className="text-center flex-1">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="inline-flex items-center space-x-3 mb-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-xl blur-lg opacity-30" />
                <div className="relative w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  Drawings ProCore
                </h1>
                <p className="text-sm text-gray-400 mt-1">Professional Blueprint Management</p>
              </div>
            </motion.div>
          </div>
          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 flex items-center space-x-2 shadow-lg shadow-blue-500/25 transition-all duration-200"
            >
              <Upload className="w-5 h-5" />
              <span className="font-medium">Upload</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleProCoreSync}
              disabled
              className="px-6 py-3 bg-slate-700/50 text-slate-400 rounded-xl cursor-not-allowed flex items-center space-x-2 border border-slate-600/50"
              title="ProCore integration coming soon"
            >
              <Sync className="w-5 h-5" />
              <span className="font-medium">Sync ProCore</span>
            </motion.button>
          </div>
        </div>

        {/* Enhanced Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 shadow-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Search drawings, numbers, descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 w-80 bg-slate-700/50 border border-blue-500/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
              
              <select
                value={selectedDiscipline}
                onChange={(e) => setSelectedDiscipline(e.target.value)}
                className="px-4 py-3 bg-slate-700/50 border border-blue-500/20 rounded-xl text-white focus:outline-none focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                <option value="all">All Disciplines</option>
                <option value="architectural">🏗️ Architectural</option>
                <option value="structural">🏢 Structural</option>
                <option value="mechanical">⚙️ Mechanical</option>
                <option value="electrical">⚡ Electrical</option>
                <option value="plumbing">🚰 Plumbing</option>
                <option value="civil">🛣️ Civil</option>
                <option value="other">📋 Other</option>
              </select>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-3 bg-slate-700/50 border border-blue-500/20 rounded-xl text-white focus:outline-none focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                <option value="all">All Status</option>
                <option value="draft">📝 Draft</option>
                <option value="review">👀 Under Review</option>
                <option value="approved">✅ Approved</option>
                <option value="superseded">🔄 Superseded</option>
                <option value="archived">📦 Archived</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-xl transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                    : 'bg-slate-700/50 text-gray-400 hover:text-white hover:bg-slate-600/50'
                }`}
              >
                <Grid className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-xl transition-all ${
                  viewMode === 'list' 
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                    : 'bg-slate-700/50 text-gray-400 hover:text-white hover:bg-slate-600/50'
                }`}
              >
                <List className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: FileText, label: 'Total Drawings', value: drawings.length, color: 'from-blue-500 to-cyan-500' },
            { icon: CheckCircle, label: 'Approved', value: drawings.filter(d => d.status === 'approved').length, color: 'from-emerald-500 to-green-500' },
            { icon: AlertCircle, label: 'Under Review', value: drawings.filter(d => d.status === 'review').length, color: 'from-amber-500 to-orange-500' },
            { icon: Edit3, label: 'Draft', value: drawings.filter(d => d.status === 'draft').length, color: 'from-purple-500 to-pink-500' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="relative group"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity`} />
              <div className="relative bg-slate-800/50 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 hover:border-blue-500/40 transition-all">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Enhanced Drawings Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-500/20 rounded-full" />
              <div className="absolute inset-0 w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}
          >
            {filteredDrawings.map((drawing, index) => (
              <motion.div
                key={drawing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className={`group relative cursor-pointer ${
                  viewMode === 'list' ? 'flex items-center space-x-6' : ''
                }`}
                onClick={() => handleDrawingClick(drawing)}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${getDisciplineColor(drawing.discipline)} rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity`} />
                <div className="relative bg-slate-800/50 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 hover:border-blue-500/40 transition-all shadow-xl">
                  <div className={`${viewMode === 'list' ? 'flex-shrink-0' : 'mb-4'}`}>
                    <div className={`w-16 h-16 bg-gradient-to-r ${getDisciplineColor(drawing.discipline)} rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
                      {getDisciplineIcon(drawing.discipline)}
                    </div>
                  </div>
                  
                  <div className={viewMode === 'list' ? 'flex-1' : ''}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                          {drawing.title}
                        </h3>
                        <p className="text-sm text-blue-400 font-medium mt-1">{drawing.drawing_number}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(drawing.status)}`}>
                        {drawing.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">{drawing.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <span className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full" />
                          <span>Rev {drawing.current_version}</span>
                        </span>
                        <span>{new Date(drawing.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 rounded-lg bg-slate-700/50 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle quick action
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 rounded-lg bg-slate-700/50 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle download
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {filteredDrawings.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-2xl opacity-20" />
              <div className="relative w-24 h-24 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-12 h-12 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">No drawings found</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Upload your first drawing to get started with professional blueprint management
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUploadModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-cyan-600 transition-all"
            >
              <Upload className="w-5 h-5 mr-2 inline" />
              Upload Your First Drawing
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      {/* Enhanced Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-8 w-full max-w-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Upload Drawing</h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-gray-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
              
              <div className="border-2 border-dashed border-blue-500/30 rounded-2xl p-12 text-center hover:border-blue-500/50 transition-colors group">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                  <div className="relative w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                </div>
                <p className="text-white font-medium mb-2">Drag and drop your PDF file here</p>
                <p className="text-gray-400 text-sm mb-6">or click to browse your files</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-cyan-600 transition-all"
                >
                  Choose File
                </motion.button>
              </div>
              
              <div className="flex justify-end space-x-3 mt-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUploadModal(false)}
                  className="px-6 py-3 bg-slate-700/50 text-gray-300 rounded-xl hover:bg-slate-600/50 hover:text-white transition-all"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Drawing Viewer */}
      <AnimatePresence>
        {showViewer && selectedDrawing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900 z-50 flex flex-col"
          >
            {/* Enhanced Viewer Header */}
            <div className="bg-slate-800/95 backdrop-blur-xl border-b border-blue-500/20 p-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowViewer(false)}
                    className="p-3 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                  <div className={`w-12 h-12 bg-gradient-to-r ${getDisciplineColor(selectedDrawing.discipline)} rounded-xl flex items-center justify-center text-xl`}>
                    {getDisciplineIcon(selectedDrawing.discipline)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedDrawing.title}</h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>{selectedDrawing.drawing_number}</span>
                      <span>•</span>
                      <span>Rev {selectedDrawing.current_version}</span>
                      <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(selectedDrawing.status)}`}>
                        {selectedDrawing.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {[
                    { icon: Clock, action: () => setShowVersionHistory(!showVersionHistory), title: "Version History", active: showVersionHistory },
                    { icon: Users, action: () => setShowCollaboration(!showCollaboration), title: "Collaboration", active: showCollaboration },
                    { icon: Download, action: handleExport, title: "Export" },
                    { icon: Share2, action: () => {}, title: "Share" }
                  ].map((btn, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={btn.action}
                      className={`p-3 rounded-xl transition-all ${
                        btn.active 
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                          : 'bg-slate-700/50 hover:bg-slate-600/50 text-gray-300 hover:text-white'
                      }`}
                      title={btn.title}
                    >
                      <btn.icon className="w-5 h-5" />
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Enhanced Annotation Toolbar */}
              <div className="w-20 bg-slate-800/95 backdrop-blur-xl border-r border-blue-500/20 p-3 space-y-3">
                {[
                  { icon: MessageSquare, tool: 'comment', title: 'Comment' },
                  { icon: Pen, tool: 'markup', title: 'Markup' },
                  { icon: Ruler, tool: 'measurement', title: 'Measurement' },
                  { icon: Square, tool: 'shape', title: 'Shapes' }
                ].map((tool) => (
                  <motion.button
                    key={tool.tool}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveAnnotationTool(activeAnnotationTool === tool.tool ? null : tool.tool)}
                    className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                      activeAnnotationTool === tool.tool 
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                        : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50 hover:text-white'
                    }`}
                    title={tool.title}
                  >
                    <tool.icon className="w-6 h-6" />
                  </motion.button>
                ))}
                
                <div className="border-t border-slate-700 pt-3 space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleZoom('in')}
                    className="w-14 h-14 rounded-xl flex items-center justify-center bg-slate-700/50 text-gray-300 hover:bg-slate-600/50 hover:text-white transition-all"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-6 h-6" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleZoom('out')}
                    className="w-14 h-14 rounded-xl flex items-center justify-center bg-slate-700/50 text-gray-300 hover:bg-slate-600/50 hover:text-white transition-all"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-6 h-6" />
                  </motion.button>
                </div>
              </div>

              {/* Enhanced Drawing Viewer Area */}
              <div 
                ref={viewerRef}
                className="flex-1 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden cursor-move"
                onMouseDown={handlePanStart}
                onMouseMove={handlePanMove}
                onMouseUp={handlePanEnd}
                onMouseLeave={handlePanEnd}
                onClick={(e) => {
                  if (activeAnnotationTool) {
                    const rect = viewerRef.current?.getBoundingClientRect();
                    if (rect) {
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      handleAnnotationAdd(x, y);
                    }
                  }
                }}
              >
                {/* Enhanced Mock PDF Viewer */}
                <div 
                  className="bg-white shadow-2xl mx-auto my-8 relative border border-slate-300 rounded-lg overflow-hidden"
                  style={{
                    width: `${8.5 * (zoomLevel / 100) * 96}px`,
                    height: `${11 * (zoomLevel / 100) * 96}px`,
                    transform: `translate(${panPosition.x}px, ${panPosition.y}px)`
                  }}
                >
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-gradient-to-br from-white to-slate-50">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-12 h-12 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-700 mb-2">PDF Viewer</h3>
                      <p className="text-slate-500 font-medium">{selectedDrawing.file_name}</p>
                      <p className="text-sm text-slate-400 mt-2">Professional CAD Drawing Viewer</p>
                    </div>
                  </div>
                  
                  {/* Enhanced Annotations */}
                  {annotations.map((annotation) => (
                    <motion.div
                      key={annotation.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute"
                      style={{
                        left: annotation.position_x * (zoomLevel / 100),
                        top: annotation.position_y * (zoomLevel / 100),
                        color: annotation.color
                      }}
                    >
                      {annotation.annotation_type === 'comment' && (
                        <div className="bg-blue-500 text-white rounded-xl p-3 text-sm max-w-64 shadow-lg border border-blue-400">
                          <div className="flex items-center space-x-2 mb-1">
                            <MessageSquare className="w-4 h-4" />
                            <span className="font-medium">Comment</span>
                          </div>
                          {annotation.content}
                        </div>
                      )}
                      {annotation.annotation_type === 'markup' && (
                        <div 
                          className="border-2 rounded-lg bg-blue-500/10"
                          style={{
                            borderColor: annotation.color,
                            width: annotation.width,
                            height: annotation.height
                          }}
                        />
                      )}
                    </motion.div>
                  ))}
                </div>
                
                {/* Enhanced Zoom Level Indicator */}
                <div className="absolute bottom-6 left-6 bg-slate-800/90 backdrop-blur-xl rounded-xl px-4 py-2 text-white text-sm font-medium border border-blue-500/20">
                  {zoomLevel}%
                </div>
              </div>

              {/* Enhanced Side Panels */}
              <AnimatePresence>
                {(showVersionHistory || showCollaboration) && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 400, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="bg-slate-800/95 backdrop-blur-xl border-l border-blue-500/20 overflow-hidden"
                  >
                    <div className="p-6 h-full overflow-y-auto">
                      {showVersionHistory && (
                        <div>
                          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                            <Clock className="w-6 h-6 mr-3 text-blue-400" />
                            Version History
                          </h3>
                          <div className="space-y-4">
                            {versions.map((version) => (
                              <motion.div 
                                key={version.id} 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-4 bg-slate-700/50 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-all"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-white font-semibold">
                                    Rev {version.version_number}{version.revision_letter && ` (${version.revision_letter})`}
                                  </span>
                                  {version.is_current && (
                                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30">
                                      Current
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-300 mb-3">{version.changes_description}</p>
                                <p className="text-xs text-gray-400">
                                  {new Date(version.upload_date).toLocaleDateString()}
                                </p>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {showCollaboration && (
                        <div>
                          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                            <Users className="w-6 h-6 mr-3 text-blue-400" />
                            Team Activity
                          </h3>
                          <div className="space-y-4">
                            {[
                              { user: 'John Doe', action: 'Added annotation on foundation detail', time: '2 hours ago', avatar: 'JD', color: 'from-blue-500 to-cyan-500' },
                              { user: 'Sarah Miller', action: 'Approved drawing revision', time: '1 day ago', avatar: 'SM', color: 'from-emerald-500 to-green-500' },
                              { user: 'Mike Johnson', action: 'Updated measurement annotations', time: '2 days ago', avatar: 'MJ', color: 'from-purple-500 to-pink-500' }
                            ].map((activity, index) => (
                              <motion.div 
                                key={index}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-4 bg-slate-700/50 rounded-xl border border-blue-500/20"
                              >
                                <div className="flex items-center space-x-3 mb-2">
                                  <div className={`w-8 h-8 bg-gradient-to-r ${activity.color} rounded-full flex items-center justify-center text-xs text-white font-bold`}>
                                    {activity.avatar}
                                  </div>
                                  <div className="flex-1">
                                    <span className="text-white font-medium">{activity.user}</span>
                                    <span className="text-xs text-gray-400 ml-2">{activity.time}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-300 ml-11">{activity.action}</p>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Drawings;