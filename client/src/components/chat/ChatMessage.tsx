import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { File, FileImage, Headphones, ChevronDown, ChevronUp, Download, Copy, Share2, MessageSquare, Check } from 'lucide-react';
import { Message } from '../../types/chat';
import { showToast } from '../common/ToastContainer';

interface ChatMessageProps {
  message: Message;
  isFirst: boolean;
  isLast: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isFirst, isLast }) => {
  const [showAttachments, setShowAttachments] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const isBot = message.sender === 'bot';
  const hasAttachments = message.attachments && message.attachments.length > 0;

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="w-4 h-4" />;
    if (type.startsWith('audio/')) return <Headphones className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };
  
  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.text)
      .then(() => {
        setIsCopied(true);
        showToast('Message copied to clipboard', 'success');
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        
        showToast('Failed to copy message', 'error');
      });
  };

  const shareMessage = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Safety Companion Chat',
        text: message.text
      }).catch(err => {
        
      });
    } else {
      copyToClipboard();
      showToast('Sharing not supported on this device, copied to clipboard instead', 'info');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isBot ? 'justify-start' : 'justify-end'} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        className={`flex items-end space-x-2 max-w-[85%] ${
          isBot ? 'flex-row' : 'flex-row-reverse space-x-reverse'
        }`}
      >
        {isBot && (
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">G2</span>
          </div>
        )}
        
        <div className="relative">
          {/* Message actions */}
          <AnimatedActions 
            show={showActions} 
            isBot={isBot} 
            onCopy={copyToClipboard} 
            onShare={shareMessage} 
            isCopied={isCopied}
          />
          
          <div
            className={`rounded-2xl px-4 py-3 ${
              isBot
                ? 'bg-slate-800/80 backdrop-blur-sm border border-blue-500/20 text-white'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{message.text}</p>
            
            {/* Attachments section */}
            {hasAttachments && (
              <div className="mt-2 pt-2 border-t border-blue-500/20">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-300">
                    {message.attachments!.length} {message.attachments!.length === 1 ? 'attachment' : 'attachments'}
                  </span>
                  <button 
                    onClick={() => setShowAttachments(!showAttachments)}
                    className="text-xs text-gray-300 hover:text-white flex items-center"
                  >
                    {showAttachments ? (
                      <>
                        <span>Hide</span>
                        <ChevronUp className="w-3 h-3 ml-1" />
                      </>
                    ) : (
                      <>
                        <span>Show</span>
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </>
                    )}
                  </button>
                </div>
                
                {showAttachments && (
                  <div className="space-y-2">
                    {message.attachments!.map((attachment, index) => (
                      <div key={index} className="rounded-lg overflow-hidden">
                        {attachment.type === 'image' ? (
                          <div className="relative group">
                            <img 
                              src={attachment.url} 
                              alt={attachment.name} 
                              className="max-h-48 w-full object-cover rounded-lg" 
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 opacity-0 group-hover:opacity-100 transition-all">
                              <a 
                                href={attachment.url} 
                                download={attachment.name}
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="p-2 bg-blue-500 rounded-full"
                              >
                                <Download className="w-4 h-4 text-white" />
                              </a>
                            </div>
                          </div>
                        ) : attachment.type === 'audio' ? (
                          <div className="bg-slate-700/80 rounded-lg p-2">
                            <audio 
                              src={attachment.url} 
                              controls 
                              className="w-full h-8" 
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                              <span>{attachment.name}</span>
                              <span>{formatFileSize(attachment.size)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-700/80 flex items-center p-2 rounded-lg">
                            {getFileIcon(attachment.type)}
                            <div className="ml-2 flex-1 overflow-hidden">
                              <div className="text-xs font-medium truncate">{attachment.name}</div>
                              <div className="text-xs text-gray-400">{formatFileSize(attachment.size)}</div>
                            </div>
                            <a 
                              href={attachment.url} 
                              download={attachment.name}
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="ml-2 p-1 bg-slate-600/80 rounded text-gray-300 hover:text-white"
                            >
                              <Download className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <p className="text-xs mt-1 opacity-60">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Animated actions component
const AnimatedActions: React.FC<{
  show: boolean;
  isBot: boolean;
  onCopy: () => void;
  onShare: () => void;
  isCopied: boolean;
}> = ({ show, isBot, onCopy, onShare, isCopied }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: show ? 1 : 0,
        scale: show ? 1 : 0.8,
        y: show ? 0 : 10
      }}
      transition={{ duration: 0.2 }}
      className={`absolute ${isBot ? 'right-0 -top-10' : 'left-0 -top-10'} flex items-center space-x-1 bg-slate-800/90 backdrop-blur-sm rounded-lg p-1 border border-blue-500/20 z-10`}
    >
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onCopy}
        className="p-1.5 rounded-lg hover:bg-slate-700/80 text-gray-300 hover:text-white transition-colors"
        title="Copy message"
      >
        {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onShare}
        className="p-1.5 rounded-lg hover:bg-slate-700/80 text-gray-300 hover:text-white transition-colors"
        title="Share message"
      >
        <Share2 className="w-4 h-4" />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="p-1.5 rounded-lg hover:bg-slate-700/80 text-gray-300 hover:text-white transition-colors"
        title="Reply to message"
      >
        <MessageSquare className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
};

export default ChatMessage;