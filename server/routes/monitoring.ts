import { Router } from 'express';
import { db } from '../db';
import { userInteractionAnalytics, systemPerformanceMetrics } from '@shared/schema';
import { sql, desc, count, avg } from 'drizzle-orm';

const router = Router();

/**
 * Phase 1 Silent Tracking Monitoring Endpoints
 * Internal monitoring only - no user-facing features
 */

// Get tracking system health status
router.get('/tracking/health', async (req, res) => {
  try {
    const [userInteractionCount] = await db
      .select({ count: count() })
      .from(userInteractionAnalytics);

    const [performanceCount] = await db
      .select({ count: count() })
      .from(systemPerformanceMetrics);

    const recentUserInteractions = await db
      .select()
      .from(userInteractionAnalytics)
      .orderBy(desc(userInteractionAnalytics.createdAt))
      .limit(5);

    const recentPerformanceMetrics = await db
      .select()
      .from(systemPerformanceMetrics)
      .orderBy(desc(systemPerformanceMetrics.createdAt))
      .limit(5);

    res.json({
      status: 'operational',
      trackingData: {
        userInteractions: userInteractionCount.count,
        performanceMetrics: performanceCount.count,
        recentUserInteractions,
        recentPerformanceMetrics
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Tracking health check error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to retrieve tracking health data'
    });
  }
});

// Get anonymous usage patterns (for Phase 1 analysis)
router.get('/tracking/patterns', async (req, res) => {
  try {
    // Most common interaction types
    const interactionTypes = await db
      .select({
        interactionType: userInteractionAnalytics.interactionType,
        count: count(),
        avgTimeSpent: avg(userInteractionAnalytics.timeSpent)
      })
      .from(userInteractionAnalytics)
      .groupBy(userInteractionAnalytics.interactionType)
      .orderBy(desc(count()));

    // Performance metrics summary
    const performanceSummary = await db
      .select({
        metricType: systemPerformanceMetrics.metricType,
        count: count(),
        avgDuration: avg(systemPerformanceMetrics.duration),
        successRate: sql`ROUND(AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) * 100, 2)`
      })
      .from(systemPerformanceMetrics)
      .groupBy(systemPerformanceMetrics.metricType)
      .orderBy(desc(count()));

    // Daily activity patterns (anonymized)
    const dailyActivity = await db
      .select({
        date: sql`DATE(created_at)`,
        interactions: count()
      })
      .from(userInteractionAnalytics)
      .groupBy(sql`DATE(created_at)`)
      .orderBy(desc(sql`DATE(created_at)`))
      .limit(7);

    res.json({
      patterns: {
        interactionTypes,
        performanceSummary,
        dailyActivity
      },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Pattern analysis error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to analyze tracking patterns'
    });
  }
});

// System performance overview
router.get('/tracking/performance', async (req, res) => {
  try {
    // Get performance metrics for the last 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const performanceData = await db
      .select()
      .from(systemPerformanceMetrics)
      .where(sql`created_at >= ${twentyFourHoursAgo}`)
      .orderBy(desc(systemPerformanceMetrics.createdAt));

    // Calculate performance statistics
    const stats = {
      totalOperations: performanceData.length,
      successRate: 0,
      avgDuration: 0,
      slowestOperations: [] as any[],
      errorRate: 0
    };

    if (performanceData.length > 0) {
      const successful = performanceData.filter(p => p.success);
      stats.successRate = Math.round((successful.length / performanceData.length) * 100);
      stats.errorRate = 100 - stats.successRate;
      
      const durations = performanceData
        .filter(p => p.duration !== null)
        .map(p => p.duration!);
      
      if (durations.length > 0) {
        stats.avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
      }

      stats.slowestOperations = performanceData
        .filter(p => p.duration !== null && p.duration > 1000)
        .sort((a, b) => (b.duration || 0) - (a.duration || 0))
        .slice(0, 5)
        .map(p => ({
          metricName: p.metricName,
          duration: p.duration,
          success: p.success,
          timestamp: p.createdAt
        }));
    }

    res.json({
      performance: stats,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Performance analysis error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to analyze system performance'
    });
  }
});

export default router;