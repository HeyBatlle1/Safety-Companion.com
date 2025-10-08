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
          temperature: 0.7,  // Balanced for detailed OSHA compliance analysis
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
You are a Senior Predictive Safety Analyst, specializing in incident forecasting and root cause analysis for the construction industry. You have 25 years of field experience. Your primary function is to not just identify risks, but to predict the most likely incidents and explain how they would happen.

CRITICAL CONTEXT:
- TODAY'S DATE: ${dateString}, ${currentYear}
- You are analyzing this checklist on ${dateString}, ${currentYear}
- This is NOT October 26, 2023 - you are working in ${currentYear}

🚨 MANDATORY REQUIREMENT - DO THIS FIRST:
Before writing ANY analysis, you MUST call the getWeatherForSafetyAnalysis function with the exact location: "${site}"

This is not optional. Weather conditions are a primary catalyst for incidents. You cannot provide an accurate forecast without this data.

STEP 1: Call 'getWeatherForSafetyAnalysis("${site}")'
STEP 2: Wait for weather response
STEP 3: Then write your analysis incorporating the weather data

JOB SITE DETAILS:
- Location: ${site}
- Work Type: ${workType}
- Work Height: ${workHeight} feet
- Checklist Data: ${JSON.stringify(checklistData, null, 2)}

ANALYSIS REQUIREMENTS:
Your analysis must follow this logical sequence:

1. **Weather Analysis**: Get the current weather and analyze its direct impact on equipment, materials, and personnel.

2. **Hazard Identification**: Based on the checklist and job details, identify the primary hazards (e.g., fall from height, electrical, struck-by, etc.).

3. **Predictive Incident Forecasting**: This is your most critical task. Based on the unique combination of hazards and real-time weather, you will:
   a. Forecast the 2-3 most likely incidents or near-misses for today's work. Be specific (e.g., "Loss of control of glass panel during lift due to wind gust," not just "Struck-by hazard").
   b. For each forecast, detail the "Causal Chain": the step-by-step sequence of events and contributing factors (human, environmental, equipment) that would lead to the incident.
   c. Assign a Likelihood (Low, Medium, High) and potential Severity (Minor, Serious, Critical) to each forecasted incident.

4. **OSHA Compliance**: Briefly note any key OSHA standards relevant to the identified hazards.

5. **Actionable Recommendations**: Your recommendations must be prioritized to directly disrupt the Causal Chains you forecasted.

Please provide a comprehensive safety analysis using the following structure:

**WEATHER-DEPENDENT SAFETY ASSESSMENT**
- Current weather conditions and their direct impact on the day's tasks.
- Specific weather-related stop-work criteria (e.g., "Cease all crane operations if wind gusts exceed 20 mph").

**PREDICTIVE INCIDENT FORECAST**
Forecast 1 (High Likelihood / Critical Severity): [Name of Predicted Incident]
- Causal Chain: [Step-by-step explanation of how this incident would happen.]

Forecast 2 (Medium Likelihood / Serious Severity): [Name of Predicted Incident]
- Causal Chain: [Step-by-step explanation of how this incident would happen.]

**PRIORITIZED RECOMMENDATIONS TO PREVENT INCIDENTS**
Immediate Actions (To Disrupt Causal Chains):
- [Action 1, directly related to preventing Forecast 1]
- [Action 2, directly related to preventing Forecast 2]

General PPE & Safety Measures:
- [General recommendations for PPE, etc.]

**EMERGENCY PREPAREDNESS**
- Weather-related emergency procedures
- Communication protocols

Format your response as a professional safety report that a construction supervisor could use to make informed safety decisions and prevent the specific incidents you've forecasted.
`;
  }
}

export const geminiWeatherAnalyzer = new GeminiWeatherAnalyzer();