// Safety Companion API Integration Service
// Integrates with live OSHA data for real-time safety analysis

interface RiskProfile {
  industry: string;
  naics_code: string;
  injury_rate: number;
  fatalities_2023: number;
  risk_score: number;
  risk_category: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  recommendations: string[];
}

interface SafetyAnalysis {
  compliance_status: 'compliant' | 'requires_attention' | 'non_compliant';
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  specific_violations: string[];
  immediate_hazards: string[];
  corrective_actions: {
    action: string;
    priority: 'immediate' | 'high' | 'medium' | 'low';
    osha_standard: string;
    implementation_timeframe: string;
  }[];
  additional_recommendations: string[];
  insurance_risk_factors: string[];
  environmental_factors?: {
    weather_impact: string;
    site_conditions: string;
  };
}

class SafetyCompanionAPIService {
  private baseURL = import.meta.env.VITE_SAFETY_COMPANION_API_URL || 'https://safety-companion.up.railway.app';

  // Map checklist context to NAICS codes
  private getNAICSCode(checklistType: string, workType?: string): string {
    const naicsMapping: Record<string, string> = {
      'general-construction': '236',
      'residential-building': '2361',
      'nonresidential-building': '2362',
      'heavy-construction': '237',
      'roofing': '23816',
      'electrical': '23821',
      'plumbing': '23822',
      'excavation': '23891',
      'glass-installation': '23839',
      'fall-protection': '236', // General construction for fall protection
      'safety-assessment': '236'
    };

    return naicsMapping[checklistType] || '236'; // Default to general construction
  }

  async getRiskProfile(checklistType: string, workDetails?: any): Promise<RiskProfile | null> {
    try {
      const naicsCode = this.getNAICSCode(checklistType, workDetails?.work_type);
      
      const response = await fetch(`${this.baseURL}/risk-profile/${naicsCode}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // Silently fail and use local analysis
      return null;
    }
  }

  async analyzeChecklist(checklistData: any, riskProfile?: RiskProfile): Promise<SafetyAnalysis> {
    try {
      // If API is available, use it for enhanced analysis
      if (riskProfile) {
        return this.enhancedAnalysisWithOSHAData(checklistData, riskProfile);
      } else {
        // Fallback to local analysis with simulated intelligence
        return this.localIntelligentAnalysis(checklistData);
      }
    } catch (error) {
      // Fallback to local analysis on error
      return this.localIntelligentAnalysis(checklistData);
    }
  }

  private enhancedAnalysisWithOSHAData(checklistData: any, riskProfile: RiskProfile): SafetyAnalysis {
    const criticalResponses = this.extractCriticalResponses(checklistData);
    const riskFactors = this.calculateRiskFactors(criticalResponses, riskProfile);

    return {
      compliance_status: riskFactors.complianceIssues > 0 ? 'requires_attention' : 'compliant',
      risk_level: this.determineRiskLevel(riskFactors, riskProfile.risk_score),
      specific_violations: this.identifyOSHAViolations(criticalResponses, riskProfile),
      immediate_hazards: this.identifyImmediateHazards(criticalResponses, riskProfile),
      corrective_actions: this.generateCorrectiveActions(criticalResponses, riskProfile),
      additional_recommendations: [
        ...riskProfile.recommendations,
        ...this.generateContextualRecommendations(checklistData, riskProfile)
      ],
      insurance_risk_factors: this.assessInsuranceRisks(riskFactors, riskProfile),
      environmental_factors: this.analyzeEnvironmentalFactors(checklistData)
    };
  }

  private localIntelligentAnalysis(checklistData: any): SafetyAnalysis {
    const criticalResponses = this.extractCriticalResponses(checklistData);
    const riskFactors = this.calculateLocalRiskFactors(criticalResponses);

    return {
      compliance_status: riskFactors.complianceIssues > 0 ? 'requires_attention' : 'compliant',
      risk_level: riskFactors.riskScore > 70 ? 'high' : riskFactors.riskScore > 40 ? 'moderate' : 'low',
      specific_violations: this.identifyPotentialViolations(criticalResponses),
      immediate_hazards: this.identifyLocalHazards(criticalResponses),
      corrective_actions: this.generateLocalCorrectiveActions(criticalResponses),
      additional_recommendations: this.generateLocalRecommendations(checklistData),
      insurance_risk_factors: this.assessLocalInsuranceRisks(riskFactors)
    };
  }

  private extractCriticalResponses(checklistData: any) {
    const critical = [];
    
    for (const section of checklistData.sections) {
      for (const response of section.responses) {
        if (response.critical && (response.flagged || this.isHighRiskResponse(response.response))) {
          critical.push({
            question: response.question,
            response: response.response,
            notes: response.notes,
            section: section.title
          });
        }
      }
    }
    
    return critical;
  }

  private isHighRiskResponse(response: string): boolean {
    const highRiskKeywords = [
      'no protection', 'inadequate', 'unsafe', 'failed', 'overdue', 
      'not available', 'insufficient', 'above 25 mph', 'suspended',
      'high risk', 'critical issue', 'extreme', 'immediate danger'
    ];
    
    return highRiskKeywords.some(keyword => 
      response.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private calculateRiskFactors(criticalResponses: any[], riskProfile: RiskProfile) {
    return {
      complianceIssues: criticalResponses.length,
      riskScore: Math.min(100, (criticalResponses.length * 15) + (riskProfile.risk_score * 0.3)),
      fatalityRisk: riskProfile.fatalities_2023 > 50,
      injuryRate: riskProfile.injury_rate
    };
  }

  private calculateLocalRiskFactors(criticalResponses: any[]) {
    return {
      complianceIssues: criticalResponses.length,
      riskScore: Math.min(100, criticalResponses.length * 20),
      fatalityRisk: criticalResponses.length > 3,
      injuryRate: 3.2 // Industry average fallback
    };
  }

  private determineRiskLevel(riskFactors: any, oshaRiskScore: number): 'low' | 'moderate' | 'high' | 'critical' {
    if (oshaRiskScore > 80 || riskFactors.fatalityRisk) return 'critical';
    if (oshaRiskScore > 60 || riskFactors.complianceIssues > 2) return 'high';
    if (oshaRiskScore > 40 || riskFactors.complianceIssues > 0) return 'moderate';
    return 'low';
  }

  private identifyOSHAViolations(criticalResponses: any[], riskProfile: RiskProfile): string[] {
    const violations = [];
    
    for (const response of criticalResponses) {
      if (response.response.includes('no protection') || response.response.includes('inadequate')) {
        violations.push(`OSHA 1926.501 - Fall protection required: ${response.question}`);
      }
      if (response.response.includes('overdue') || response.response.includes('failed inspection')) {
        violations.push(`OSHA 1926.95 - Equipment inspection requirements: ${response.question}`);
      }
    }
    
    return violations;
  }

  private identifyPotentialViolations(criticalResponses: any[]): string[] {
    return criticalResponses.map(response => 
      `Potential compliance issue: ${response.question} - ${response.response}`
    );
  }

  private identifyImmediateHazards(criticalResponses: any[], riskProfile: RiskProfile): string[] {
    return criticalResponses
      .filter(response => this.isImmediateHazard(response.response))
      .map(response => `Immediate safety concern: ${response.question}`);
  }

  private identifyLocalHazards(criticalResponses: any[]): string[] {
    return criticalResponses
      .filter(response => this.isImmediateHazard(response.response))
      .map(response => `Safety concern requiring attention: ${response.question}`);
  }

  private isImmediateHazard(response: string): boolean {
    const immediateHazardKeywords = [
      'suspended', 'stopped', 'immediate danger', 'critical',
      'above 25 mph', 'no emergency plan', 'inadequate protection'
    ];
    
    return immediateHazardKeywords.some(keyword => 
      response.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private generateCorrectiveActions(criticalResponses: any[], riskProfile: RiskProfile) {
    const actions = [];
    
    for (const response of criticalResponses) {
      if (this.isImmediateHazard(response.response)) {
        actions.push({
          action: `Address critical safety issue: ${response.question}`,
          priority: 'immediate' as const,
          osha_standard: 'OSHA 1926.95',
          implementation_timeframe: 'Before work continues'
        });
      } else {
        actions.push({
          action: `Improve safety measures: ${response.question}`,
          priority: 'high' as const,
          osha_standard: 'OSHA 1926.95',
          implementation_timeframe: 'Within 24 hours'
        });
      }
    }
    
    return actions;
  }

  private generateLocalCorrectiveActions(criticalResponses: any[]) {
    return criticalResponses.map(response => ({
      action: `Address safety concern: ${response.question}`,
      priority: this.isImmediateHazard(response.response) ? 'immediate' as const : 'high' as const,
      osha_standard: 'Safety Standards Review Required',
      implementation_timeframe: this.isImmediateHazard(response.response) ? 'Immediately' : 'Within 24 hours'
    }));
  }

  private generateContextualRecommendations(checklistData: any, riskProfile: RiskProfile): string[] {
    const recommendations = [];
    
    if (riskProfile.injury_rate > 4.0) {
      recommendations.push('Enhanced safety training required due to high industry injury rate');
    }
    
    if (riskProfile.fatalities_2023 > 20) {
      recommendations.push('Implement additional fatality prevention measures');
    }
    
    return recommendations;
  }

  private generateLocalRecommendations(checklistData: any): string[] {
    return [
      'Conduct regular safety training sessions',
      'Implement comprehensive equipment inspection protocols',
      'Establish clear emergency response procedures'
    ];
  }

  private assessInsuranceRisks(riskFactors: any, riskProfile: RiskProfile): string[] {
    const risks = [];
    
    if (riskProfile.injury_rate > 3.5) {
      risks.push('Above-average injury rate may impact insurance premiums');
    }
    
    if (riskFactors.complianceIssues > 1) {
      risks.push('Multiple compliance issues increase liability exposure');
    }
    
    return risks;
  }

  private assessLocalInsuranceRisks(riskFactors: any): string[] {
    const risks = [];
    
    if (riskFactors.complianceIssues > 1) {
      risks.push('Multiple safety concerns may impact insurance coverage');
    }
    
    if (riskFactors.riskScore > 60) {
      risks.push('High risk score may affect future premiums');
    }
    
    return risks;
  }

  private analyzeEnvironmentalFactors(checklistData: any) {
    // Extract weather and environmental data from checklist responses
    let weatherImpact = 'Standard conditions';
    let siteConditions = 'Normal site conditions';
    
    for (const section of checklistData.sections) {
      for (const response of section.responses) {
        if (response.question.toLowerCase().includes('wind') && 
            response.response.includes('above 25 mph')) {
          weatherImpact = 'High wind conditions affecting operations';
        }
        if (response.question.toLowerCase().includes('height') && 
            parseInt(response.response) > 20) {
          siteConditions = 'High elevation work requiring enhanced precautions';
        }
      }
    }
    
    return { weather_impact: weatherImpact, site_conditions: siteConditions };
  }
}

export const safetyCompanionAPI = new SafetyCompanionAPIService();
export type { RiskProfile, SafetyAnalysis };