import { Router, Request, Response } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { supabaseDb } from '../db';
import { analysisHistory, jhaUpdates, agentOutputs } from '@shared/schema';
import { verifySupabaseToken } from '../middleware/supabaseAuth';
import { multiAgentSafetyComparison } from '../services/multiAgentSafetyComparison';

const router = Router();

// POST /api/jha-update - Create a daily update for an existing JHA
router.post('/jha-update', verifySupabaseToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      baselineAnalysisId,
      changedCategories, // ['weather', 'personnel', 'hazards']
      newWindSpeed,
      newCrewMembers,
      newHazards,
      riskAssessment, // 'safer', 'same', 'riskier'
    } = req.body;

    // Validation
    if (!baselineAnalysisId || !changedCategories || !riskAssessment) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the baseline analysis
    const baselineAnalysis = await supabaseDb
      .select()
      .from(analysisHistory)
      .where(eq(analysisHistory.id, baselineAnalysisId))
      .limit(1);

    if (!baselineAnalysis || baselineAnalysis.length === 0) {
      return res.status(404).json({ error: 'Baseline JHA not found' });
    }

    const baseline = baselineAnalysis[0];

    // Get existing updates count for this baseline
    const existingUpdates = await supabaseDb
      .select()
      .from(jhaUpdates)
      .where(eq(jhaUpdates.baselineAnalysisId, baselineAnalysisId))
      .orderBy(desc(jhaUpdates.updateNumber));

    const updateNumber = existingUpdates.length > 0 ? existingUpdates[0].updateNumber + 1 : 1;

    // Run comparison analysis with baseline + delta
    console.log(`🔄 Running JHA Update #${updateNumber} comparison analysis...`);
    
    const comparisonResult = await multiAgentSafetyComparison({
      baseline: {
        id: baseline.id,
        query: baseline.query,
        response: baseline.response,
        metadata: baseline.metadata,
        riskScore: baseline.riskScore,
      },
      delta: {
        changedCategories,
        newWindSpeed,
        newCrewMembers,
        newHazards,
        userRiskAssessment: riskAssessment,
      },
    });

    // Store the comparison as a new analysis_history record
    const [updateAnalysisRecord] = await supabaseDb
      .insert(analysisHistory)
      .values({
        userId,
        query: `JHA Update #${updateNumber} for ${baseline.query}`,
        response: comparisonResult.analysis || 'Comparison analysis completed',
        type: 'jha_update',
        riskScore: comparisonResult.metadata?.currentRiskScore || baseline.riskScore,
        metadata: {
          ...comparisonResult.metadata,
          baselineAnalysisId,
          updateNumber,
          changedCategories,
        },
      })
      .returning();

    // Store agent outputs for the update analysis
    if (comparisonResult.agent1) {
      await supabaseDb.insert(agentOutputs).values({
        analysisId: updateAnalysisRecord.id,
        agentId: 'agent_1',
        agentName: 'Data Validator',
        agentType: 'jha_update',
        outputData: comparisonResult.agent1,
        executionMetadata: { updateNumber, baselineAnalysisId },
        success: true,
      });
    }

    if (comparisonResult.agent2) {
      await supabaseDb.insert(agentOutputs).values({
        analysisId: updateAnalysisRecord.id,
        agentId: 'agent_2',
        agentName: 'Risk Assessor',
        agentType: 'jha_update',
        outputData: comparisonResult.agent2,
        executionMetadata: { updateNumber, baselineAnalysisId },
        success: true,
      });
    }

    if (comparisonResult.agent3) {
      await supabaseDb.insert(agentOutputs).values({
        analysisId: updateAnalysisRecord.id,
        agentId: 'agent_3',
        agentName: 'Incident Predictor',
        agentType: 'jha_update',
        outputData: comparisonResult.agent3,
        executionMetadata: { updateNumber, baselineAnalysisId },
        success: true,
      });
    }

    if (comparisonResult.agent4) {
      await supabaseDb.insert(agentOutputs).values({
        analysisId: updateAnalysisRecord.id,
        agentId: 'agent_4',
        agentName: 'Report Synthesizer',
        agentType: 'jha_update',
        outputData: comparisonResult.agent4,
        executionMetadata: { updateNumber, baselineAnalysisId },
        success: true,
      });
    }

    // Store the update record
    const [jhaUpdateRecord] = await supabaseDb
      .insert(jhaUpdates)
      .values({
        baselineAnalysisId,
        updateAnalysisId: updateAnalysisRecord.id,
        userId,
        updateNumber,
        changedCategories,
        newWindSpeed,
        newCrewMembers,
        newHazards,
        riskAssessment,
        comparisonResult: comparisonResult,
        goNoGoDecision: comparisonResult.goNoGoDecision || 'conditional',
        decisionReason: comparisonResult.decisionReason || 'Awaiting manual review',
        changeHighlights: comparisonResult.changeHighlights || {},
      })
      .returning();

    console.log(`✅ JHA Update #${updateNumber} completed successfully`);

    res.json({
      success: true,
      updateId: jhaUpdateRecord.id,
      updateAnalysisId: updateAnalysisRecord.id,
      updateNumber,
      comparison: comparisonResult,
      goNoGoDecision: comparisonResult.goNoGoDecision,
      decisionReason: comparisonResult.decisionReason,
      changeHighlights: comparisonResult.changeHighlights,
    });

  } catch (error: any) {
    console.error('❌ JHA update error:', error);
    res.status(500).json({
      error: 'Failed to process JHA update',
      message: error.message || 'Unknown error',
    });
  }
});

// GET /api/jha-updates/:baselineAnalysisId - Get all updates for a baseline JHA
router.get('/jha-updates/:baselineAnalysisId', verifySupabaseToken, async (req: Request, res: Response) => {
  try {
    const { baselineAnalysisId } = req.params;

    const updates = await supabaseDb
      .select()
      .from(jhaUpdates)
      .where(eq(jhaUpdates.baselineAnalysisId, baselineAnalysisId))
      .orderBy(jhaUpdates.updateNumber);

    res.json({
      success: true,
      baselineAnalysisId,
      updateCount: updates.length,
      updates,
    });

  } catch (error: any) {
    console.error('❌ Error fetching JHA updates:', error);
    res.status(500).json({
      error: 'Failed to fetch JHA updates',
      message: error.message || 'Unknown error',
    });
  }
});

export default router;
