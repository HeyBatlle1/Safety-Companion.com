import express from 'express';
import { geminiWeatherAnalyzer } from '../services/geminiWithWeather';

const router = express.Router();

/**
 * POST /api/checklist-analysis
 * Analyze checklist data with predictive incident forecasting and weather integration
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
    
    // Use Gemini with weather passed as SEPARATE parameter (proper architecture)
    const analysis = await geminiWeatherAnalyzer.analyzeChecklistWithWeather(
      checklistData,  // ← First parameter: checklist
      weatherData     // ← Second parameter: weather (NOT embedded!)
    );

    console.log(`✅ Predictive incident forecast completed`);

    // Return plain text for frontend compatibility
    res.set('Content-Type', 'text/plain');
    res.send(analysis);

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