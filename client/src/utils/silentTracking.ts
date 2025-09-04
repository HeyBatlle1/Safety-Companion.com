/**
 * Phase 1 Silent Tracking - Client Side
 * Implements background analytics with no user-facing changes
 * All tracking is anonymous and performance-focused
 */

import { trackEvent } from './analytics';

// Generate anonymous session token (stored in sessionStorage)
export function getAnonymousSessionToken(): string {
  let sessionToken = sessionStorage.getItem('anonymous_session_token');
  if (!sessionToken) {
    sessionToken = crypto.randomUUID().replace(/-/g, '');
    sessionStorage.setItem('anonymous_session_token', sessionToken);
  }
  return sessionToken;
}

// Track checklist interactions silently
export async function trackChecklistInteraction(data: {
  sectionId?: string;
  interactionType: string;
  timeSpent?: number;
  modificationsCount?: number;
  completionStatus?: string;
  contextData?: any;
}) {
  try {
    const sessionToken = getAnonymousSessionToken();
    
    // Use existing analytics infrastructure but with anonymous session
    await trackEvent('checklist', data.interactionType, {
      sessionToken,
      sectionId: data.sectionId,
      timeSpent: data.timeSpent,
      modificationsCount: data.modificationsCount,
      completionStatus: data.completionStatus,
      contextData: data.contextData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Silent failure - tracking should never break the app
    console.debug('Silent tracking error (checklist):', error);
  }
}

// Track analysis generation interactions
export async function trackAnalysisInteraction(data: {
  analysisType: string;
  duration?: number;
  success: boolean;
  errorDetails?: string;
  contextData?: any;
}) {
  try {
    const sessionToken = getAnonymousSessionToken();
    
    await trackEvent('analysis', data.analysisType, {
      sessionToken,
      duration: data.duration,
      success: data.success,
      errorDetails: data.errorDetails,
      contextData: data.contextData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.debug('Silent tracking error (analysis):', error);
  }
}

// Track section modification patterns
export async function trackSectionModification(data: {
  sectionId: string;
  modificationType: string;
  beforeValue?: any;
  afterValue?: any;
  timeToModify?: number;
}) {
  try {
    const sessionToken = getAnonymousSessionToken();
    
    await trackEvent('section_modification', data.modificationType, {
      sessionToken,
      sectionId: data.sectionId,
      modificationType: data.modificationType,
      hasChanges: data.beforeValue !== data.afterValue,
      timeToModify: data.timeToModify,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.debug('Silent tracking error (section modification):', error);
  }
}

// Track page navigation and time spent
export async function trackPageInteraction(data: {
  pageName: string;
  action: 'enter' | 'exit';
  timeSpent?: number;
  contextData?: any;
}) {
  try {
    const sessionToken = getAnonymousSessionToken();
    
    await trackEvent('page_interaction', `page_${data.action}`, {
      sessionToken,
      pageName: data.pageName,
      action: data.action,
      timeSpent: data.timeSpent,
      contextData: data.contextData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.debug('Silent tracking error (page interaction):', error);
  }
}

// Performance monitoring wrapper for client-side operations
export async function trackClientPerformance<T>(
  operationName: string,
  operation: () => Promise<T>,
  metadata?: any
): Promise<T> {
  const startTime = performance.now();
  let success = true;
  let errorDetails: string | undefined;
  let result: T;

  try {
    result = await operation();
    return result;
  } catch (error) {
    success = false;
    errorDetails = error instanceof Error ? error.message : 'Unknown error';
    throw error;
  } finally {
    const duration = Math.round(performance.now() - startTime);
    
    // Track in background (don't await to avoid affecting operation performance)
    trackAnalysisInteraction({
      analysisType: operationName,
      duration,
      success,
      errorDetails,
      contextData: metadata,
    }).catch(() => {}); // Ignore tracking errors
  }
}

// Session tracking helper
interface SessionTracker {
  startTime: number;
  pageViews: string[];
  interactions: string[];
  errors: string[];
}

class ClientSessionTracker {
  private session: SessionTracker;
  
  constructor() {
    this.session = {
      startTime: Date.now(),
      pageViews: [],
      interactions: [],
      errors: []
    };
    
    // Track session end on page unload
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });
  }
  
  trackPageView(pageName: string) {
    this.session.pageViews.push(pageName);
    trackPageInteraction({
      pageName,
      action: 'enter',
      contextData: { totalPageViews: this.session.pageViews.length }
    }).catch(() => {});
  }
  
  trackInteraction(interactionType: string) {
    this.session.interactions.push(interactionType);
  }
  
  trackError(error: string) {
    this.session.errors.push(error);
  }
  
  endSession() {
    const sessionDuration = Date.now() - this.session.startTime;
    trackPageInteraction({
      pageName: 'session_summary',
      action: 'exit',
      timeSpent: sessionDuration,
      contextData: {
        totalPageViews: this.session.pageViews.length,
        totalInteractions: this.session.interactions.length,
        totalErrors: this.session.errors.length,
        pagesVisited: this.session.pageViews,
        sessionDurationMinutes: Math.round(sessionDuration / (1000 * 60))
      }
    }).catch(() => {});
  }
}

// Global session tracker instance
export const sessionTracker = new ClientSessionTracker();