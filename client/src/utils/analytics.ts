/**
 * Analytics utilities for tracking user behavior
 */
import { getCurrentUser } from '../services/supabase';
import logger from './logger';

// Types of analytics events 
export enum EventType {
  PAGE_VIEW = 'page_view',
  BUTTON_CLICK = 'button_click',
  FORM_SUBMIT = 'form_submit',
  ERROR = 'error',
  FEATURE_USAGE = 'feature_usage', 
  AUTH = 'auth',
  DOWNLOAD = 'download',
  UPLOAD = 'upload',
  VIDEO = 'video',
  SEARCH = 'search'
}

// Interface for analytics events
interface AnalyticsEvent {
  type: EventType;
  name: string;
  timestamp: string;
  userId?: string;
  sessionId: string;
  properties?: Record<string, any>;
  environment: 'production' | 'development';
}

// Get a unique session ID or create one if it doesn't exist
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('analytics_session_id');
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('analytics_session_id', sessionId);
    
    // Set session expiration (4 hours)
    const expiration = Date.now() + (4 * 60 * 60 * 1000);
    localStorage.setItem('analytics_session_expiration', expiration.toString());
  } else {
    // Check if session has expired
    const expiration = localStorage.getItem('analytics_session_expiration');
    if (expiration && parseInt(expiration) < Date.now()) {
      // Create a new session if expired
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('analytics_session_id', sessionId);
      
      // Set new expiration
      const newExpiration = Date.now() + (4 * 60 * 60 * 1000);
      localStorage.setItem('analytics_session_expiration', newExpiration.toString());
    }
  }
  
  return sessionId;
};

// Track an analytics event
export async function trackEvent(
  type: EventType,
  name: string,
  properties?: Record<string, any>
): Promise<void> {
  try {
    // Get current user if available
    const user = await getCurrentUser();
    
    // Create the event object
    const event: AnalyticsEvent = {
      type,
      name,
      timestamp: new Date().toISOString(),
      userId: user?.id,
      sessionId: getSessionId(),
      properties,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
    };
    
    // Log the event locally
    logger.debug(`ANALYTICS EVENT: ${type} - ${name}`, properties);
    
    // In a production app, send the event to an analytics service
    // Example: sendToAnalyticsService(event);
    
    // For now, store in localStorage for development purposes
    const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
    events.push(event);
    
    // Keep only the last 100 events to avoid localStorage overflow
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }
    
    localStorage.setItem('analytics_events', JSON.stringify(events));
  } catch (error) {
    // Silently fail - analytics should never break the app
    logger.error('Analytics error', { error });
  }
}

// Helper functions for common events
export const trackPageView = (page: string, properties?: Record<string, any>) => 
  trackEvent(EventType.PAGE_VIEW, page, properties);

export const trackButtonClick = (buttonName: string, properties?: Record<string, any>) => 
  trackEvent(EventType.BUTTON_CLICK, buttonName, properties);

export const trackFormSubmit = (formName: string, properties?: Record<string, any>) => 
  trackEvent(EventType.FORM_SUBMIT, formName, properties);

export const trackError = (errorName: string, properties?: Record<string, any>) => 
  trackEvent(EventType.ERROR, errorName, properties);

export const trackFeatureUsage = (featureName: string, properties?: Record<string, any>) => 
  trackEvent(EventType.FEATURE_USAGE, featureName, properties);

export const trackAuth = (action: 'login' | 'logout' | 'register' | 'password_reset', properties?: Record<string, any>) => 
  trackEvent(EventType.AUTH, action, properties);

export const trackVideoInteraction = (action: 'play' | 'pause' | 'complete' | 'mark_watched' | 'mark_unwatched', videoId: string, properties?: Record<string, any>) => 
  trackEvent(EventType.VIDEO, action, { videoId, ...properties });

export default {
  EventType,
  trackEvent,
  trackPageView,
  trackButtonClick,
  trackFormSubmit,
  trackError,
  trackFeatureUsage,
  trackAuth,
  trackVideoInteraction
};