import { db } from '../db';
import { userInteractionAnalytics, systemPerformanceMetrics } from '@shared/schema';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Phase 1 Silent Tracking Service
 * Implements background analytics with no user-facing changes
 * All tracking is anonymous and performance-focused
 */

// Generate anonymous session token
export function generateSessionToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Track user interactions silently
export async function trackUserInteraction(data: {
  sessionToken: string;
  sectionId?: string;
  interactionType: string;
  timeSpent?: number;
  modificationsCount?: number;
  completionStatus?: string;
  contextData?: any;
  performanceMetrics?: any;
}) {
  try {
    await db.insert(userInteractionAnalytics).values({
      sessionToken: data.sessionToken,
      sectionId: data.sectionId,
      interactionType: data.interactionType,
      timeSpent: data.timeSpent,
      modificationsCount: data.modificationsCount || 0,
      completionStatus: data.completionStatus,
      contextData: data.contextData,
      performanceMetrics: data.performanceMetrics,
    });
  } catch (error) {
    // Silent failure - tracking should never break the app
    console.error('Silent tracking error (user interaction):', error);
  }
}

// Track system performance metrics
export async function trackSystemPerformance(data: {
  metricType: string;
  metricName: string;
  duration?: number;
  success: boolean;
  errorDetails?: string;
  resourceUsage?: any;
  metadata?: any;
}) {
  try {
    await db.insert(systemPerformanceMetrics).values({
      metricType: data.metricType,
      metricName: data.metricName,
      duration: data.duration,
      success: data.success,
      errorDetails: data.errorDetails,
      resourceUsage: data.resourceUsage,
      metadata: data.metadata,
    });
  } catch (error) {
    // Silent failure - tracking should never break the app
    console.error('Silent tracking error (system performance):', error);
  }
}

// Performance wrapper for database queries
export async function trackDatabaseQuery<T>(
  queryName: string,
  queryFunction: () => Promise<T>,
  metadata?: any
): Promise<T> {
  const startTime = Date.now();
  let success = true;
  let errorDetails: string | undefined;
  let result: T;

  try {
    result = await queryFunction();
    return result;
  } catch (error) {
    success = false;
    errorDetails = error instanceof Error ? error.message : 'Unknown error';
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    
    // Track performance in background (don't await to avoid affecting query performance)
    trackSystemPerformance({
      metricType: 'database_query',
      metricName: queryName,
      duration,
      success,
      errorDetails,
      metadata,
    }).catch(() => {}); // Ignore tracking errors
  }
}

// Performance wrapper for AI analysis
export async function trackAIAnalysis<T>(
  analysisType: string,
  analysisFunction: () => Promise<T>,
  metadata?: any
): Promise<T> {
  const startTime = Date.now();
  let success = true;
  let errorDetails: string | undefined;
  let result: T;

  try {
    result = await analysisFunction();
    return result;
  } catch (error) {
    success = false;
    errorDetails = error instanceof Error ? error.message : 'Unknown error';
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    
    // Track performance in background
    trackSystemPerformance({
      metricType: 'ai_analysis',
      metricName: analysisType,
      duration,
      success,
      errorDetails,
      metadata,
    }).catch(() => {}); // Ignore tracking errors
  }
}

// Session tracking for user journey analytics
export async function trackUserSession(data: {
  sessionToken: string;
  sessionDuration?: number;
  pagesVisited?: string[];
  actionsCompleted?: string[];
  errors?: string[];
}) {
  try {
    await trackUserInteraction({
      sessionToken: data.sessionToken,
      interactionType: 'user_session',
      timeSpent: data.sessionDuration,
      contextData: {
        pagesVisited: data.pagesVisited,
        actionsCompleted: data.actionsCompleted,
        errors: data.errors,
      },
    });
  } catch (error) {
    console.error('Silent tracking error (user session):', error);
  }
}

// Cleanup old tracking data (automated data retention)
export async function cleanupTrackingData() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Clean up user interaction data older than 30 days
    await db.delete(userInteractionAnalytics)
      .where(sql`created_at < ${thirtyDaysAgo}`);

    // Clean up performance metrics older than 30 days
    await db.delete(systemPerformanceMetrics)
      .where(sql`created_at < ${thirtyDaysAgo}`);

    console.log('Tracking data cleanup completed');
  } catch (error) {
    console.error('Tracking data cleanup error:', error);
  }
}