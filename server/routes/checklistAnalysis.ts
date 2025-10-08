import express from 'express';
import { geminiWeatherAnalyzer } from '../services/geminiWithWeather';

const router = express.Router();

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
    
    // Use Gemini with weather function calling
    const analysis = await geminiWeatherAnalyzer.analyzeChecklistWithWeather({
      ...checklistData,
      site_location: siteLocation
    });

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