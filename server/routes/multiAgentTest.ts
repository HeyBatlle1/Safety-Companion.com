import { Router } from 'express';
import { multiAgentSafety } from '../services/multiAgentSafety';
import { db } from '../db';
import { analysisHistory } from '@shared/schema';

const router = Router();

router.post('/test-multi-agent', async (req, res) => {
  try {
    const { checklistData, weatherData, saveToDatabase = true } = req.body;

    if (!checklistData) {
      return res.status(400).json({ error: 'checklistData required' });
    }

    console.log('🧪 Testing multi-agent pipeline...');

    // Call the multi-agent pipeline (now returns { report, metadata })
    const result = await multiAgentSafety.analyze(checklistData, weatherData || null);

    // Save to database with comprehensive metadata if requested
    let analysisId = null;
    if (saveToDatabase && req.user?.id) {
      try {
        // Defensive extraction of metadata fields with fallbacks
        const topRiskScore = result.metadata?.topRiskScore ?? 0;
        const predictionConfidence = result.metadata?.predictionConfidence || 'NONE';
        
        // Store complete metadata structure (don't flatten - preserves all agent details)
        const [saved] = await db.insert(analysisHistory).values({
          userId: req.user.id,
          query: JSON.stringify({ checklistData, weatherData }),
          response: result.report,
          type: 'multi_agent_safety_assessment',
          riskScore: topRiskScore,
          confidenceScore: predictionConfidence === 'HIGH' ? 90 : 
                          predictionConfidence === 'MEDIUM' ? 70 : 50,
          urgencyLevel: topRiskScore > 85 ? 'critical' : 
                       topRiskScore > 70 ? 'high' : 
                       topRiskScore > 50 ? 'medium' : 'low',
          metadata: {
            // Store complete metadata structure - all agent execution details preserved
            ...result.metadata,
            
            // Additional context for analytics
            weatherDataProvided: !!weatherData,
            location: checklistData.location || checklistData.sections?.[0]?.responses?.[0]?.response || 'Unknown',
            checklistTemplate: checklistData.template || checklistData.templateId || 'Unknown'
          }
        }).returning();
        
        analysisId = saved.id;
        console.log(`✅ Analysis saved to database with ID: ${analysisId}`);
      } catch (dbError) {
        console.error('Database save error:', dbError);
        // Don't fail the request if database save fails
      }
    }

    res.json({
      success: true,
      analysis: result.report,
      metadata: result.metadata,
      analysisId,
      method: 'multi-agent-pipeline-v1.0'
    });

  } catch (error: any) {
    console.error('Multi-agent test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
