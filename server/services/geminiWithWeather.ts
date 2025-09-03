import { GoogleGenerativeAI } from '@google/generative-ai';
import { getWeatherForSafetyAnalysis } from './weatherFunction';

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Gemini AI service with weather function calling capability
 * Automatically fetches weather data when analyzing safety checklists
 */
export class GeminiWeatherAnalyzer {
  private model;

  constructor() {
    // Define the weather function that Gemini can call
    const weatherFunction = {
      name: 'getWeatherForSafetyAnalysis',
      description: 'Get current weather conditions and safety recommendations for a specific job site location',
      parameters: {
        type: 'object' as const,
        properties: {
          location: {
            type: 'string' as const,
            description: 'The job site address or location (e.g., "123 Main St, Indianapolis, IN")',
          },
        },
        required: ['location'],
      },
    };

    this.model = gemini.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      tools: [
        {
          functionDeclarations: [weatherFunction],
        },
      ],
    });
  }

  /**
   * Analyze checklist with automatic weather integration
   * Gemini will automatically call the weather function when needed
   */
  async analyzeChecklistWithWeather(checklistData: any): Promise<string> {
    try {
      const prompt = this.buildChecklistAnalysisPrompt(checklistData);
      
      const chat = this.model.startChat({
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000,
        },
      });

      const result = await chat.sendMessage(prompt);
      
      // Handle function calls
      const response = result.response;
      const functionCalls = response.functionCalls();
      
      if (functionCalls && functionCalls.length > 0) {
        const functionResponses = [];
        
        for (const functionCall of functionCalls) {
          if (functionCall.name === 'getWeatherForSafetyAnalysis') {
            const location = functionCall.args?.location as string;
            console.log(`🌦️ Fetching weather data for: ${location}`);
            
            const weatherData = await getWeatherForSafetyAnalysis(location);
            
            functionResponses.push({
              name: functionCall.name,
              response: weatherData,
            });
          }
        }
        
        // Send function results back to Gemini
        const functionResult = await chat.sendMessage(
          functionResponses.map(fr => ({
            functionResponse: fr
          }))
        );
        
        return functionResult.response.text();
      }
      
      return response.text();
      
    } catch (error) {
      console.error('Gemini weather analysis error:', error);
      return `Safety analysis completed, but weather integration failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Build comprehensive prompt for checklist analysis
   * This prompt encourages Gemini to call the weather function automatically
   */
  private buildChecklistAnalysisPrompt(checklistData: any): string {
    const site = checklistData.responses?.site_location || checklistData.site_location || 'Unknown location';
    const workType = checklistData.responses?.project_type || checklistData.project_type || 'Construction work';
    const workHeight = checklistData.responses?.work_height || checklistData.work_height || 'Unknown height';
    
    // Force current date awareness
    const currentDate = new Date();
    const dateString = currentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });
    const currentYear = currentDate.getFullYear();
    
    return `
You are a professional safety analyst with expertise in OSHA compliance and construction safety. 

CRITICAL CONTEXT:
- TODAY'S DATE: ${dateString}, ${currentYear}
- You are analyzing this checklist on ${dateString}, ${currentYear}
- This is NOT October 26, 2023 - you are working in ${currentYear}

🚨 MANDATORY REQUIREMENT - DO THIS FIRST:
Before writing ANY analysis, you MUST call the getWeatherForSafetyAnalysis function with the exact location: "${site}"

This is not optional. Weather conditions directly impact construction safety (wind speeds for crane operations, temperature for PPE requirements, precipitation for slip hazards, etc.). You cannot provide accurate safety recommendations without current weather data.

STEP 1: Call getWeatherForSafetyAnalysis("${site}")
STEP 2: Wait for weather response  
STEP 3: Then write your analysis incorporating the weather data

JOB SITE DETAILS:
- Location: ${site}
- Work Type: ${workType}
- Work Height: ${workHeight} feet
- Checklist Data: ${JSON.stringify(checklistData, null, 2)}

ANALYSIS REQUIREMENTS:
1. **Weather Analysis**: Call the weather function to get current conditions for the job site location and factor weather into your safety recommendations
2. **Fall Protection**: Assess fall hazards based on work height and weather conditions
3. **Electrical Safety**: Evaluate electrical risks considering weather and site conditions
4. **General Hazards**: Identify all site-specific safety concerns
5. **OSHA Compliance**: Ensure all recommendations meet current OSHA standards

Please provide a comprehensive safety analysis that includes:

**WEATHER-DEPENDENT SAFETY ASSESSMENT**
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
- Weather-related emergency procedures
- Evacuation considerations
- Communication protocols

Format your response as a professional safety report that a construction supervisor could use to make informed safety decisions.
`;
  }
}

export const geminiWeatherAnalyzer = new GeminiWeatherAnalyzer();