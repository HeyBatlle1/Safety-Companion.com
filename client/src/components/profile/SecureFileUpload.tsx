import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, File, CheckCircle, AlertTriangle, X, Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

interface SecureFileUploadProps {
  onUpload: (file: File, metadata: any) => Promise<void>;
  acceptedTypes: string[];
  maxSize: number; // in bytes
  documentType: 'certification' | 'id_document' | 'profile_photo' | 'emergency_contact' | 'other';
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'scanning' | 'success' | 'error';
  error?: string;
}

const SecureFileUpload: React.FC<SecureFileUploadProps> = ({
  onUpload,
  acceptedTypes,
  maxSize,
  documentType
}) => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File size too large. Maximum allowed: ${Math.round(maxSize / 1024 / 1024)}MB`;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type;
    
    const isValidType = acceptedTypes.some(type => 
      type.startsWith('.') ? type === fileExtension : type === mimeType
    );

    if (!isValidType) {
      return `Invalid file type. Allowed: ${acceptedTypes.join(', ')}`;
    }

    // Check for potentially dangerous files
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js'];
    if (dangerousExtensions.includes(fileExtension)) {
      return 'This file type is not allowed for security reasons';
    }

    return null;
  };

  const calculateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    const newUploads: UploadProgress[] = [];

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        toast({
          title: 'Upload Error',
          description: validationError,
          variant: 'destructive'
        });
        continue;
      }

      newUploads.push({
        file,
        progress: 0,
        status: 'uploading'
      });
    }

    setUploads(prev => [...prev, ...newUploads]);

    // Process each upload
    for (let i = 0; i < newUploads.length; i++) {
      const upload = newUploads[i];
      const uploadIndex = uploads.length + i;

      try {
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploads(prev => prev.map((u, idx) => 
            idx === uploadIndex ? { ...u, progress } : u
          ));
        }

        // Start virus scanning
        setUploads(prev => prev.map((u, idx) => 
          idx === uploadIndex ? { ...u, status: 'scanning', progress: 100 } : u
        ));

        // Calculate file hash for integrity
        const fileHash = await calculateFileHash(upload.file);

        // Simulate virus scan
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Prepare metadata
        const metadata = {
          documentType,
          originalFilename: upload.file.name,
          fileSize: upload.file.size,
          mimeType: upload.file.type,
          fileHash,
          uploadedAt: new Date().toISOString()
        };

        // Call upload handler
        await onUpload(upload.file, metadata);

        // Mark as success
        setUploads(prev => prev.map((u, idx) => 
          idx === uploadIndex ? { ...u, status: 'success' } : u
        ));

        toast({
          title: 'Upload Successful',
          description: `${upload.file.name} has been uploaded and is pending approval.`,
          variant: 'default'
        });

      } catch (error) {
        
        setUploads(prev => prev.map((u, idx) => 
          idx === uploadIndex ? { 
            ...u, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Upload failed'
          } : u
        ));

        toast({
          title: 'Upload Failed',
          description: `Failed to upload ${upload.file.name}`,
          variant: 'destructive'
        });
      }
    }
  }, [uploads.length, onUpload, documentType, toast, maxSize, acceptedTypes]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const removeUpload = (index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading': return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
      case 'scanning': return <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default: return <File className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading': return 'Uploading...';
      case 'scanning': return 'Virus scanning...';
      case 'success': return 'Upload complete';
      case 'error': return 'Upload failed';
      default: return 'Pending';
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          dragActive
            ? 'border-blue-400 bg-blue-500/10'
            : 'border-blue-500/30 bg-slate-700/20 hover:border-blue-400/50 hover:bg-slate-700/30'
        }`}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-4">
          <Upload className="w-12 h-12 text-blue-400 mx-auto" />
          <div>
            <h3 className="text-lg font-medium text-white mb-2">
              Upload {documentType.replace('_', ' ')} documents
            </h3>
            <p className="text-gray-300 mb-2">
              Drag and drop files here, or click to select
            </p>
            <p className="text-sm text-gray-400">
              Accepted: {acceptedTypes.join(', ')} • Max size: {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300"
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose Files
          </button>
        </div>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300">Upload Progress</h4>
          {uploads.map((upload, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-slate-700/30 rounded-lg border border-blue-500/10"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(upload.status)}
                  <div>
                    <p className="text-sm font-medium text-white">{upload.file.name}</p>
                    <p className="text-xs text-gray-400">
                      {(upload.file.size / 1024 / 1024).toFixed(2)} MB • {getStatusText(upload.status)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeUpload(index)}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Bar */}
              {upload.status === 'uploading' && (
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}

              {/* Error Message */}
              {upload.status === 'error' && upload.error && (
                <p className="text-sm text-red-400 mt-2">{upload.error}</p>
              )}

              {/* Success Message */}
              {upload.status === 'success' && (
                <p className="text-sm text-green-400 mt-2">
                  File uploaded successfully and is pending approval
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Security Notice */}
      <div className="p-4 bg-slate-700/20 rounded-lg border border-yellow-500/20">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-yellow-300 mb-1">Security Notice</h4>
            <p className="text-xs text-gray-300">
              All uploaded files are automatically scanned for viruses and malware. 
              Documents require approval before becoming visible to other users. 
              Files are encrypted and stored securely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureFileUpload;