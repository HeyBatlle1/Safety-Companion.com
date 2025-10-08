import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { safetyIntelligenceService } from '../services/safetyIntelligenceService';
import { db } from '../db';
import { analysisHistory } from '../../shared/schema';
import { desc, sql } from 'drizzle-orm';

const router = express.Router();
const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' });

/**
 * POST /api/checklist-analysis
 * Analyze checklist data with Gemini 2.5 Flash (NO weather function calling)
 * Weather data is already included from the frontend
 */
router.post('/checklist-analysis', async (req, res) => {
  try {
    const checklistData = req.body;
    
    console.log('📥 Received checklist analysis request');
    console.log('Template:', checklistData?.template);
    console.log('Template ID:', checklistData?.templateId);
    
    if (!checklistData) {
      return res.status(400).json({ error: 'Checklist data is required' });
    }

    console.log(`🔍 Pulling knowledge pool data...`);
    
    // Pull OSHA risk profile for construction (NAICS 23)
    let oshaRiskProfile = null;
    try {
      oshaRiskProfile = await safetyIntelligenceService.getRiskProfile('23');
      console.log('✅ OSHA risk profile loaded:', oshaRiskProfile?.industryName);
    } catch (error) {
      console.warn('⚠️ Could not load OSHA data:', error);
    }

    // Pull recent historical analysis data for context
    let historicalContext = null;
    try {
      const recentAnalyses = await db
        .select()
        .from(analysisHistory)
        .orderBy(desc(analysisHistory.createdAt))
        .limit(5);
      
      if (recentAnalyses.length > 0) {
        historicalContext = recentAnalyses.map(a => ({
          type: a.analysisType,
          findings: a.findings,
          timestamp: a.createdAt
        }));
        console.log(`✅ Loaded ${historicalContext.length} historical analyses`);
      }
    } catch (error) {
      console.warn('⚠️ Could not load historical data:', error);
    }

    console.log(`🔍 Analyzing checklist with Gemini 2.5 Flash + Knowledge Pool...`);
    
    // Build analysis prompt with knowledge pool data
    const prompt = buildChecklistAnalysisPrompt(checklistData, oshaRiskProfile, historicalContext);
    console.log('📝 Prompt length:', prompt.length, 'characters');
    
    // Direct Gemini analysis with knowledge pool context
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

    console.log('🔍 Result object:', JSON.stringify(result, null, 2).substring(0, 500));
    
    if (!result || !result.response) {
      throw new Error('Invalid response from Gemini API');
    }

    const analysis = result.response.text();
    console.log(`✅ Analysis completed - ${analysis.length} characters`);

    res.json({
      success: true,
      analysis,
      oshaData: oshaRiskProfile,
      historicalInsights: historicalContext?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Checklist analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Build comprehensive prompt for checklist analysis
 * Uses weather data, OSHA database, and historical analysis context
 */
function buildChecklistAnalysisPrompt(checklistData: any, oshaData: any = null, historicalData: any = null): string {
  // Extract site info from various possible locations in the data
  const site = checklistData.responses?.site_location || 
                checklistData.site_location || 
                checklistData.sections?.[0]?.responses?.find((r: any) => r.question?.toLowerCase().includes('location'))?.response ||
                'Unknown location';
  
  const workType = checklistData.responses?.project_type || 
                    checklistData.project_type || 
                    checklistData.template ||
                    'Construction work';
  
  const workHeight = checklistData.responses?.work_height || 
                      checklistData.work_height || 
                      'Unknown height';
  
  // Force current date awareness
  const currentDate = new Date();
  const dateString = currentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  });
  const currentYear = currentDate.getFullYear();

  // Build OSHA knowledge pool section
  let oshaContext = '';
  if (oshaData) {
    oshaContext = `

OSHA INDUSTRY INTELLIGENCE (2023 BLS Data):
- Industry: ${oshaData.industryName}
- Injury Rate: ${oshaData.injuryRate} per 100 workers
- Fatalities (2023): ${oshaData.fatalities2023 || 'Data unavailable'}
- Risk Score: ${oshaData.riskScore}/100
- Risk Category: ${oshaData.riskCategory}
- Key Recommendations: ${oshaData.recommendations?.join(', ') || 'Standard safety protocols'}`;
  }

  // Build historical analysis context
  let historicalContext = '';
  if (historicalData && historicalData.length > 0) {
    historicalContext = `

HISTORICAL INCIDENT PATTERNS (Recent Analyses):
${historicalData.map((h: any, i: number) => 
  `${i + 1}. ${h.type} - ${h.findings?.substring(0, 200) || 'No details'}...`
).join('\n')}`;
  }
  
  return `You are a Senior Predictive Safety Analyst, specializing in incident forecasting and root cause analysis for the construction industry. You have 25 years of field experience and access to real OSHA injury databases and historical incident patterns. Your primary function is to not just identify risks, but to predict the most likely incidents and explain how they would happen based on actual industry data.

CRITICAL CONTEXT:
- TODAY'S DATE: ${dateString}, ${currentYear}
- You are analyzing this checklist on ${dateString}, ${currentYear}
- This is NOT October 26, 2023 - you are working in ${currentYear}

JOB SITE DETAILS:
- Location: ${site}
- Work Type: ${workType}
- Work Height: ${workHeight} feet

CHECKLIST DATA:
${JSON.stringify(checklistData, null, 2)}
${oshaContext}
${historicalContext}

ANALYSIS REQUIREMENTS (Follow this logical sequence):

1. **Weather Analysis**: Analyze weather data if available in the checklist. Weather conditions are a primary catalyst for incidents - assess their direct impact on equipment, materials, and personnel.

2. **Hazard Identification**: Based on the checklist and job details, identify the primary hazards (e.g., fall from height, electrical, struck-by, etc.).

3. **Predictive Incident Forecasting** - THIS IS YOUR MOST CRITICAL TASK:
   Based on the unique combination of hazards and real-time conditions, you will:
   a. Forecast the 2-3 most likely incidents or near-misses for today's work. Be specific (e.g., "Loss of control of glass panel during lift due to wind gust," not just "Struck-by hazard").
   b. For each forecast, detail the "Causal Chain": the step-by-step sequence of events and contributing factors (human, environmental, equipment) that would lead to the incident.
   c. Assign a Likelihood (Low, Medium, High) and potential Severity (Minor, Serious, Critical) to each forecasted incident.

4. **OSHA Compliance**: Briefly note any key OSHA standards relevant to the identified hazards.

5. **Actionable Recommendations**: Your recommendations must be prioritized to directly disrupt the Causal Chains you forecasted.

Please provide a comprehensive safety analysis using the following structure:

**WEATHER-DEPENDENT SAFETY ASSESSMENT**
- Current weather conditions and their direct impact on the day's tasks
- Specific weather-related stop-work criteria (e.g., "Cease all crane operations if wind gusts exceed 20 mph")

**PREDICTIVE INCIDENT FORECAST**
Forecast 1 (High Likelihood / Critical Severity): [Name of Predicted Incident]
- Causal Chain: [Step-by-step explanation of how this incident would happen]
- Likelihood: [Low/Medium/High]
- Severity: [Minor/Serious/Critical]

Forecast 2 (Medium Likelihood / Serious Severity): [Name of Predicted Incident]
- Causal Chain: [Step-by-step explanation of how this incident would happen]
- Likelihood: [Low/Medium/High]
- Severity: [Minor/Serious/Critical]

Forecast 3 (if applicable): [Name of Predicted Incident]
- Causal Chain: [Step-by-step explanation of how this incident would happen]
- Likelihood: [Low/Medium/High]
- Severity: [Minor/Serious/Critical]

**PRIORITIZED RECOMMENDATIONS TO PREVENT INCIDENTS**
Immediate Actions (To Disrupt Causal Chains):
- [Action 1, directly related to preventing Forecast 1]
- [Action 2, directly related to preventing Forecast 2]
- [Additional immediate actions as needed]

General PPE & Safety Measures:
- [General recommendations for PPE, equipment, procedures]

**EMERGENCY PREPAREDNESS**
- Weather-related emergency procedures
- Communication protocols
- Evacuation procedures

Format your response as a professional predictive safety report that a construction supervisor could use to prevent incidents before they occur.`;
}

export default router;
