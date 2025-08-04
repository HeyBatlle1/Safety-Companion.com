import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Toast, { ToastType } from './Toast';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// Create global toast event system
type ToastEvent = CustomEvent<Omit<ToastMessage, 'id'>>;

// Create a custom event type for showing toasts
declare global {
  interface WindowEventMap {
    'show-toast': ToastEvent;
  }
}

// Helper function to show a toast programmatically
export const showToast = (
  message: string,
  type: ToastType = 'info',
  duration?: number
): void => {
  const event = new CustomEvent<Omit<ToastMessage, 'id'>>('show-toast', {
    detail: { message, type, duration }
  });
  window.dispatchEvent(event);
};

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Add a new toast
  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    setToasts(prev => [
      ...prev,
      { ...toast, id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` }
    ]);
  }, []);

  // Remove a toast by its ID
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Listen for toast events
  useEffect(() => {
    const handleToastEvent = (event: ToastEvent) => {
      addToast(event.detail);
    };

    window.addEventListener('show-toast', handleToastEvent);
    return () => {
      window.removeEventListener('show-toast', handleToastEvent);
    };
  }, [addToast]);

  // Create a portal for the toasts to be rendered at the end of the document body
  return createPortal(
    <div className="fixed top-0 right-0 z-50 p-4 space-y-4">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};

export default ToastContainer;