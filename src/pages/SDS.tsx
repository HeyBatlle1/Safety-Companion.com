import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Send, ClipboardList, ArrowLeft, Sparkles, Bot, User } from 'lucide-react';
import { getMSDSResponse } from '../services/msdsChat';
import ChecklistSelector from '../components/checklist/ChecklistSelector';
import BackButton from '../components/navigation/BackButton';
import { useNavigate, useLocation } from 'react-router-dom';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

const SDS = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'checklist'>('chat');
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    text: 'Hello! I\'m your advanced SDS expert assistant. I can help you with chemical safety data sheets, hazard analysis, regulatory compliance, and safety protocols. What would you like to know?',
    sender: 'bot',
    timestamp: new Date().toISOString()
  }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Detect if we're returning from a checklist form
  useEffect(() => {
    if (location.state?.fromChecklist) {
      setActiveTab('checklist');
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      const response = await getMSDSResponse(input.trim());
      
      if (!response || response.trim() === '') {
        throw new Error('Empty response received from AI');
      }
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('SDS chat error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `I apologize, but I'm experiencing technical difficulties. Please try again in a moment.`,
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleChecklistClick = (templateId: string) => {
    navigate(`/checklist/${templateId}`, { state: { fromSDS: true } });
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-blue-500/20 bg-slate-800/60 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <BackButton />
          <div className="flex items-center space-x-3 flex-1 justify-center">
            <div className="relative">
              <FileText className="w-8 h-8 text-blue-400" />
              <Sparkles className="w-4 h-4 text-cyan-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                SDS Expert Assistant
              </h1>
              <p className="text-sm text-gray-400">Powered by Advanced AI</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('chat')}
              className={`px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-300 ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Bot className="w-5 h-5" />
              <span>AI Chat</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('checklist')}
              className={`px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-300 ${
                activeTab === 'checklist'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ClipboardList className="w-5 h-5" />
              <span>Checklists</span>
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'chat' ? (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end space-x-3 max-w-[80%] ${
                    message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                  }`}>
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === 'user' 
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    }`}>
                      {message.sender === 'user' ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-white" />
                      )}
                    </div>
                    
                    {/* Message Bubble */}
                    <div
                      className={`rounded-2xl px-6 py-4 ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                          : 'bg-slate-800/60 backdrop-blur-sm border border-blue-500/20 text-gray-200'
                      }`}
                    >
                      <div className="whitespace-pre-wrap leading-relaxed">{message.text}</div>
                      <div className="text-xs opacity-60 mt-2">
                        {new Date(message.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-end space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-slate-800/60 backdrop-blur-sm border border-blue-500/20 rounded-2xl px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSubmit} className="p-6 border-t border-blue-500/20 bg-slate-800/60 backdrop-blur-sm">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about chemical safety, SDS information, or regulations..."
                  className="flex-1 bg-slate-700/50 border border-blue-500/20 rounded-xl px-6 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all"
                  disabled={isTyping}
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={isTyping || !input.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="checklist"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 overflow-y-auto"
          >
            <div className="p-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-4">
                  Safety Checklists
                </h2>
                <p className="text-gray-300 max-w-2xl mx-auto">
                  Use these standardized checklists to ensure compliance with safety regulations, 
                  identify potential hazards, and maintain a safe working environment.
                </p>
              </div>
              <ChecklistSelector onChecklistClick={handleChecklistClick} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SDS;