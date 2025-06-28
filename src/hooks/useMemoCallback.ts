import { useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook that returns a memoized version of a callback that
 * only changes if one of the dependencies has changed.
 * This is similar to useCallback but has better TypeScript typing.
 */
export function useMemoCallback<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: any[]
): T {
  return useCallback(callback, dependencies);
}

/**
 * Custom hook for debounce functionality
 * @param fn Function to debounce
 * @param delay Delay in milliseconds
 * @param deps Dependencies array (similar to useEffect)
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  deps: any[] = []
): T {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  
  // Clean up timer on component unmount
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);
  
  return useCallback((...args: Parameters<T>) => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    
    timer.current = setTimeout(() => {
      fn(...args);
    }, delay);
  }, deps) as T;
}

/**
 * Custom hook for throttle functionality
 * @param fn Function to throttle
 * @param delay Delay in milliseconds
 * @param deps Dependencies array
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  deps: any[] = []
): T {
  const lastRan = useRef(0);
  const throttledFn = useRef<(...args: Parameters<T>) => void>();
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastRan.current >= delay) {
      fn(...args);
      lastRan.current = now;
    } else {
      // Store the latest arguments for delayed execution
      throttledFn.current = () => fn(...args);
      
      const timeoutId = setTimeout(() => {
        if (throttledFn.current) {
          throttledFn.current();
          lastRan.current = Date.now();
          throttledFn.current = undefined;
        }
      }, delay - (now - lastRan.current));
      
      return () => clearTimeout(timeoutId);
    }
  }, deps) as T;
}

/**
 * Custom hook that returns a function that will be called at most once
 * during a time period. The function will be called at the end of the time period.
 * @param fn Function to throttle
 * @param delay Delay in milliseconds
 * @param deps Dependencies array
 */
export function useThrottleEnd<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  deps: any[] = []
): T {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const savedArgs = useRef<Parameters<T>>();
  
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);
  
  return useCallback((...args: Parameters<T>) => {
    savedArgs.current = args;
    
    if (!timer.current) {
      timer.current = setTimeout(() => {
        if (savedArgs.current) {
          fn(...savedArgs.current);
        }
        timer.current = undefined;
      }, delay);
    }
  }, deps) as T;
}

export default {
  useMemoCallback,
  useDebounce,
  useThrottle,
  useThrottleEnd
};