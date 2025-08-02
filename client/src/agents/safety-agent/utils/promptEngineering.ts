interface PromptContext {
  siteData: any;
  weatherData: any;
  taskData: any;
  historicalData: any;
}

export function generateSafetyPrompt(context: PromptContext): string {
  return `You are a Construction Safety Risk Assessment AI assistant specialized in identifying potential hazards and recommending safety measures. Analyze the following site conditions and provide a detailed safety assessment.

SITE INFORMATION:
${formatSiteData(context.siteData)}

CURRENT CONDITIONS:
${formatWeatherData(context.weatherData)}

SCHEDULED TASKS:
${formatTaskData(context.taskData)}

HISTORICAL CONTEXT:
${formatHistoricalData(context.historicalData)}

Focus exclusively on workplace safety risks and hazards. Provide practical safety recommendations based solely on the information provided.

Please provide a comprehensive safety assessment including:
1. Identified hazards and their risk levels
2. Required safety measures and PPE
3. Task-specific safety recommendations
4. Weather-related precautions
5. Emergency response considerations

Format your response as a structured JSON object following this schema:
{
  "risks": [
    {
      "hazard": string,
      "riskLevel": "low" | "medium" | "high" | "critical",
      "consequences": string[],
      "controlMeasures": string[]
    }
  ],
  "ppe": string[],
  "recommendations": string[],
  "emergencyProcedures": string[]
}`;
}

function formatSiteData(siteData: any): string {
  return `Location: ${siteData.name}
Type: ${siteData.type}
Current Activities: ${siteData.activities.join(', ')}
Site Restrictions: ${siteData.restrictions.join(', ')}`;
}

function formatWeatherData(weatherData: any): string {
  return `Temperature: ${weatherData.temperature}°C
Humidity: ${weatherData.humidity}%
Wind Speed: ${weatherData.windSpeed} km/h
Conditions: ${weatherData.conditions}
Forecast: ${weatherData.forecast}`;
}

function formatTaskData(taskData: any): string {
  return taskData.map((task: any) => 
    `- ${task.type}: ${task.description}
  Equipment: ${task.equipment.join(', ')}
  Personnel: ${task.personnel}
  Duration: ${task.duration}`
  ).join('\n\n');
}

function formatHistoricalData(historicalData: any): string {
  return `Recent Incidents: ${historicalData.recentIncidents}
Common Hazards: ${historicalData.commonHazards.join(', ')}
Previous Recommendations: ${historicalData.previousRecommendations.join(', ')}`;
}