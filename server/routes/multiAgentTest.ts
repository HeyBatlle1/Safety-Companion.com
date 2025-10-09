import { Router } from 'express';
import { multiAgentSafety } from '../services/multiAgentSafety';

const router = Router();

router.post('/test-multi-agent', async (req, res) => {
  try {
    const { checklistData, weatherData } = req.body;

    if (!checklistData) {
      return res.status(400).json({ error: 'checklistData required' });
    }

    console.log('🧪 Testing multi-agent pipeline...');

    // Call the multi-agent pipeline
    const result = await multiAgentSafety.analyze(checklistData, weatherData || null);

    res.json({
      success: true,
      analysis: result,
      method: 'multi-agent-pipeline'
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
