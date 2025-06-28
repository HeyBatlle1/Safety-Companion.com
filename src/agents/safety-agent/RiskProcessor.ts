import { SiteData, RiskAssessment } from '../../types/safety';

export class RiskProcessor {
  processSiteData(siteData: SiteData): any {
    // Process and structure site data for risk assessment
    return {
      ...siteData,
      processedTasks: this.processTasks(siteData.tasks),
      weatherRisks: this.assessWeatherRisks(siteData.weather, siteData.forecast),
      historicalRisks: this.analyzeHistoricalIncidents(siteData.recentIncidents)
    };
  }

  preparePrompt(processedData: any): string {
    // Create a structured data object for the AI
    const aiData = {
      location: {
        name: processedData.location.name,
        address: processedData.location.address,
        type: processedData.location.type
      },
      currentConditions: {
        weather: {
          temperature: processedData.weather.temperature,
          humidity: processedData.weather.humidity,
          windSpeed: processedData.weather.windSpeed,
          conditions: processedData.weather.conditions
        },
        tasks: processedData.processedTasks.map((task: any) => ({
          type: task.type,
          description: task.description,
          riskLevel: task.riskLevel
        })),
        identifiedRisks: {
          weather: processedData.weatherRisks,
          historical: processedData.historicalRisks
        }
      }
    };

    // Create a focused prompt for workplace safety assessment
    return `You are a Construction Safety Risk Assessment AI assistant specialized in workplace safety, particularly for high-rise glass installation and curtain wall systems. Analyze the following site data and provide a comprehensive safety assessment:

${JSON.stringify(aiData, null, 2)}

Provide a detailed safety analysis in JSON format with the following structure:
{
  "risks": [
    {
      "hazard": "string",
      "severity": "high" | "medium" | "low",
      "probability": "high" | "medium" | "low",
      "impact": "string",
      "mitigation": ["string"]
    }
  ],
  "recommendations": ["string"],
  "requiredPPE": ["string"],
  "emergencyProcedures": ["string"],
  "weatherConsiderations": ["string"],
  "summary": "string"
}

Focus exclusively on workplace safety considerations, particularly those relevant to glass installation at height.`;
  }

  parseResponse(response: string): RiskAssessment {
    try {
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : response;
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error('Failed to parse risk assessment response');
    }
  }

  prepareSafetyReportPrompt(report: any): string {
    const reportData = {
      type: report.type,
      description: report.description,
      severity: report.severity,
      location: report.location,
      context: {
        workType: 'Glass Installation and Curtain Wall Systems',
        heightWork: true,
        specializedEquipment: true
      }
    };

    return `You are a construction safety expert specializing in high-rise glass installation. Analyze this safety report and provide recommendations:

${JSON.stringify(reportData, null, 2)}

Provide a structured JSON response with:
{
  "riskAnalysis": {
    "primaryHazards": ["string"],
    "secondaryRisks": ["string"]
  },
  "immediateActions": ["string"],
  "preventiveMeasures": ["string"],
  "followUpRecommendations": ["string"]
}

Focus on glass handling, fall protection, and public safety considerations.`;
  }

  parseSafetyReportResponse(response: string): any {
    try {
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : response;
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error parsing safety report response:', error);
      throw new Error('Failed to parse safety report response');
    }
  }

  private processTasks(tasks: any[]): any[] {
    return tasks.map(task => ({
      ...task,
      riskLevel: this.calculateTaskRiskLevel(task)
    }));
  }

  private assessWeatherRisks(currentWeather: any, forecast: any[]): any[] {
    const risks = [];

    // Check temperature risks
    if (currentWeather.temperature > 30) {
      risks.push({
        type: 'heat',
        description: 'High temperature risk - heat stress possible',
        severity: 'high'
      });
    }

    // Check wind risks - adjusted for glass installation
    if (currentWeather.windSpeed > 20) {
      risks.push({
        type: 'wind',
        description: 'High wind risk - unsafe for glass handling',
        severity: 'high'
      });
    }

    // Check humidity for glass handling
    if (currentWeather.humidity > 85) {
      risks.push({
        type: 'humidity',
        description: 'High humidity - potential impact on grip and visibility',
        severity: 'medium'
      });
    }

    return risks;
  }

  private analyzeHistoricalIncidents(incidents: any[]): any[] {
    const riskPatterns = new Map();
    
    incidents.forEach(incident => {
      const key = `${incident.type}-${incident.location}`;
      if (!riskPatterns.has(key)) {
        riskPatterns.set(key, {
          count: 0,
          description: `Recurring ${incident.type} incidents at ${incident.location}`
        });
      }
      riskPatterns.get(key).count++;
    });

    return Array.from(riskPatterns.values())
      .filter(pattern => pattern.count > 1)
      .map(pattern => ({
        ...pattern,
        severity: pattern.count > 3 ? 'high' : 'medium'
      }));
  }

  private calculateTaskRiskLevel(task: any): string {
    const riskFactors = {
      height: task.type.includes('glass') || task.type.includes('curtain wall'),
      lifting: task.type.includes('lift') || task.type.includes('hoist'),
      publicExposure: task.type.includes('facade') || task.type.includes('exterior'),
      equipment: task.type.includes('crane') || task.type.includes('scaffold')
    };

    const riskScore = Object.values(riskFactors).filter(Boolean).length;
    
    if (riskScore >= 3) return 'high';
    if (riskScore >= 1) return 'medium';
    return 'low';
  }
}