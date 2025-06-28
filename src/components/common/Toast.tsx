import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertTriangle, Info, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 4000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) {
        setTimeout(onClose, 300); // Allow exit animation to complete
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Check className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/90 border-green-600 text-white';
      case 'error':
        return 'bg-red-500/90 border-red-600 text-white';
      case 'warning':
        return 'bg-yellow-500/90 border-yellow-600 text-white';
      case 'info':
      default:
        return 'bg-blue-500/90 border-blue-600 text-white';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-4 right-4 z-50 max-w-md border rounded-lg shadow-lg backdrop-blur-sm flex items-center ${getStyles()}`}
        >
          <div className="flex p-3 items-center">
            <div className="mr-3">
              {getIcon()}
            </div>
            <div className="flex-1">
              {message}
            </div>
            <button
              className="ml-3 p-1 rounded-full hover:bg-black/10 focus:outline-none"
              onClick={() => {
                setIsVisible(false);
                if (onClose) {
                  setTimeout(onClose, 300);
                }
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;