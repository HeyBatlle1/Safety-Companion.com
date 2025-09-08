import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Image, Mic, X, Loader, Camera, ChevronDown, ChevronUp, Download, Trash2, Settings, Maximize2, Minimize2, RefreshCw, Save, Share2 } from 'lucide-react';
import ChatMessage from '../components/chat/ChatMessage';
import BackButton from '../components/navigation/BackButton';
import { Message } from '../types/chat';
import { getChatResponse } from '../services/gemini';
import { saveMessage, getChatHistory, clearChatHistory } from '../services/messageService';
import { saveAnalysisToHistory } from '../services/history';
import { showToast } from '../components/common/ToastContainer';

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const history = await getChatHistory();
        
        if (history.length > 0) {
          setMessages(history);
        } else {
          // Set welcome message if no history
          setMessages([{
            id: '1',
            text: 'Welcome to Safety-Companion. I am your AI safety assistant. How can I help you today? I can provide information about workplace safety, risk assessments, and safety procedures.',
            sender: 'bot',
            timestamp: new Date().toISOString(),
          }]);
        }
        setIsHistoryLoaded(true);
      } catch (error) {
        
        // Set default welcome message on error
        setMessages([{
          id: '1',
          text: 'Welcome to Safety-Companion. I am your AI safety assistant. How can I help you today? I can provide information about workplace safety, risk assessments, and safety procedures.',
          sender: 'bot',
          timestamp: new Date().toISOString(),
        }]);
        setIsHistoryLoaded(true);
      }
    };
    
    loadChatHistory();
  }, []);

  const handleSendMessage = async (text: string = inputValue, attachments?: File[]) => {
    if ((!text.trim() && (!attachments || attachments.length === 0) && !files.length && !audioURL) || isTyping) return;

    const allFiles = [...(attachments || []), ...files];
    if (audioURL) {
      const audioFile = dataURLtoFile(audioURL, 'voice-message.wav');
      allFiles.push(audioFile);
    }

    // Process attachments to data URLs
    const processedAttachments = allFiles.length > 0
      ? await Promise.all(allFiles.map(async (file) => {
          return new Promise<{
            type: 'file' | 'image' | 'audio';
            url: string;
            name: string;
            size: number;
          }>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const type = file.type.startsWith('image/')
                ? 'image'
                : file.type.startsWith('audio/')
                  ? 'audio'
                  : 'file';
              
              resolve({
                type,
                url: reader.result as string,
                name: file.name,
                size: file.size
              });
            };
            reader.readAsDataURL(file);
          });
        }))
      : [];
    
    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
      attachments: processedAttachments.length > 0 ? processedAttachments : undefined,
    };

    // Save message to Supabase
    try {
      await saveMessage(userMessage);
    } catch (error) {
      
      // Continue even if saving fails
    }

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setFiles([]);
    setAudioURL(null);
    setIsTyping(true);
    setError(null);

    try {
      let response: string;

      // Direct query to Gemini Pro with full access
      response = await getChatResponse(text);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };

      // Save to analysis history
      try {
        await saveAnalysisToHistory({
          query: text,
          response,
          type: 'chat_response',
          metadata: {
            model: 'gemini-2.0-flash',
            temperature: 1.0,
            maxTokens: 2000
          }
        });
      } catch (historyError) {
        
      }

      // Save bot message to Supabase
      try {
        await saveMessage(botMessage);
      } catch (error) {
        
        // Continue even if saving fails
      }

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${error instanceof Error ? error.message : 'Failed to get a response. Please try again.'}`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
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
        
        showToast('Unable to access microphone. Please check your permissions.', 'error');
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
      
      // Convert to blob and then to file
      const blob = await new Promise<Blob>((resolve) => 
        canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.8)
      );
      
      const file = new File([blob], `captured-image-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // Add to files
      setFiles(prev => [...prev, file]);
      
      // Stop camera
      stream.getTracks().forEach(track => track.stop());
      
      showToast('Image captured successfully', 'success');
    } catch (error) {
      
      showToast('Unable to access camera. Please check permissions.', 'error');
    }
  };

  const handleClearChat = async () => {
    if (window.confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
      try {
        await clearChatHistory();
        setMessages([{
          id: '1',
          text: 'Welcome to Safety-Companion. I am your AI safety assistant. How can I help you today? I can provide information about workplace safety, risk assessments, and safety procedures.',
          sender: 'bot',
          timestamp: new Date().toISOString(),
        }]);
        showToast('Chat history cleared successfully', 'success');
      } catch (error) {
        
        showToast('Failed to clear chat history', 'error');
      }
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`relative flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900' : 'h-[calc(100vh-4rem)]'}`}>
      {/* Enhanced Header with Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 border-b border-blue-500/20 bg-slate-800/50 backdrop-blur-xl z-10"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BackButton />
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 p-1 flex-shrink-0">
              <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-white font-bold">G</div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                Gemini 2.0 Flash
              </h1>
              <p className="text-xs text-gray-400">Temperature 1.0</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-gray-300 hover:text-white transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-gray-300 hover:text-white transition-colors"
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>
        
        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-slate-700/50 rounded-xl border border-blue-500/20"
            >
              <div className="flex flex-wrap gap-4 justify-between">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClearChat}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Chat History</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setMessages([{
                      id: '1',
                      text: 'Welcome to Safety-Companion. I am your AI safety assistant. How can I help you today? I can provide information about workplace safety, risk assessments, and safety procedures.',
                      sender: 'bot',
                      timestamp: new Date().toISOString(),
                    }]);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>New Conversation</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // Export chat as text
                    const chatText = messages.map(m => `${m.sender === 'user' ? 'You' : 'AI'}: ${m.text}`).join('\n\n');
                    const blob = new Blob([chatText], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `safety-chat-${new Date().toISOString().split('T')[0]}.txt`;
                    a.click();
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Chat</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // Share functionality
                    if (navigator.share) {
                      navigator.share({
                        title: 'Safety Companion Chat',
                        text: 'Check out my safety conversation',
                        url: window.location.href
                      }).catch(err => {});
                    } else {
                      showToast('Sharing not supported on this device', 'warning');
                    }
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Enhanced Message Area with Glassmorphism */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        {/* Background Decoration */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5">
          <div className="w-64 h-64">
            <div className="text-8xl font-bold text-blue-400">G2</div>
          </div>
        </div>

        {/* Loading Indicator */}
        {!isHistoryLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-300">Loading conversation history...</p>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id}
            message={message}
            isFirst={index === 0}
            isLast={index === messages.length - 1}
          />
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center space-x-2 text-gray-400">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 p-1 flex-shrink-0">
              <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-xs">G</div>
            </div>
            <div className="flex items-center space-x-1 bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Area with Glassmorphism */}
      <div className="p-4 border-t border-blue-500/20 bg-slate-800/50 backdrop-blur-xl">
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

        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center space-x-2">
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
              disabled={isTyping || isRecording}
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
              disabled={isTyping || isRecording}
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
              disabled={isTyping || isRecording}
              onClick={handleCaptureImage}
            >
              <Camera className="w-5 h-5" />
            </motion.button>
          </div>
          
          {/* Text input */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isTyping ? 'AI is thinking...' : isRecording ? 'Recording voice message...' : 'Type your message...'}
            className="flex-1 bg-slate-700/50 border border-blue-500/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20"
            disabled={isTyping || isRecording}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
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
            disabled={isTyping}
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
              isTyping || (inputValue.trim() === '' && files.length === 0 && !audioURL)
                ? 'bg-slate-700/50 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-cyan-600'
            } transition-all`}
            disabled={isTyping || (inputValue.trim() === '' && files.length === 0 && !audioURL)}
          >
            {isTyping ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default Chat;