/**
 * Utilities for memoization and performance optimization
 */

/**
 * Creates a memoized version of a function that caches its results
 * @param fn The function to memoize
 * @param resolver Optional function to generate cache key from arguments
 * @returns Memoized version of the function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    // Generate cache key from arguments or use resolver
    const key = resolver 
      ? resolver(...args) 
      : JSON.stringify(args);
    
    // Return cached result if available
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    
    // Calculate result and cache it
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Ensures a function is only called once within a given time period
 * @param fn The function to throttle
 * @param wait The time period in milliseconds
 * @returns Throttled version of the function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function throttled(...args: Parameters<T>): void {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;
    
    if (timeSinceLastCall >= wait) {
      // Execute immediately if enough time has passed
      lastCall = now;
      fn(...args);
    } else if (!timeout) {
      // Schedule execution after remaining wait time
      timeout = setTimeout(() => {
        lastCall = Date.now();
        timeout = null;
        fn(...args);
      }, wait - timeSinceLastCall);
    }
  };
}

/**
 * Creates a function that delays invoking the provided function
 * until after the specified wait time has elapsed since last call
 * @param fn The function to debounce
 * @param wait The time period in milliseconds
 * @param immediate Execute function on leading edge instead of trailing edge
 * @returns Debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function debounced(...args: Parameters<T>): void {
    const callNow = immediate && !timeout;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      timeout = null;
      if (!immediate) {
        fn(...args);
      }
    }, wait);
    
    if (callNow) {
      fn(...args);
    }
  };
}

export default {
  memoize,
  throttle,
  debounce
};