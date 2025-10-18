// types/safety-analysis.ts

export interface ReportMetadata {
  reportId: string;
  generatedAt: Date;
  projectName: string;
  location: string;
  workType: string;
  supervisor: string;
}

export interface GoNoGoDecision {
  decision: 'GO' | 'CONDITIONAL_GO' | 'NO_GO' | 'STOP_WORK';
  basis: {
    highestRiskScore: number;
    criticalGapsCount: number;
    weatherSeverity: 'NORMAL' | 'ELEVATED' | 'EXTREME';
    regulatoryViolations: number;
    emergencyReadiness: boolean;
  };
  conditions?: string[];
  timeRestriction?: string;
}

export interface Agent1Output {
  qualityScore: number;
  dataQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  missingCritical: string[];
  insufficientResponses?: Array<{
    field: string;
    issue: string;
  }>;
  weatherPresent: boolean;
  weatherRisks?: string[];
  concerns: {
    CRITICAL?: string[];
    HIGH?: string[];
    MEDIUM?: string[];
    LOW?: string[];
  };
  tradeSpecificGaps?: string[];
  recommendedAction: 'PROCEED' | 'REQUEST_CLARIFICATION' | 'REJECT_UNSAFE';
}

export interface Hazard {
  name: string;
  category: 'Falls' | 'Struck-By' | 'Electrocution' | 'Caught-Between' | 'Other';
  probability: number;
  probabilityCalculation?: {
    base: number;
    hazardMultiplier: number;
    controlMultiplier: number;
    weatherMultiplier: number;
    experienceMultiplier: number;
    final: number;
  };
  consequence: 'Fatal' | 'Critical' | 'Serious' | 'Minor';
  riskScore: number;
  riskLevel: 'EXTREME' | 'HIGH' | 'MEDIUM' | 'LOW';
  oshaContext: string;
  inadequateControls: string[];
  recommendedControls: string[];
  regulatoryRequirement?: string;
}

export interface Agent2Output {
  riskSummary: {
    overallRiskLevel: 'EXTREME' | 'HIGH' | 'MEDIUM' | 'LOW';
    highestRiskScore: number;
    industryContext: string;
  };
  hazards: Hazard[];
  topThreats: string[];
  weatherImpact?: string;
  immediateActions?: string[];
}

export interface Agent3Output {
  incidentName: string;
  timeframe: string;
  probability: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  causalChain: Array<{
    stage: string;
    description: string;
    evidence?: string;
    why?: string;
    errorType?: string;
    timeToIntervene?: string;
    severity?: string;
    failureMode?: string;
    whyItFails?: string;
    physicalMechanism?: string;
    energyType?: string;
    energyMagnitude?: string;
    bodyPart?: string;
    expectedBarrier?: string;
    timeToRecognize?: string;
    fatigueLevel?: string;
    [key: string]: any;
  }>;
  leadingIndicators: Array<{
    type: 'Behavioral' | 'Environmental' | 'Organizational' | 'Near-Miss';
    indicator: string;
    whereToLook: string;
    whatToSee: string;
    threshold: string;
    actionRequired: string;
  }>;
  interventions: {
    preventive: Array<{
      tier: 'Elimination' | 'Engineering' | 'Administrative' | 'PPE';
      action: string;
      breaksChainAt: string;
      feasibility: 'HIGH' | 'MEDIUM' | 'LOW';
      timeToImplement: string;
      cost: 'LOW' | 'MEDIUM' | 'HIGH';
      effectivenessReduction: string;
    }>;
    mitigative: Array<{
      action: string;
      reducesHarm: string;
    }>;
    recommended: string;
  };
  oshaPatternMatch?: {
    similarIncidents: number;
    matchConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
    citationsExpected: string[];
  };
}

export interface Agent4Output {
  metadata: ReportMetadata;
  executiveSummary: {
    decision: GoNoGoDecision;
    overallRiskLevel: string;
    topThreats: string[];
    criticalActions: string[];
    incidentProbability: number;
  };
  dataQuality: {
    score: number;
    rating: string;
    missingCritical: string[];
    concerns: Agent1Output['concerns'];
  };
  riskAssessment: {
    hazards: Hazard[];
    industryContext: string;
    oshaStatistics: any;
  };
  incidentPrediction: {
    scenario: string;
    probability: number;
    timeframe: string;
    causalChain: Agent3Output['causalChain'];
    leadingIndicators: Agent3Output['leadingIndicators'];
  };
  weatherAnalysis?: any;
  complianceGaps?: any[];
  emergencyReadiness?: any;
  actionItems?: any[];
  recommendedInterventions: Agent3Output['interventions'];
  approvals?: {
    requiredSignatures: string[];
    competentPersonReview: boolean;
    managementReview: boolean;
  };
}
