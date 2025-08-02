import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

const toasts: Toast[] = [];
const listeners: Array<(toasts: Toast[]) => void> = [];

let toastId = 0;

function addToast(toast: Omit<Toast, 'id'>) {
  const id = (++toastId).toString();
  const newToast = { ...toast, id };
  toasts.push(newToast);
  
  listeners.forEach(listener => listener([...toasts]));
  
  // Auto remove after duration
  const duration = toast.duration ?? 5000;
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }
  
  return id;
}

function removeToast(id: string) {
  const index = toasts.findIndex(toast => toast.id === id);
  if (index > -1) {
    toasts.splice(index, 1);
    listeners.forEach(listener => listener([...toasts]));
  }
}

export function useToast() {
  const [toastList, setToastList] = useState<Toast[]>([...toasts]);
  
  const subscribe = useCallback((listener: (toasts: Toast[]) => void) => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);
  
  const toast = useCallback((props: Omit<Toast, 'id'>) => {
    return addToast(props);
  }, []);
  
  const dismiss = useCallback((id: string) => {
    removeToast(id);
  }, []);
  
  return {
    toast,
    dismiss,
    toasts: toastList,
    subscribe
  };
}