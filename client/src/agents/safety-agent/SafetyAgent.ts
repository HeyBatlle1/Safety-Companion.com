import { DataCollector } from './DataCollector';
import { RiskProcessor } from './RiskProcessor';
import { SafetyConnector } from './GeminiConnector';
import { DatabaseHandler } from './DatabaseHandler';
import { saveAnalysisToHistory } from '../../services/history';
import { SiteData, RiskAssessment } from '../../types/safety';
import { triggerBoltSafetyAssessment } from '../../services/multiAgent';

export class SafetyAgent {
  private dataCollector: DataCollector;
  private riskProcessor: RiskProcessor;
  private safetyConnector: SafetyConnector;
  private dbHandler: DatabaseHandler;

  constructor() {
    this.dataCollector = new DataCollector();
    this.riskProcessor = new RiskProcessor();
    this.safetyConnector = new SafetyConnector();
    this.dbHandler = new DatabaseHandler();
  }

  async generateRiskAssessment(siteId: string): Promise<RiskAssessment> {
    try {
      // Collect site data
      const siteData = await this.dataCollector.collectSiteData(siteId);
      
      // Process risks
      const processedData = this.riskProcessor.processSiteData(siteData);
      
      // Generate assessment using Gemini
      const prompt = this.riskProcessor.preparePrompt(processedData);
      
      let response;
      try {
        response = await this.safetyConnector.generateContent(prompt);
      } catch (aiError) {
        
        return this.getFallbackAssessment();
      }
      
      // Parse initial assessment
      let initialAssessment;
      try {
        initialAssessment = this.riskProcessor.parseResponse(response.response.text());
      } catch (parseError) {
        
        return this.getFallbackAssessment();
      }

      // Save to analysis history
      try {
        await saveAnalysisToHistory({
          query: prompt,
          response: response.response.text(),
          type: 'risk_assessment',
          metadata: {
            siteId,
            model: this.safetyConnector.getModelConfig().model,
            temperature: this.safetyConnector.getModelConfig().temperature,
            maxTokens: this.safetyConnector.getModelConfig().maxTokens
          }
        });
      } catch (historyError) {
        
      }

      // Enhance with multi-agent assessment
      const enhancedAssessment = await this.getEnhancedAssessment(siteData, initialAssessment);
      
      // Save combined assessment
      try {
        await this.dbHandler.saveRiskAssessment(siteId, enhancedAssessment);
      } catch (dbError) {
        
      }
      
      return enhancedAssessment;
    } catch (error) {
      
      return this.getFallbackAssessment();
    }
  }

  private async getEnhancedAssessment(siteData: SiteData, initialAssessment: RiskAssessment): Promise<RiskAssessment> {
    try {
      const multiAgentResult = await triggerBoltSafetyAssessment({
        location: siteData.location.address,
        constructionType: siteData.location.type,
        currentActivities: siteData.tasks.map(t => t.description).join(', '),
        safetyData: initialAssessment
      });

      if (multiAgentResult.error) {
        
        return initialAssessment;
      }

      // Combine assessments
      return {
        ...initialAssessment,
        risks: [
          ...initialAssessment.risks,
          ...(multiAgentResult.additionalRisks || [])
        ],
        recommendations: [
          ...initialAssessment.recommendations,
          ...(multiAgentResult.additionalRecommendations || [])
        ],
        requiredPPE: [
          ...new Set([
            ...initialAssessment.requiredPPE,
            ...(multiAgentResult.additionalPPE || [])
          ])
        ],
        weatherImpact: [
          ...initialAssessment.weatherImpact,
          ...(multiAgentResult.additionalWeatherImpacts || [])
        ]
      };
    } catch (error) {
      
      return initialAssessment;
    }
  }

  private getFallbackAssessment(): RiskAssessment {
    return {
      risks: [
        {
          description: "Working at height",
          severity: 8,
          probability: 6,
          score: 48,
          mitigation: ["Use proper fall protection", "Inspect scaffolding daily", "Conduct toolbox talks on fall hazards"],
          standards: ["OSHA 1926.500-503", "ANSI Z359"]
        },
        {
          description: "Heavy material handling",
          severity: 6,
          probability: 7,
          score: 42,
          mitigation: ["Use mechanical lifting aids", "Implement proper lifting techniques", "Team lifting for heavy items"],
          standards: ["OSHA 1926.251", "ASME B30"]
        }
      ],
      recommendations: [
        "Establish clear communication protocols",
        "Conduct daily safety briefings",
        "Implement a site-specific safety plan",
        "Ensure all workers are properly trained",
        "Regular equipment inspections"
      ],
      requiredPPE: [
        "Hard hat",
        "Safety glasses",
        "High-visibility vest",
        "Steel-toed boots",
        "Cut-resistant gloves"
      ],
      weatherImpact: [
        "Suspend outdoor work during lightning",
        "Provide additional breaks during high heat conditions",
        "Ensure proper traction devices during icy conditions"
      ]
    };
  }

  async getRecentAssessments(siteId: string): Promise<RiskAssessment[]> {
    try {
      return await this.dbHandler.getRecentAssessments(siteId);
    } catch (error) {
      
      return [];
    }
  }

  async analyzeSafetyReport(report: any): Promise<any> {
    try {
      const prompt = this.riskProcessor.prepareSafetyReportPrompt(report);
      
      let response;
      try {
        response = await this.safetyConnector.generateContent(prompt);
      } catch (aiError) {
        
        return this.getFallbackReportAnalysis(report);
      }
      
      // Save to analysis history
      try {
        await saveAnalysisToHistory({
          query: JSON.stringify(report),
          response: response.response.text(),
          type: 'safety_assessment',
          metadata: {
            reportType: report.type,
            severity: report.severity,
            model: this.safetyConnector.getModelConfig().model,
            temperature: this.safetyConnector.getModelConfig().temperature
          }
        });
      } catch (historyError) {
        
      }
      
      try {
        return this.riskProcessor.parseSafetyReportResponse(response.response.text());
      } catch (parseError) {
        
        return this.getFallbackReportAnalysis(report);
      }
    } catch (error) {
      
      return this.getFallbackReportAnalysis(report);
    }
  }

  private getFallbackReportAnalysis(report: any): any {
    return {
      riskAnalysis: {
        primaryHazards: [
          "Potential fall hazard",
          "Material handling risk"
        ],
        secondaryRisks: [
          "Environmental exposure",
          "Equipment malfunction"
        ]
      },
      immediateActions: [
        "Secure the area",
        "Document conditions with photos",
        "Notify supervisor"
      ],
      preventiveMeasures: [
        "Conduct safety training refresher",
        "Review standard operating procedures",
        "Implement additional safety checks"
      ],
      followUpRecommendations: [
        "Schedule safety committee review",
        "Update risk assessment",
        "Monitor conditions for 30 days"
      ]
    };
  }
}