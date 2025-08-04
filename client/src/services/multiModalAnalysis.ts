import { analyzeWithGemini } from './geminiMultiModal';
import { BlueprintUpload } from './blueprintStorage';

export interface MultiModalAnalysisInput {
  checklistData: any;
  blueprints: BlueprintUpload[];
  images: string[];
  railwayData?: any; // Integration with railway system data
}

export interface MultiModalAnalysisResult {
  overallRiskScore: number;
  blueprintAnalysis: {
    structuralHazards: string[];
    elevationRisks: string[];
    accessPoints: string[];
    safetyZones: string[];
    recommendations: string[];
  };
  visualPatternRecognition: {
    identifiedHazards: string[];
    equipmentDetected: string[];
    workerSafetyIssues: string[];
    environmentalFactors: string[];
  };
  integratedInsights: {
    criticalFindings: string[];
    complianceGaps: string[];
    immediateActions: string[];
    longTermRecommendations: string[];
  };
  insuranceRelevantData: {
    riskMitigationMeasures: string[];
    complianceScore: number;
    documentedSafetyPractices: string[];
    liabilityReduction: string[];
  };
}

export class MultiModalAnalysisService {
  async analyzeComprehensive(input: MultiModalAnalysisInput): Promise<MultiModalAnalysisResult> {
    // Prepare comprehensive prompt for Gemini AI
    const analysisPrompt = `
As an advanced construction safety AI with expertise in blueprint analysis, visual pattern recognition, and OSHA compliance, perform a comprehensive multi-modal analysis:

## Checklist Data Analysis
${JSON.stringify(input.checklistData, null, 2)}

## Blueprint Analysis Required
Analyze the following blueprints for:
1. Structural hazards and fall risks based on elevation data
2. Access points and egress routes for emergency planning
3. Work zones requiring special safety equipment
4. Crane and equipment positioning risks
5. Public exposure areas requiring additional protection

## Visual Pattern Recognition
From the uploaded images, identify:
1. PPE compliance and worker safety violations
2. Equipment placement and operational hazards
3. Environmental conditions affecting safety
4. Housekeeping and material storage issues
5. Scaffolding and ladder safety compliance

## Railway System Integration
Consider railway-specific hazards if applicable:
1. Electrical clearances from overhead lines
2. Track access and crossing safety
3. Signal visibility and communication zones
4. Equipment grounding requirements
5. Railway operational conflicts

## Insurance & Compliance Analysis
Provide data that construction companies can use to:
1. Demonstrate proactive safety management to insurers
2. Document compliance with OSHA standards
3. Show risk mitigation measures in place
4. Quantify safety improvements over time
5. Build a defensible safety record database

## Output Requirements
Provide a structured analysis with:
1. Overall risk score (0-100, where 100 is highest risk)
2. Specific hazards identified from each data source
3. Prioritized recommendations based on severity
4. Compliance gaps that could affect insurance premiums
5. Documentation that proves safety diligence

Focus on actionable insights that small construction companies can use to compete with larger firms' safety programs and negotiate better insurance rates.
`;

    try {
      // Combine all visual data for analysis
      const visualData = [
        ...input.blueprints.map(b => ({
          type: 'blueprint',
          url: b.fileUrl,
          metadata: b
        })),
        ...input.images.map(img => ({
          type: 'photo',
          data: img
        }))
      ];

      // Get AI analysis
      const aiResponse = await analyzeWithGemini({
        prompt: analysisPrompt,
        visualData,
        context: 'construction_safety_multimodal'
      });

      // Parse and structure the response
      return this.parseAIResponse(aiResponse);
    } catch (error) {
      console.error('Multi-modal analysis error:', error);
      throw new Error('Failed to perform comprehensive safety analysis');
    }
  }

  private parseAIResponse(aiResponse: string): MultiModalAnalysisResult {
    // This would parse the structured AI response
    // For now, returning a structured format
    return {
      overallRiskScore: 0,
      blueprintAnalysis: {
        structuralHazards: [],
        elevationRisks: [],
        accessPoints: [],
        safetyZones: [],
        recommendations: []
      },
      visualPatternRecognition: {
        identifiedHazards: [],
        equipmentDetected: [],
        workerSafetyIssues: [],
        environmentalFactors: []
      },
      integratedInsights: {
        criticalFindings: [],
        complianceGaps: [],
        immediateActions: [],
        longTermRecommendations: []
      },
      insuranceRelevantData: {
        riskMitigationMeasures: [],
        complianceScore: 0,
        documentedSafetyPractices: [],
        liabilityReduction: []
      }
    };
  }

  async generateInsuranceReport(analysisResult: MultiModalAnalysisResult): Promise<string> {
    const reportPrompt = `
Generate a professional safety compliance report suitable for insurance companies based on this analysis:

${JSON.stringify(analysisResult, null, 2)}

The report should:
1. Highlight proactive safety measures
2. Document compliance with industry standards
3. Show risk mitigation strategies
4. Provide evidence of continuous improvement
5. Include metrics that insurers value

Format as a professional executive summary that positions this construction company as a low-risk, safety-conscious client.
`;

    return await analyzeWithGemini({
      prompt: reportPrompt,
      context: 'insurance_report_generation'
    });
  }
}

export const multiModalAnalysis = new MultiModalAnalysisService();