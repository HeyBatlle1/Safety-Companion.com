import express from 'express';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

/**
 * POST /api/checklist-analysis
 * Analyze checklist data with Gemini 2.5 Flash (NO weather function calling)
 * Weather data is already included from the frontend
 */
router.post('/checklist-analysis', async (req, res) => {
  try {
    const checklistData = req.body;
    
    if (!checklistData) {
      return res.status(400).json({ error: 'Checklist data is required' });
    }

    console.log(`🔍 Analyzing checklist...`);
    
    // Build analysis prompt with the weather data already included from frontend
    const prompt = buildChecklistAnalysisPrompt(checklistData);
    
    // Direct Gemini analysis - NO function calling, NO weather fetching
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4000,
      },
      thinkingConfig: {
        thinkingBudget: 0
      }
    });

    const analysis = result.response.text();
    console.log(`✅ Analysis completed`);

    res.json({
      success: true,
      analysis,
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
 * Build comprehensive prompt for checklist analysis
 * Uses weather data already provided from the frontend
 */
function buildChecklistAnalysisPrompt(checklistData: any): string {
  const site = checklistData.responses?.site_location || checklistData.site_location || 'Unknown location';
  const workType = checklistData.responses?.project_type || checklistData.project_type || 'Construction work';
  const workHeight = checklistData.responses?.work_height || checklistData.work_height || 'Unknown height';
  const weatherData = checklistData.weatherData || checklistData.weather || null;
  
  // Force current date awareness
  const currentDate = new Date();
  const dateString = currentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  });
  const currentYear = currentDate.getFullYear();
  
  let weatherSection = '';
  if (weatherData) {
    weatherSection = `
WEATHER CONDITIONS (from frontend):
${JSON.stringify(weatherData, null, 2)}
`;
  }
  
  return `
You are a professional safety analyst with expertise in OSHA compliance and construction safety. 

CRITICAL CONTEXT:
- TODAY'S DATE: ${dateString}, ${currentYear}
- You are analyzing this checklist on ${dateString}, ${currentYear}

JOB SITE DETAILS:
- Location: ${site}
- Work Type: ${workType}
- Work Height: ${workHeight} feet
${weatherSection}

CHECKLIST DATA:
${JSON.stringify(checklistData, null, 2)}

ANALYSIS REQUIREMENTS:
1. **Weather Analysis**: Factor weather conditions (if provided) into your safety recommendations
2. **Fall Protection**: Assess fall hazards based on work height and weather conditions
3. **Electrical Safety**: Evaluate electrical risks considering weather and site conditions
4. **General Hazards**: Identify all site-specific safety concerns
5. **OSHA Compliance**: Ensure all recommendations meet current OSHA standards

Please provide a comprehensive safety analysis that includes:

**WEATHER-DEPENDENT SAFETY ASSESSMENT** (if weather data provided)
- Current weather conditions and their impact on work safety
- Weather-specific recommendations and restrictions
- Forecast considerations for planning

**CRITICAL SAFETY FINDINGS**
- Immediate hazards requiring attention
- OSHA compliance status
- Risk level assessment (Low/Medium/High/Critical)

**SPECIFIC RECOMMENDATIONS**
- Fall protection requirements
- Electrical safety measures
- PPE requirements
- Work restriction recommendations based on conditions

**EMERGENCY PREPAREDNESS**
- Weather-related emergency procedures (if applicable)
- Evacuation considerations
- Communication protocols

Format your response as a professional safety report that a construction supervisor could use to make informed safety decisions.
`;
}

export default router;
