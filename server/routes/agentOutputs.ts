import { Router } from 'express';
import { db } from '../db.js';
import { agentOutputs } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * Get agent outputs for a specific analysis
 * GET /api/agent-outputs/:analysisId
 */
router.get('/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;
    
    const outputs = await db
      .select()
      .from(agentOutputs)
      .where(eq(agentOutputs.analysisId, analysisId))
      .orderBy(agentOutputs.createdAt);
    
    res.json({
      success: true,
      agentOutputs: outputs
    });
  } catch (error: any) {
    console.error('Error fetching agent outputs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch agent outputs'
    });
  }
});

export default router;
