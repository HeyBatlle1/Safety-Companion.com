/**
 * Utilities for logging and analytics
 */

// Log levels
enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

// Configurable log level
let currentLogLevel: LogLevel = LogLevel.INFO;

// Set the current log level
export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

// Check if a log level should be displayed
function shouldLog(level: LogLevel): boolean {
  switch (currentLogLevel) {
    case LogLevel.ERROR:
      return level === LogLevel.ERROR;
    case LogLevel.WARN:
      return level === LogLevel.ERROR || level === LogLevel.WARN;
    case LogLevel.INFO:
      return level === LogLevel.ERROR || level === LogLevel.WARN || level === LogLevel.INFO;
    case LogLevel.DEBUG:
      return true;
    default:
      return false;
  }
}

// Log a message with a given level and optional context
export function log(level: LogLevel, message: string, context?: Record<string, any>): void {
  if (!shouldLog(level)) return;

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...context
  };

  switch (level) {
    case LogLevel.ERROR:
      
      break;
    case LogLevel.WARN:
      
      break;
    case LogLevel.INFO:
      console.info(logEntry);
      break;
    case LogLevel.DEBUG:
      
      break;
  }
  
  // In a production app, you might want to send logs to a logging service
  // sendToLoggingService(logEntry);
}

// Convenience methods for different log levels
export const error = (message: string, context?: Record<string, any>): void => 
  log(LogLevel.ERROR, message, context);

export const warn = (message: string, context?: Record<string, any>): void => 
  log(LogLevel.WARN, message, context);

export const info = (message: string, context?: Record<string, any>): void => 
  log(LogLevel.INFO, message, context);

export const debug = (message: string, context?: Record<string, any>): void => 
  log(LogLevel.DEBUG, message, context);

// Record user interactions for analytics
export function trackEvent(
  eventName: string,
  eventData?: Record<string, any>
): void {
  // Log the event
  debug(`EVENT: ${eventName}`, eventData);
  
  // In a production app, you would send this to an analytics service
  // Example: sendToAnalytics(eventName, eventData);
}

// Track page views
export function trackPageView(page: string): void {
  trackEvent('page_view', { page });
}

// Track feature usage
export function trackFeatureUsage(feature: string, action: string, data?: Record<string, any>): void {
  trackEvent('feature_usage', { feature, action, ...data });
}

// Track errors
export function trackError(errorType: string, errorMessage: string, data?: Record<string, any>): void {
  trackEvent('error', { type: errorType, message: errorMessage, ...data });
}

// Track performance metrics
export function trackPerformance(
  metric: string, 
  durationMs: number, 
  data?: Record<string, any>
): void {
  trackEvent('performance', { metric, durationMs, ...data });
}

export default {
  LogLevel,
  setLogLevel,
  log,
  error,
  warn,
  info,
  debug,
  trackEvent,
  trackPageView,
  trackFeatureUsage,
  trackError,
  trackPerformance
};