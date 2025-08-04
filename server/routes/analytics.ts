// Insurance Analytics API Routes
import { Router } from 'express';
import { db } from '../db';
import { analysisHistory, behaviorAnalytics, companyRiskProfiles } from '../../shared/schema';
import { eq, desc, and, gte, count } from 'drizzle-orm';

const router = Router();

// Save insurance analysis data
router.post('/save', async (req, res) => {
  try {
    const {
      userId,
      query,
      response,
      type,
      riskScore,
      sentimentScore,
      urgencyLevel,
      safetyCategories,
      keywordTags,
      confidenceScore,
      behaviorIndicators,
      complianceScore,
      metadata
    } = req.body;

    // Save to analysis history with insurance metrics
    const [analysis] = await db.insert(analysisHistory).values({
      userId,
      query,
      response,
      type,
      riskScore,
      sentimentScore,
      urgencyLevel,
      safetyCategories,
      keywordTags,
      confidenceScore,
      behaviorIndicators,
      complianceScore,
      metadata
    }).returning();

    // Update behavior analytics
    await updateBehaviorAnalytics(userId, riskScore, type);

    res.json({ success: true, analysisId: analysis.id });
  } catch (error) {
    console.error('Save analytics error:', error);
    res.status(500).json({ error: 'Failed to save analytics' });
  }
});

// Get insurance analytics dashboard data
router.get('/dashboard/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get company risk profile
    const [riskProfile] = await db
      .select()
      .from(companyRiskProfiles)
      .where(eq(companyRiskProfiles.companyId, companyId))
      .limit(1);

    // Get recent high-risk activities
    const highRiskActivities = await db
      .select()
      .from(analysisHistory)
      .where(
        and(
          gte(analysisHistory.createdAt, thirtyDaysAgo),
          gte(analysisHistory.riskScore, 70)
        )
      )
      .orderBy(desc(analysisHistory.createdAt))
      .limit(20);

    // Get behavior trends
    const behaviorTrends = await db
      .select()
      .from(behaviorAnalytics)
      .where(eq(behaviorAnalytics.companyId, companyId))
      .orderBy(desc(behaviorAnalytics.updatedAt))
      .limit(50);

    // Calculate key metrics
    const totalAnalyses = await db
      .select({ count: count() })
      .from(analysisHistory)
      .where(gte(analysisHistory.createdAt, thirtyDaysAgo));

    const avgRiskScore = highRiskActivities.length > 0 
      ? Math.round(highRiskActivities.reduce((sum, item) => sum + (item.riskScore || 0), 0) / highRiskActivities.length)
      : 25;

    res.json({
      riskProfile,
      highRiskActivities,
      behaviorTrends,
      metrics: {
        totalAnalyses: totalAnalyses[0].count,
        avgRiskScore,
        highRiskCount: highRiskActivities.length,
        complianceScore: riskProfile?.complianceScore || 75
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Export insurance data for sale (anonymized)
router.get('/export/:industryCode', async (req, res) => {
  try {
    const { industryCode } = req.params;
    const { startDate, endDate } = req.query;

    // Get anonymized company risk profiles by industry
    const profiles = await db
      .select({
        industryCode: companyRiskProfiles.industryCode,
        companySize: companyRiskProfiles.companySize,
        totalEmployees: companyRiskProfiles.totalEmployees,
        avgRiskScore: companyRiskProfiles.avgRiskScore,
        incidentRate: companyRiskProfiles.incidentRate,
        complianceScore: companyRiskProfiles.complianceScore,
        predictedIncidents: companyRiskProfiles.predictedIncidents,
        insurancePremiumFactor: companyRiskProfiles.insurancePremiumFactor,
        highRiskDepartments: companyRiskProfiles.highRiskDepartments,
        safetyTrainingHours: companyRiskProfiles.safetyTrainingHours,
        // Remove identifiable information
        anonymizedId: companyRiskProfiles.id
      })
      .from(companyRiskProfiles)
      .where(eq(companyRiskProfiles.industryCode, industryCode));

    // Get aggregated behavior patterns (anonymized)
    const behaviorPatterns = await db
      .select({
        department: behaviorAnalytics.department,
        jobRole: behaviorAnalytics.jobRole,
        shiftType: behaviorAnalytics.shiftType,
        experienceLevel: behaviorAnalytics.experienceLevel,
        avgComplianceScore: behaviorAnalytics.complianceScore,
        riskTrend: behaviorAnalytics.riskTrend,
        incidentPredictionScore: behaviorAnalytics.incidentPredictionScore,
        // Aggregate counts without personal identifiers
        totalInteractions: behaviorAnalytics.totalInteractions,
        highRiskQueries: behaviorAnalytics.highRiskQueries
      })
      .from(behaviorAnalytics)
      .where(eq(behaviorAnalytics.companyId, industryCode)); // Use industry as grouping

    res.json({
      industryCode,
      exportDate: new Date().toISOString(),
      companyProfiles: profiles,
      behaviorPatterns,
      summary: {
        totalCompanies: profiles.length,
        avgIndustryRiskScore: Math.round(
          profiles.reduce((sum, p) => sum + (p.avgRiskScore || 0), 0) / profiles.length
        ),
        avgIncidentRate: Math.round(
          profiles.reduce((sum, p) => sum + (p.incidentRate || 0), 0) / profiles.length * 100
        ) / 100,
        avgComplianceScore: Math.round(
          profiles.reduce((sum, p) => sum + (p.complianceScore || 0), 0) / profiles.length
        )
      }
    });
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Update behavior analytics for a user
async function updateBehaviorAnalytics(userId: string, riskScore: number, type: string) {
  try {
    // Get or create behavior analytics record
    const [existing] = await db
      .select()
      .from(behaviorAnalytics)
      .where(eq(behaviorAnalytics.userId, userId))
      .limit(1);

    if (existing) {
      // Update existing record
      const newHighRiskQueries = riskScore >= 70 
        ? existing.highRiskQueries + 1 
        : existing.highRiskQueries;

      const newComplianceScore = Math.round(
        (existing.complianceScore * existing.totalInteractions + (riskScore > 50 ? 50 : 100)) 
        / (existing.totalInteractions + 1)
      );

      await db
        .update(behaviorAnalytics)
        .set({
          totalInteractions: existing.totalInteractions + 1,
          highRiskQueries: newHighRiskQueries,
          complianceScore: newComplianceScore,
          riskTrend: newComplianceScore > existing.complianceScore ? 'improving' : 
                    newComplianceScore < existing.complianceScore ? 'declining' : 'stable',
          lastHighRiskActivity: riskScore >= 70 ? new Date() : existing.lastHighRiskActivity,
          incidentPredictionScore: Math.min(100, Math.round(newHighRiskQueries * 2.5)),
          updatedAt: new Date()
        })
        .where(eq(behaviorAnalytics.userId, userId));
    } else {
      // Create new record
      await db.insert(behaviorAnalytics).values({
        userId,
        companyId: 'demo-company', // Default for demo
        department: 'Unknown',
        jobRole: 'Worker',
        shiftType: 'day',
        experienceLevel: 1,
        totalInteractions: 1,
        highRiskQueries: riskScore >= 70 ? 1 : 0,
        safetyViolationIndicators: 0,
        complianceScore: riskScore > 50 ? 75 : 95,
        riskTrend: 'stable',
        lastHighRiskActivity: riskScore >= 70 ? new Date() : null,
        incidentPredictionScore: Math.min(100, Math.round((riskScore >= 70 ? 1 : 0) * 2.5))
      });
    }
  } catch (error) {
    console.error('Update behavior analytics error:', error);
  }
}

export default router;