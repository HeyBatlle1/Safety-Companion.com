import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, Mic, Image, X, Loader, Camera } from 'lucide-react';
import { ChatInputProps } from '../../types/chat';

const ChatInput: React.FC<ChatInputProps> = ({ value, onChange, onSend, disabled }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    if (value.trim() || files.length > 0 || audioURL) {
      onSend(value, [...files, ...(audioURL ? [dataURLtoFile(audioURL, 'voice-message.wav')] : [])]);
      setFiles([]);
      setAudioURL(null);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image') => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(file => {
        if (type === 'image') {
          return file.type.startsWith('image/');
        }
        return true;
      });
      setFiles(prev => [...prev, ...newFiles]);
      // Reset the input value so the same file can be selected again
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setIsRecording(false);
    } else {
      try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const reader = new FileReader();
          reader.onloadend = () => {
            setAudioURL(reader.result as string);
          };
          reader.readAsDataURL(audioBlob);
          
          // Stop all tracks from the stream
          stream.getTracks().forEach(track => track.stop());
        };
        
        // Start recording
        mediaRecorder.start(10);
        setIsRecording(true);
        setRecordingTime(0);
        
        // Start timer
        timerRef.current = window.setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Unable to access microphone. Please check your permissions.');
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRecording(false);
    setAudioURL(null);
  };

  const dataURLtoFile = (dataURL: string, filename: string): File => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCaptureImage = async () => {
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
      
      // Convert to file
      const file = dataURLtoFile(imageUrl, `captured-image-${Date.now()}.jpg`);
      
      // Add to files
      setFiles(prev => [...prev, file]);
      
      // Stop camera
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Error capturing image:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 border-t border-blue-500/20 bg-slate-800/50 backdrop-blur-sm"
    >
      {/* File attachments area */}
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div 
              key={index} 
              className="bg-slate-700/80 rounded-lg px-2 py-1 flex items-center text-sm text-white"
            >
              {file.type.startsWith('image/') ? (
                <div className="w-6 h-6 mr-2 overflow-hidden rounded">
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <Paperclip className="w-4 h-4 mr-1 text-blue-400" />
              )}
              <span className="truncate max-w-[100px]">{file.name}</span>
              <button 
                onClick={() => removeFile(index)}
                className="ml-1 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Voice recording interface */}
      {(isRecording || audioURL) && (
        <div className="mb-2 bg-slate-700/80 rounded-lg p-2 flex items-center">
          {isRecording ? (
            <>
              <div className="flex-1 flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-white">{formatTime(recordingTime)}</span>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={toggleRecording}
                  className="p-1 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                >
                  <Loader className="w-5 h-5" />
                </button>
                <button 
                  onClick={cancelRecording}
                  className="p-1 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : audioURL ? (
            <>
              <div className="flex-1 flex items-center">
                <audio 
                  src={audioURL} 
                  controls 
                  className="h-8 w-full" 
                />
              </div>
              <button 
                onClick={() => setAudioURL(null)}
                className="ml-2 p-1 rounded-full bg-slate-600 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : null}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <div className="flex space-x-2">
          {/* File attachment button */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => handleFileChange(e, 'file')} 
            style={{ display: 'none' }} 
            multiple 
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            className="p-3 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-gray-400 hover:text-blue-400 transition-colors"
            disabled={disabled || isRecording}
            onClick={handleFileClick}
          >
            <Paperclip className="w-5 h-5" />
          </motion.button>
          
          {/* Image upload button */}
          <input 
            type="file" 
            ref={imageInputRef} 
            onChange={(e) => handleFileChange(e, 'image')} 
            accept="image/*" 
            style={{ display: 'none' }} 
            multiple
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            className="p-3 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-gray-400 hover:text-blue-400 transition-colors"
            disabled={disabled || isRecording}
            onClick={handleImageClick}
          >
            <Image className="w-5 h-5" />
          </motion.button>
          
          {/* Camera button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            className="p-3 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-gray-400 hover:text-blue-400 transition-colors"
            disabled={disabled || isRecording}
            onClick={handleCaptureImage}
          >
            <Camera className="w-5 h-5" />
          </motion.button>
        </div>
        
        {/* Text input */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={disabled ? 'AI is thinking...' : isRecording ? 'Recording voice message...' : 'Type your message...'}
          className="flex-1 bg-slate-700/50 border border-blue-500/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
          disabled={disabled || isRecording}
        />
        
        {/* Voice recording button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          type="button"
          className={`p-3 rounded-lg ${
            isRecording 
              ? 'bg-red-500 text-white' 
              : 'bg-slate-700/50 hover:bg-slate-600/50 text-gray-400 hover:text-blue-400'
          } transition-colors`}
          disabled={disabled}
          onClick={toggleRecording}
        >
          <Mic className="w-5 h-5" />
        </motion.button>
        
        {/* Send button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          type="submit"
          className={`p-3 rounded-lg ${
            disabled || (value.trim() === '' && files.length === 0 && !audioURL)
              ? 'bg-slate-700/50 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-cyan-600'
          } transition-all`}
          disabled={disabled || (value.trim() === '' && files.length === 0 && !audioURL)}
        >
          {disabled ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default ChatInput;