import express from 'express';
import { multiAgentSafety } from '../services/multiAgentSafety';
import { db } from '../db';
import { analysisHistory } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

/**
 * POST /api/checklist-analysis
 * Analyze checklist data with predictive incident forecasting and weather integration
 * Using 4-agent pipeline with complete agent output tracking
 */
router.post('/checklist-analysis', async (req, res) => {
  try {
    const checklistData = req.body;
    
    if (!checklistData) {
      return res.status(400).json({ error: 'Checklist data is required' });
    }

    // Ensure site location is present for weather function
    const siteLocation = checklistData.sections?.[0]?.responses?.[0]?.response || 
                        checklistData.responses?.site_location || 
                        checklistData.site_location;
    
    if (!siteLocation) {
      return res.status(400).json({ 
        error: 'Site location is required for weather-integrated analysis' 
      });
    }

    console.log(`🔍 Predictive analysis for site: ${siteLocation}`);
    
    // Fetch real-time weather data for the site location
    const { getWeatherForSafetyAnalysis } = await import('../services/weatherFunction');
    const weatherData = await getWeatherForSafetyAnalysis(siteLocation);
    
    // Create analysis_history record to link agent outputs
    const userId = (req as any).session?.userId || null;
    const [analysisRecord] = await db.insert(analysisHistory).values({
      userId: userId,
      query: `JHA Analysis - ${checklistData.template || 'Site Analysis'}`,
      response: 'Generating multi-agent safety analysis...', // Will be updated after generation
      type: 'jha_multi_agent_analysis',
    }).returning();
    
    // Run the 4-agent pipeline with agent output tracking
    const result = await multiAgentSafety.analyze(checklistData, weatherData, analysisRecord.id);
    
    // Update analysis_history with final report
    await db.update(analysisHistory)
      .set({ 
        response: result.report,
        metadata: {
          ...result.metadata,
          siteLocation,
          weatherData,
          templateId: checklistData.templateId,
          generatedAt: new Date().toISOString()
        }
      })
      .where(eq(analysisHistory.id, analysisRecord.id));

    console.log(`✅ Predictive incident forecast completed with agent tracking`);

    // Return JSON with structured agent outputs for SafetyAnalysisReport
    res.json({
      success: true,
      analysis: result.report,
      agent1: result.agent1,
      agent2: result.agent2,
      agent3: result.agent3,
      agent4: result.agent4,
      analysisId: analysisRecord.id,
      metadata: result.metadata,
      weather_integrated: true,
      site_location: siteLocation,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Predictive analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/analyze-checklist-with-weather
 * Analyze checklist data with automatic weather integration
 */
router.post('/analyze-checklist-with-weather', async (req, res) => {
  try {
    const { checklistData } = req.body;
    
    if (!checklistData) {
      return res.status(400).json({ error: 'Checklist data is required' });
    }

    // Ensure site location is present for weather function
    const siteLocation = checklistData.responses?.site_location || 
                        checklistData.site_location || 
                        checklistData.responses?.siteLocation;
    
    if (!siteLocation) {
      return res.status(400).json({ 
        error: 'Site location is required for weather-integrated analysis' 
      });
    }

    console.log(`🔍 Analyzing checklist for site: ${siteLocation}`);
    
    // Fetch real-time weather data for the site location
    const { getWeatherForSafetyAnalysis } = await import('../services/weatherFunction');
    const weatherData = await getWeatherForSafetyAnalysis(siteLocation);
    
    // Use Gemini with weather passed as SEPARATE parameter (proper architecture)
    const analysis = await geminiWeatherAnalyzer.analyzeChecklistWithWeather(
      checklistData,  // ← First parameter: checklist
      weatherData     // ← Second parameter: weather (NOT embedded!)
    );

    console.log(`✅ Analysis completed with weather integration`);

    res.json({
      success: true,
      analysis,
      weather_integrated: true,
      site_location: siteLocation,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Checklist analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/test-weather-function/:location
 * Test the weather function directly
 */
router.get('/test-weather-function/:location', async (req, res) => {
  try {
    const { location } = req.params;
    
    // Import the weather function for testing
    const { getWeatherForSafetyAnalysis } = await import('../services/weatherFunction');
    const weatherData = await getWeatherForSafetyAnalysis(location);
    
    res.json({
      success: true,
      location,
      weather_data: weatherData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Weather function test error:', error);
    res.status(500).json({
      error: 'Weather function test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;