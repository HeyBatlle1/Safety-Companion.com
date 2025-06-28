import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Upload, X, Camera, MapPin, Loader, Check } from 'lucide-react';

interface ReportFormProps {
  onSubmit: (report: FormData) => Promise<void>;
  onSuccess?: () => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ onSubmit, onSuccess }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('safety');
  const [severity, setSeverity] = useState('medium');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    if (!description.trim()) {
      setError('Please provide a description of the safety issue');
      setLoading(false);
      return;
    }
    
    const formData = new FormData(e.currentTarget);
    files.forEach(file => formData.append('files', file));
    
    try {
      await onSubmit(formData);
      setSuccess(true);
      setDescription('');
      setSeverity('medium');
      setCategory('safety');
      setLocation('');
      setFiles([]);
      if (formRef.current) formRef.current.reset();
      if (onSuccess) onSuccess();
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting report:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleCaptureImage = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Create video element to display the stream
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      // Wait a moment for the video to initialize
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Create a canvas to capture the image
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => 
        canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.8)
      );
      
      // Create a file from the blob
      const file = new File([blob], `safety-image-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // Add the file to our files state
      setFiles(prev => [...prev, file]);
      
      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
      
    } catch (error) {
      console.error('Error capturing image:', error);
      alert('Unable to access camera. Please check your permissions.');
    }
  };

  const detectCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Unable to detect your location. Please enter it manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  return (
    <motion.form
      ref={formRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      onSubmit={handleSubmit}
    >
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm flex items-center space-x-2"
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <p>{error}</p>
        </motion.div>
      )}
      
      {success && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-3 bg-green-500/20 border border-green-500/40 rounded-lg text-green-400 text-sm flex items-center space-x-2"
        >
          <Check className="w-4 h-4 flex-shrink-0" />
          <p>Report submitted successfully! Thank you for helping improve safety.</p>
        </motion.div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Severity Level
        </label>
        <select
          name="severity"
          required
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="w-full bg-slate-800/50 border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500/40"
        >
          <option value="low">Low - Minor Issue</option>
          <option value="medium">Medium - Moderate Concern</option>
          <option value="high">High - Serious Problem</option>
          <option value="critical">Critical - Immediate Action Required</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Category
        </label>
        <select
          name="category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-slate-800/50 border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500/40"
        >
          <option value="safety">Safety Hazard</option>
          <option value="security">Security Vulnerability</option>
          <option value="compliance">Compliance Issue</option>
          <option value="environmental">Environmental Concern</option>
          <option value="equipment">Equipment Malfunction</option>
          <option value="process">Process Violation</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Location
        </label>
        <div className="flex space-x-2">
          <input
            name="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Building 4, Floor 2 or GPS coordinates"
            className="flex-1 bg-slate-800/50 border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500/40"
          />
          <button
            type="button"
            onClick={detectCurrentLocation}
            className="px-3 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors flex items-center"
          >
            <MapPin className="w-5 h-5 text-blue-400" />
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          name="description"
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-slate-800/50 border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500/40"
          placeholder="Please provide detailed information about the issue..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Supporting Evidence
        </label>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                ref={fileInputRef}
              />
              <button
                type="button"
                onClick={handleFileClick}
                className="flex items-center justify-center w-full p-4 border-2 border-dashed border-blue-500/20 rounded-lg cursor-pointer hover:border-blue-500/40 transition-colors"
              >
                <Upload className="w-6 h-6 text-blue-400 mr-2" />
                <span className="text-gray-400">Upload files</span>
              </button>
            </div>
            <button
              type="button"
              onClick={handleCaptureImage}
              className="p-4 border-2 border-dashed border-blue-500/20 rounded-lg cursor-pointer hover:border-blue-500/40 transition-colors text-blue-400"
            >
              <Camera className="w-6 h-6" />
            </button>
          </div>
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {file.type.startsWith('image/') ? (
                      <div className="w-10 h-10 overflow-hidden rounded-md bg-slate-700 flex-shrink-0">
                        <img
                          src={URL.createObjectURL(file)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center bg-slate-700 rounded-md flex-shrink-0">
                        <Upload className="w-5 h-5 text-blue-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{file.name}</p>
                      <p className="text-xs text-gray-400">
                        {file.size < 1024
                          ? `${file.size} B`
                          : file.size < 1024 * 1024
                          ? `${(file.size / 1024).toFixed(1)} KB`
                          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-red-400 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium flex items-center justify-center space-x-2 hover:from-blue-600 hover:to-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <AlertTriangle className="w-5 h-5" />
            <span>Submit Report</span>
          </>
        )}
      </button>
    </motion.form>
  );
};

export default ReportForm;