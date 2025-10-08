// Insurance Analytics Service - Google Gemini Powered
import { GoogleGenAI } from "@google/genai";

// Initialize Google Gemini AI (Google AI Studio)
const gemini = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

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

interface CompanyRiskProfile {
  companyId: string;
  industryCode: string;
  avgRiskScore: number;
  incidentRate: number;
  complianceScore: number;
  predictedIncidents: number;
  insurancePremiumFactor: number;
}

export class InsuranceAnalyticsService {
  private model: any;

  constructor() {
    // Model initialized inline for each request
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
      const result = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3, // Lower temperature for consistent risk assessment
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 1000,
          responseMimeType: "application/json"
        },
        thinkingConfig: {
          thinkingBudget: 0
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
      const result = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 1000,
          responseMimeType: "application/json"
        },
        thinkingConfig: {
          thinkingBudget: 0
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
   * Generate company-wide risk profile for insurance companies
   */
  async generateCompanyRiskProfile(
    companyData: {
      companyId: string;
      industryCode: string;
      totalEmployees: number;
      analysisHistory: any[];
      safetyReports: any[];
      behaviorData: any[];
    }
  ): Promise<CompanyRiskProfile> {
    const prompt = `
As an insurance underwriter AI, analyze this company's safety data to create a risk profile:

COMPANY DATA:
- Company ID: ${companyData.companyId}
- Industry: ${companyData.industryCode}
- Employees: ${companyData.totalEmployees}
- Analysis Records: ${companyData.analysisHistory.length}
- Safety Reports: ${companyData.safetyReports.length}

RECENT ANALYSIS HISTORY:
${JSON.stringify(companyData.analysisHistory.slice(-20), null, 2)}

SAFETY REPORTS:
${JSON.stringify(companyData.safetyReports.slice(-10), null, 2)}

BEHAVIOR PATTERNS:
${JSON.stringify(companyData.behaviorData, null, 2)}

Generate insurance risk profile JSON:

{
  "companyId": "${companyData.companyId}",
  "industryCode": "${companyData.industryCode}",
  "avgRiskScore": 1-100 (company average risk),
  "incidentRate": 0-50 (incidents per 100k work hours),
  "complianceScore": 0-100 (overall OSHA compliance),
  "predictedIncidents": 0-100 (expected incidents next 12 months),
  "insurancePremiumFactor": 0.5-3.0 (premium multiplier vs industry average),
  "riskFactors": {
    "highRiskDepartments": ["dept1", "dept2"],
    "trainingGaps": ["topic1", "topic2"],
    "behaviorConcerns": ["pattern1", "pattern2"],
    "equipmentRisks": ["equipment1", "equipment2"]
  },
  "recommendations": {
    "trainingNeeds": ["safety_program1", "safety_program2"],
    "equipmentUpgrades": ["upgrade1", "upgrade2"],
    "policyChanges": ["policy1", "policy2"]
  }
}

Base analysis on:
- Employee risk behavior patterns
- Incident frequency and severity
- Safety training engagement
- Compliance with regulations
- Industry benchmarks
`;

    try {
      const result = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1, // Very low for consistent risk assessment
          topK: 1,
          topP: 0.7,
          maxOutputTokens: 1500,
          responseMimeType: "application/json"
        },
        thinkingConfig: {
          thinkingBudget: 0
        }
      });

      const profile = JSON.parse(result.response.text());
      return profile as CompanyRiskProfile;
    } catch (error) {
      console.error('Company risk profile error:', error);
      return {
        companyId: companyData.companyId,
        industryCode: companyData.industryCode,
        avgRiskScore: 50,
        incidentRate: 2,
        complianceScore: 75,
        predictedIncidents: 3,
        insurancePremiumFactor: 1.0
      };
    }
  }

  /**
   * Save analysis to database for insurance data aggregation
   */
  async saveInsuranceAnalysis(
    userId: string,
    query: string,
    response: string,
    type: 'chat_response' | 'sds_analysis',
    analysis: RiskAnalysis
  ): Promise<void> {
    try {
      await fetch('/api/analytics/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          query,
          response,
          type,
          riskScore: analysis.riskScore,
          sentimentScore: analysis.sentimentScore,
          urgencyLevel: analysis.urgencyLevel,
          safetyCategories: analysis.safetyCategories,
          keywordTags: analysis.keywordTags,
          confidenceScore: analysis.confidenceScore,
          behaviorIndicators: analysis.behaviorIndicators,
          complianceScore: analysis.complianceScore,
          metadata: {
            insuranceFactors: analysis.insuranceFactors,
            analysisTimestamp: new Date().toISOString()
          }
        })
      });
    } catch (error) {
      console.error('Failed to save insurance analysis:', error);
    }
  }
}

export const insuranceAnalytics = new InsuranceAnalyticsService();