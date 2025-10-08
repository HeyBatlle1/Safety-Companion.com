import { GoogleGenAI } from '@google/genai';
import { WeatherAPIClient, WeatherData } from '../services/WeatherAPIClient';
import { GeoLocationService, SiteLocation } from '../services/GeoLocationService';
import { TaskScheduleManager, Task } from '../services/TaskScheduleManager';
import supabase from '../services/supabase';

interface SiteData {
  weather: WeatherData;
  forecast: WeatherData[];
  location: SiteLocation;
  tasks: Task[];
  recentIncidents: any[];
}

interface RiskAssessment {
  risks: {
    description: string;
    severity: number;
    probability: number;
    score: number;
    mitigation: string[];
    standards: string[];
  }[];
  recommendations: string[];
  requiredPPE: string[];
  weatherImpact: string[];
}

export class SafetyAgent {
  private genAI: GoogleGenAI;
  private weatherAPI: WeatherAPIClient;
  private geoService: GeoLocationService;
  private taskManager: TaskScheduleManager;

  constructor() {
    this.genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    this.weatherAPI = new WeatherAPIClient();
    this.geoService = new GeoLocationService();
    this.taskManager = new TaskScheduleManager(supabase);
  }

  async collectSiteData(siteId: string): Promise<SiteData> {
    try {
      // Get site location first
      const location = await this.geoService.getSiteInformation(siteId);
      
      // Fetch all data in parallel
      const [weather, forecast, tasks, incidents] = await Promise.all([
        this.weatherAPI.getCurrentConditions(location.latitude, location.longitude),
        this.weatherAPI.getForecast(location.latitude, location.longitude),
        this.taskManager.getScheduledTasks(siteId, new Date()),
        this.getRelevantIncidents(siteId, location.type)
      ]);

      return {
        weather,
        forecast,
        location,
        tasks,
        recentIncidents: incidents
      };
    } catch (error) {

      throw new Error('Failed to collect site data');
    }
  }

  private async getRelevantIncidents(siteId: string, siteType: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('safety_reports')
        .select('*')
        .eq('site_type', siteType)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    } catch (error) {

      return [];
    }
  }

  private preparePrompt(siteData: SiteData): string {
    return `You are a Construction Safety Risk Assessment AI assistant. Analyze the following site data and identify potential risks:

Site Location: ${siteData.location.name}
Address: ${siteData.location.address}
Site Type: ${siteData.location.type}

Current Weather:
- Temperature: ${siteData.weather.temperature}°C
- Humidity: ${siteData.weather.humidity}%
- Wind Speed: ${siteData.weather.windSpeed} km/h
- Conditions: ${siteData.weather.conditions}

Scheduled Tasks:
${siteData.tasks.map(task => `- ${task.type}: ${task.description}`).join('\n')}

Recent Incidents:
${siteData.recentIncidents.map(incident => `- ${incident.description}`).join('\n')}

Please provide:
1. Risk assessment for each identified hazard
2. Specific safety recommendations
3. Required PPE
4. Weather-related precautions

Format your response as a structured JSON object.`;
  }

  async generateRiskAssessment(siteId: string): Promise<RiskAssessment> {
    try {
      const siteData = await this.collectSiteData(siteId);
      const prompt = this.preparePrompt(siteData);
      
      const result = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: prompt }] }],
        thinkingConfig: {
          thinkingBudget: 0
        }
      });
      
      return this.parseResponse(result.response.text());
    } catch (error) {
      throw new Error('Failed to generate risk assessment');
    }
  }

  private parseResponse(response: string): RiskAssessment {
    try {
      // Extract JSON from response if wrapped in code blocks
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : response;
      
      return JSON.parse(jsonStr);
    } catch (error) {

      throw new Error('Failed to parse risk assessment response');
    }
  }
}