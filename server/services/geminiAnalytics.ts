// Server-side Google Gemini Insurance Analytics Service
import { GoogleGenerativeAI } from "@google/generative-ai";
import { trackAIAnalysis } from './silentTracking';

// Initialize Google Gemini AI with server-side API key
const gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

interface RiskAnalysis {
  riskScore: number; // 1-100
  sentimentScore: number; // -100 to 100
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  safetyCategories: string[];
  keywordTags: string[];
  confidenceScore: number; // 0-100
  behaviorIndicators: string[];
  complianceScore: number; // 0-100
  insuranceFactors: {
    premiumRiskFactor: number;
    predictedIncidentLikelihood: number;
    costImpactEstimate: number;
  };
}

export class GeminiInsuranceAnalytics {
  private model: any;

  constructor() {
    this.model = gemini.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  }

  /**
   * Analyze chat interactions for insurance risk patterns
   */
  async analyzeChatForInsurance(
    query: string, 
    response: string, 
    userContext?: {
      role?: string;
      department?: string;
      experienceLevel?: number;
    }
  ): Promise<RiskAnalysis> {
    // Phase 1 Silent Tracking: Wrap AI analysis with performance monitoring
    return await trackAIAnalysis(
      'insurance_risk_analysis',
      async () => {
    const prompt = `
As an insurance risk assessment AI, analyze this workplace safety conversation for insurance risk indicators:

QUERY: "${query}"
RESPONSE: "${response}"

USER CONTEXT:
- Role: ${userContext?.role || 'Unknown'}
- Department: ${userContext?.department || 'Unknown'} 
- Experience: ${userContext?.experienceLevel || 0} years

Analyze and provide JSON response with these insurance-critical metrics:

{
  "riskScore": 1-100 (higher = more dangerous behavior/situations),
  "sentimentScore": -100 to 100 (negative = concerning attitude),
  "urgencyLevel": "low|medium|high|critical",
  "safetyCategories": ["fall_protection", "chemical_exposure", "equipment_safety", etc.],
  "keywordTags": ["accident_prone", "non_compliant", "safety_conscious", etc.],
  "confidenceScore": 0-100 (confidence in this analysis),
  "behaviorIndicators": ["ignores_protocols", "asks_good_questions", "reports_hazards", etc.],
  "complianceScore": 0-100 (OSHA compliance understanding),
  "insuranceFactors": {
    "premiumRiskFactor": 0.5-3.0 (multiplier for insurance premiums),
    "predictedIncidentLikelihood": 0-100 (% chance of incident in next 12 months),
    "costImpactEstimate": 0-1000000 (estimated cost if incident occurs)
  }
}

Focus on:
- Signs of risk-taking behavior
- Safety protocol compliance
- Knowledge gaps
- Attitude toward safety
- Potential for costly incidents
`;

    try {
      const result = await this.model.generateContent({
        contents: prompt,
        generationConfig: {
          temperature: 1.0,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 1000,
          responseMimeType: "application/json"
        }
      });

      const analysis = JSON.parse(result.response.text());
      return analysis as RiskAnalysis;
    } catch (error) {
      console.error('Insurance analytics error:', error);
      // Return default low-risk analysis if AI fails  
      return {
        riskScore: 25,
        sentimentScore: 0,
        urgencyLevel: 'low',
        safetyCategories: ['general'],
        keywordTags: ['routine_inquiry'],
        confidenceScore: 50,
        behaviorIndicators: ['standard_behavior'],
        complianceScore: 75,
        insuranceFactors: {
          premiumRiskFactor: 1.0,
          predictedIncidentLikelihood: 5,
          costImpactEstimate: 1000
        }
      };
    }
      },
      {
        queryLength: query.length,
        responseLength: response.length,
        userRole: userContext?.role,
        userDepartment: userContext?.department
      }
    );
  }

  /**
   * Analyze SDS (Safety Data Sheet) interactions for chemical risk assessment
   */
  async analyzeSdsForInsurance(
    chemicalName: string,
    userQuery: string,
    sdsData: any,
    userContext?: {
      role?: string;
      department?: string;
      experienceLevel?: number;
    }
  ): Promise<RiskAnalysis> {
    const prompt = `
As an insurance risk analyst, evaluate this chemical safety interaction:

CHEMICAL: ${chemicalName}
USER QUERY: "${userQuery}"
SDS DATA: ${JSON.stringify(sdsData, null, 2)}

USER CONTEXT:
- Role: ${userContext?.role || 'Unknown'}
- Department: ${userContext?.department || 'Unknown'}
- Experience: ${userContext?.experienceLevel || 0} years

Analyze for insurance risk factors and provide JSON response:

{
  "riskScore": 1-100 (chemical exposure risk level),
  "sentimentScore": -100 to 100 (user's safety awareness),
  "urgencyLevel": "low|medium|high|critical",
  "safetyCategories": ["chemical_exposure", "respiratory_hazard", "skin_contact", etc.],
  "keywordTags": ["hazmat_trained", "ppe_compliant", "exposure_risk", etc.],
  "confidenceScore": 0-100,
  "behaviorIndicators": ["proper_ppe_usage", "follows_protocols", "chemical_knowledge", etc.],
  "complianceScore": 0-100 (chemical safety compliance),
  "insuranceFactors": {
    "premiumRiskFactor": 0.8-5.0 (chemical work = higher premiums),
    "predictedIncidentLikelihood": 0-100,
    "costImpactEstimate": 0-5000000 (chemical incidents are expensive)
  }
}

Focus on:
- Chemical hazard severity
- User's safety knowledge
- Proper handling procedures
- PPE compliance
- Long-term health impact potential
`;

    try {
      const result = await this.model.generateContent({
        contents: prompt,
        generationConfig: {
          temperature: 1.0,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 1000,
          responseMimeType: "application/json"
        }
      });

      const analysis = JSON.parse(result.response.text());
      return analysis as RiskAnalysis;
    } catch (error) {
      console.error('SDS insurance analytics error:', error);
      return {
        riskScore: 50,
        sentimentScore: 0,
        urgencyLevel: 'medium',
        safetyCategories: ['chemical_exposure'],
        keywordTags: ['chemical_work'],
        confidenceScore: 50,
        behaviorIndicators: ['standard_chemical_handling'],
        complianceScore: 75,
        insuranceFactors: {
          premiumRiskFactor: 1.5,
          predictedIncidentLikelihood: 15,
          costImpactEstimate: 50000
        }
      };
    }
  }

  /**
   * Enhanced safety chat analysis with OSHA integration
   */
  async analyzeGeneralSafetyQuery(
    query: string,
    context: {
      department?: string;
      jobSite?: string;
      weatherConditions?: string;
    }
  ): Promise<RiskAnalysis> {
    const prompt = `
As a workplace safety AI with OSHA expertise, analyze this safety inquiry:

QUERY: "${query}"
CONTEXT:
- Department: ${context.department || 'Unknown'}
- Job Site: ${context.jobSite || 'Unknown'}
- Weather: ${context.weatherConditions || 'Unknown'}

Provide detailed insurance risk analysis as JSON:

{
  "riskScore": 1-100,
  "sentimentScore": -100 to 100,
  "urgencyLevel": "low|medium|high|critical",
  "safetyCategories": ["fall_protection", "electrical", "confined_space", "lockout_tagout", etc.],
  "keywordTags": ["osha_violation", "safety_conscious", "emergency_response", etc.],
  "confidenceScore": 0-100,
  "behaviorIndicators": ["proactive_safety", "risk_awareness", "compliance_focused", etc.],
  "complianceScore": 0-100,
  "insuranceFactors": {
    "premiumRiskFactor": 0.5-3.0,
    "predictedIncidentLikelihood": 0-100,
    "costImpactEstimate": 0-1000000
  }
}

Consider:
- OSHA regulation compliance
- Industry-specific hazards
- Environmental factors
- Training requirements
- Emergency preparedness
`;

    try {
      const result = await this.model.generateContent({
        contents: prompt,
        generationConfig: {
          temperature: 1.0,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 1000,
          responseMimeType: "application/json"
        }
      });

      return JSON.parse(result.response.text()) as RiskAnalysis;
    } catch (error) {
      console.error('General safety analytics error:', error);
      return {
        riskScore: 30,
        sentimentScore: 10,
        urgencyLevel: 'low',
        safetyCategories: ['general_safety'],
        keywordTags: ['standard_inquiry'],
        confidenceScore: 60,
        behaviorIndicators: ['routine_safety_question'],
        complianceScore: 80,
        insuranceFactors: {
          premiumRiskFactor: 1.0,
          predictedIncidentLikelihood: 8,
          costImpactEstimate: 5000
        }
      };
    }
  }
}

export const geminiAnalytics = new GeminiInsuranceAnalytics();