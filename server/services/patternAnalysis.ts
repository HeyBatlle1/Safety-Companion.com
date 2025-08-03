// Big Picture Pattern Analysis Service - Google Gemini Powered
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google Gemini AI with server-side API key
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface PatternAnalysisResult {
  analysisId: string;
  timeframe: string;
  totalRecords: number;
  keyPatterns: {
    riskTrends: string[];
    behavioralPatterns: string[];
    complianceIssues: string[];
    departmentRisks: { department: string; riskLevel: string; issues: string[] }[];
    seasonalTrends: string[];
    emergingRisks: string[];
  };
  riskMetrics: {
    avgRiskScore: number;
    riskTrend: 'improving' | 'stable' | 'declining';
    highRiskPercentage: number;
    complianceScore: number;
    predictedIncidents: number;
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    trainingNeeds: string[];
  };
  actuarialData: {
    premiumRiskFactor: number;
    claimsLikelihood: number;
    costProjections: {
      expectedClaims: number;
      preventionInvestment: number;
      netSavings: number;
    };
  };
  exportTimestamp: string;
}

export class PatternAnalysisService {
  private model: any;

  constructor() {
    this.model = gemini.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  }

  /**
   * Analyze multiple analysis records for patterns (Monthly/Quarterly/Annual)
   * Supports both chat conversations and checklist assessments
   */
  async analyzeHistoricalPatterns(
    analysisRecords: any[],
    timeframe: 'monthly' | 'quarterly' | 'annual' | 'custom',
    customPeriod?: { start: Date; end: Date }
  ): Promise<PatternAnalysisResult> {
    const prompt = this.buildPatternAnalysisPrompt(analysisRecords, timeframe);

    try {
      const result = await this.model.generateContent({
        contents: prompt,
        generationConfig: {
          temperature: 0.2, // Low temperature for consistent analysis
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 2000,
          responseMimeType: "application/json"
        }
      });

      const analysis = JSON.parse(result.response.text());
      
      // Calculate additional metrics
      const processedAnalysis = this.enhanceAnalysisWithMetrics(analysis, analysisRecords);
      
      return {
        ...processedAnalysis,
        analysisId: `pattern_${Date.now()}`,
        timeframe: customPeriod ? 
          `${customPeriod.start.toISOString().split('T')[0]} to ${customPeriod.end.toISOString().split('T')[0]}` : 
          timeframe,
        totalRecords: analysisRecords.length,
        exportTimestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Pattern analysis error:', error);
      // Return fallback analysis
      return this.getFallbackAnalysis(analysisRecords, timeframe);
    }
  }

  /**
   * Build comprehensive prompt for pattern analysis
   */
  private buildPatternAnalysisPrompt(records: any[], timeframe: string): string {
    const recordsSample = records.slice(0, 100); // Analyze up to 100 most recent records
    
    return `
You are an expert safety analyst and insurance actuary. Analyze this collection of workplace safety interaction data to identify patterns, trends, and risks for insurance underwriting and safety improvement.

ANALYSIS TIMEFRAME: ${timeframe}
TOTAL RECORDS: ${records.length}
SAMPLE DATA: ${JSON.stringify(recordsSample, null, 2)}

Provide comprehensive pattern analysis in JSON format:

{
  "keyPatterns": {
    "riskTrends": ["trend1", "trend2", "trend3"],
    "behavioralPatterns": ["pattern1", "pattern2", "pattern3"],
    "complianceIssues": ["issue1", "issue2", "issue3"],
    "departmentRisks": [
      {
        "department": "Construction",
        "riskLevel": "high|medium|low",
        "issues": ["specific_issue1", "specific_issue2"]
      }
    ],
    "seasonalTrends": ["seasonal_pattern1", "seasonal_pattern2"],
    "emergingRisks": ["emerging_risk1", "emerging_risk2"]
  },
  "riskMetrics": {
    "avgRiskScore": 0-100,
    "riskTrend": "improving|stable|declining",
    "highRiskPercentage": 0-100,
    "complianceScore": 0-100,
    "predictedIncidents": 0-50
  },
  "recommendations": {
    "immediate": ["immediate_action1", "immediate_action2"],
    "shortTerm": ["short_term_action1", "short_term_action2"],
    "longTerm": ["long_term_strategy1", "long_term_strategy2"],
    "trainingNeeds": ["training_topic1", "training_topic2"]
  },
  "actuarialData": {
    "premiumRiskFactor": 0.5-3.0,
    "claimsLikelihood": 0-100,
    "costProjections": {
      "expectedClaims": 0-1000000,
      "preventionInvestment": 0-100000,
      "netSavings": 0-500000
    }
  }
}

Focus on:
1. Cross-record patterns and correlations
2. Risk escalation indicators
3. Behavioral changes over time
4. Department/role-specific risks
5. Training effectiveness gaps
6. Predictive indicators for incidents
7. Cost-benefit analysis for interventions
8. Insurance premium risk factors
9. Compliance trend analysis
10. Emerging safety concerns

Base all analysis on actual data patterns, not assumptions.
`;
  }

  /**
   * Enhance analysis with calculated metrics
   */
  private enhanceAnalysisWithMetrics(analysis: any, records: any[]): any {
    const riskScores = records.map(r => r.riskScore || 0).filter(score => score > 0);
    const complianceScores = records.map(r => r.complianceScore || 75).filter(score => score > 0);
    
    const avgRiskScore = riskScores.length > 0 ? 
      Math.round(riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length) : 25;
    
    const avgComplianceScore = complianceScores.length > 0 ?
      Math.round(complianceScores.reduce((sum, score) => sum + score, 0) / complianceScores.length) : 75;

    const highRiskCount = riskScores.filter(score => score >= 70).length;
    const highRiskPercentage = riskScores.length > 0 ? 
      Math.round((highRiskCount / riskScores.length) * 100) : 0;

    // Override calculated metrics
    analysis.riskMetrics = {
      ...analysis.riskMetrics,
      avgRiskScore,
      complianceScore: avgComplianceScore,
      highRiskPercentage,
      predictedIncidents: Math.round(avgRiskScore / 10) // Simple prediction model
    };

    // Enhanced actuarial data
    analysis.actuarialData = {
      ...analysis.actuarialData,
      premiumRiskFactor: 1.0 + (avgRiskScore - 50) / 100,
      claimsLikelihood: Math.min(100, avgRiskScore + highRiskPercentage / 2),
      costProjections: {
        expectedClaims: avgRiskScore * 1000 + highRiskCount * 5000,
        preventionInvestment: Math.round(avgRiskScore * 500),
        netSavings: Math.round((avgRiskScore * 1000) * 0.6) // 60% savings with prevention
      }
    };

    return analysis;
  }

  /**
   * Fallback analysis if AI fails
   */
  private getFallbackAnalysis(records: any[], timeframe: string): PatternAnalysisResult {
    const riskScores = records.map(r => r.riskScore || 0).filter(score => score > 0);
    const avgRiskScore = riskScores.length > 0 ? 
      Math.round(riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length) : 25;

    return {
      analysisId: `fallback_${Date.now()}`,
      timeframe,
      totalRecords: records.length,
      keyPatterns: {
        riskTrends: ['Consistent safety awareness', 'Standard compliance levels'],
        behavioralPatterns: ['Regular safety inquiries', 'Protocol adherence'],
        complianceIssues: ['Minor procedural gaps'],
        departmentRisks: [
          { department: 'General', riskLevel: 'medium', issues: ['Standard workplace hazards'] }
        ],
        seasonalTrends: ['Stable year-round performance'],
        emergingRisks: ['No significant emerging risks identified']
      },
      riskMetrics: {
        avgRiskScore,
        riskTrend: 'stable',
        highRiskPercentage: Math.round((riskScores.filter(s => s >= 70).length / Math.max(riskScores.length, 1)) * 100),
        complianceScore: 75,
        predictedIncidents: Math.round(avgRiskScore / 10)
      },
      recommendations: {
        immediate: ['Continue current safety protocols'],
        shortTerm: ['Regular safety training updates'],
        longTerm: ['Implement comprehensive safety program'],
        trainingNeeds: ['OSHA compliance', 'Emergency procedures']
      },
      actuarialData: {
        premiumRiskFactor: 1.0 + (avgRiskScore - 50) / 100,
        claimsLikelihood: avgRiskScore,
        costProjections: {
          expectedClaims: avgRiskScore * 1000,
          preventionInvestment: avgRiskScore * 500,
          netSavings: avgRiskScore * 600
        }
      },
      exportTimestamp: new Date().toISOString()
    };
  }

  /**
   * Generate executive summary for pattern analysis
   */
  async generateExecutiveSummary(patternAnalysis: PatternAnalysisResult): Promise<string> {
    try {
      const result = await this.model.generateContent([{
        role: "user",
        parts: [{
          text: `Create an executive summary for insurance and safety executives based on this safety pattern analysis:

Risk Score: ${patternAnalysis.riskMetrics.avgRiskScore}/100
Compliance Score: ${patternAnalysis.riskMetrics.complianceScore}%
High Risk Activities: ${patternAnalysis.riskMetrics.highRiskPercentage}%
Predicted Incidents: ${patternAnalysis.riskMetrics.predictedIncidents}
Premium Risk Factor: ${patternAnalysis.actuarialData.premiumRiskFactor}x

Key Patterns: ${patternAnalysis.keyPatterns.riskTrends.join(', ')}

Create a concise executive summary covering key findings, financial impact, and recommendations.`
        }]
      }]);

      return result.response.text();
    } catch (error) {
      console.error('Executive summary generation failed:', error);
      return `EXECUTIVE SUMMARY - SAFETY PATTERN ANALYSIS

Risk Assessment: Average risk score of ${patternAnalysis.riskMetrics.avgRiskScore}/100 with ${patternAnalysis.riskMetrics.highRiskPercentage}% high-risk activities identified.

Financial Impact: Projected annual claims of $${patternAnalysis.actuarialData.costProjections.expectedClaims.toLocaleString()} with potential savings of $${patternAnalysis.actuarialData.costProjections.netSavings.toLocaleString()} through prevention programs.

Key Recommendations: 
• ${patternAnalysis.recommendations.immediate.join('\n• ')}

Insurance Implications: Premium risk factor of ${patternAnalysis.actuarialData.premiumRiskFactor.toFixed(2)}x industry standard based on current risk profile.

Training Needs: ${patternAnalysis.recommendations.trainingNeeds.join(', ')}`;
    }
  }
}

export const patternAnalysisService = new PatternAnalysisService();