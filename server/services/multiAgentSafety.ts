import { GoogleGenerativeAI } from '@google/generative-ai';
import { SafetyIntelligenceService } from './safetyIntelligenceService';

const gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const safetyIntelligence = new SafetyIntelligenceService();

interface ValidationResult {
  qualityScore: number;
  missingCritical: string[];
  noResponses: string[];
  dataQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  concerns: string[];
  weatherPresent: boolean;
  weatherData?: any;
}

interface RiskHazard {
  name: string;
  probability: number;
  consequence: string;
  riskScore: number;
  oshaContext: string;
  inadequateControls: string[];
}

interface RiskAssessment {
  hazards: RiskHazard[];
  topThreats: string[];
  oshaData: any;
}

interface CausalStage {
  stage: string;
  description: string;
  evidence?: string;
  whyItFails?: string;
  why?: string;
  timeToIntervene?: string;
  severity?: string;
}

interface IncidentPrediction {
  incidentName: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  causalChain: CausalStage[];
  singleBestIntervention: string;
  leadingIndicators: string[];
}

export class MultiAgentSafetyAnalysis {
  private model;

  constructor() {
    this.model = gemini.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });
  }

  /**
   * Main entry point - orchestrates the 4-agent pipeline
   */
  async analyze(checklistData: any, weatherData: any): Promise<string> {
    try {
      console.log('🤖 Starting multi-agent analysis pipeline...');

      // AGENT 1: Data Validation (Temperature 0.3 - precise)
      console.log('📋 Agent 1: Validating data quality...');
      const validation = await this.validateData(checklistData, weatherData);
      console.log(`✓ Data quality: ${validation.dataQuality} (score: ${validation.qualityScore}/10)`);

      // AGENT 2: Risk Assessment (Temperature 0.7 - analytical)
      console.log('⚠️  Agent 2: Assessing risks with OSHA data...');
      const risk = await this.assessRisk(validation, checklistData);
      console.log(`✓ Identified ${risk.hazards.length} hazards`);

      // AGENT 3: Incident Prediction (Temperature 1.0 - creative reasoning)
      console.log('🔮 Agent 3: Predicting incident scenarios...');
      const prediction = await this.predictIncident(risk, checklistData);
      console.log(`✓ Predicted: ${prediction.incidentName} (confidence: ${prediction.confidence})`);

      // AGENT 4: Report Synthesis (Temperature 0.5 - structured)
      console.log('📄 Agent 4: Synthesizing final report...');
      const report = await this.synthesizeReport(validation, risk, prediction, weatherData, checklistData);
      console.log('✓ Pipeline complete!');

      return report;

    } catch (error) {
      console.error('❌ Multi-agent pipeline error:', error);
      return this.generateFallbackReport(error, checklistData, weatherData);
    }
  }

  /**
   * AGENT 1: Data Validator
   * Temperature: 0.3 (precise, focused)
   * Task: Validate data quality and identify gaps
   */
  private async validateData(checklistData: any, weatherData: any): Promise<ValidationResult> {
    const prompt = `You are a construction safety data validator. Analyze the provided checklist and weather data for completeness and quality.

INPUT DATA:
Checklist: ${JSON.stringify(checklistData, null, 2)}
Weather: ${JSON.stringify(weatherData, null, 2)}

VALIDATION CHECKLIST:
1. Check for missing CRITICAL fields: emergency plan, worker certifications, equipment specifications
2. Identify all "No response" answers
3. Flag contradictory or vague responses (e.g., "same", "yes", one-word answers)
4. Assess weather data completeness (temperature, wind speed, conditions)
5. Calculate overall data quality score (1-10)

SCORING RUBRIC:
10 = Complete, detailed responses for all critical fields
7-9 = Minor gaps, most critical data present
4-6 = Significant gaps in critical areas
1-3 = Insufficient data for safe analysis

OUTPUT REQUIREMENTS:
Respond with ONLY valid JSON, no other text. Use this exact structure:

{
  "qualityScore": <number 1-10>,
  "missingCritical": ["field name 1", "field name 2"],
  "noResponses": ["question with no response 1", "question 2"],
  "dataQuality": "HIGH|MEDIUM|LOW",
  "concerns": ["specific concern 1", "specific concern 2"],
  "weatherPresent": <true|false>
}`;

    try {
      const result = await this.callGemini(prompt, 0.3, 1500);
      const parsed = JSON.parse(this.extractJSON(result));
      
      return {
        ...parsed,
        weatherData: weatherData
      };
    } catch (error) {
      console.error('Agent 1 parsing error:', error);
      // Fallback validation
      return {
        qualityScore: 5,
        missingCritical: ['Unable to parse validation'],
        noResponses: [],
        dataQuality: 'MEDIUM',
        concerns: ['Data validation failed - proceeding with caution'],
        weatherPresent: !!weatherData,
        weatherData: weatherData
      };
    }
  }

  /**
   * AGENT 2: Risk Assessor
   * Temperature: 0.7 (analytical)
   * Task: Identify hazards and calculate risk scores using OSHA data
   */
  private async assessRisk(validation: ValidationResult, checklistData: any): Promise<RiskAssessment> {
    // Fetch OSHA data
    let oshaData: any = {};
    try {
      const constructionProfile = await safetyIntelligence.getRiskProfile('23');
      const industryBenchmarks = await safetyIntelligence.getIndustryBenchmark('23');
      oshaData = { constructionProfile, industryBenchmarks };
    } catch (error) {
      console.error('Failed to fetch OSHA data:', error);
    }

    const prompt = `You are a construction risk assessor with access to real OSHA Bureau of Labor Statistics data.

VALIDATED CHECKLIST SUMMARY:
- Data Quality: ${validation.dataQuality}
- Quality Score: ${validation.qualityScore}/10
- Missing Critical Data: ${JSON.stringify(validation.missingCritical)}
- Key Concerns: ${JSON.stringify(validation.concerns)}
- Weather Present: ${validation.weatherPresent}

FULL CHECKLIST DATA:
${JSON.stringify(checklistData, null, 2)}

REAL OSHA STATISTICS (BLS 2023):
${JSON.stringify(oshaData, null, 2)}

RISK ASSESSMENT TASKS:
1. Identify the top 3 SPECIFIC hazards from the checklist (not generic categories)
2. For EACH hazard:
   - Calculate probability using OSHA data where available
   - Assign consequence severity (Minor/Serious/Critical/Fatal)
   - Calculate risk score (1-100 scale)
   - Identify which controls are inadequate or missing
   - Provide OSHA statistical context

3. Rank threats by risk score
4. Consider: work height, weather conditions, equipment type, worker experience

EXAMPLE GOOD HAZARD:
{
  "name": "Worker fall from swing stage at 90 feet during glass panel positioning",
  "probability": 0.023,
  "consequence": "Fatal",
  "riskScore": 95,
  "oshaContext": "Falls from height represent 36.5% of construction fatalities (OSHA 2023)",
  "inadequateControls": ["Anchor points not certified by competent person", "No rescue plan documented"]
}

EXAMPLE BAD HAZARD (too generic):
{
  "name": "Fall hazard",
  "probability": 0.5,
  "consequence": "Injury"
}

OUTPUT REQUIREMENTS:
Respond with ONLY valid JSON, no other text:

{
  "hazards": [
    {
      "name": "Specific hazard description",
      "probability": <0.0 to 1.0>,
      "consequence": "Minor|Serious|Critical|Fatal",
      "riskScore": <1-100>,
      "oshaContext": "Real OSHA statistic or closest analog",
      "inadequateControls": ["control 1", "control 2"]
    }
  ],
  "topThreats": ["threat 1", "threat 2", "threat 3"]
}`;

    try {
      const result = await this.callGemini(prompt, 0.7, 2000);
      const parsed = JSON.parse(this.extractJSON(result));
      
      return {
        ...parsed,
        oshaData
      };
    } catch (error) {
      console.error('Agent 2 parsing error:', error);
      // Fallback risk assessment
      return {
        hazards: [{
          name: 'Generic construction hazard - risk assessment failed',
          probability: 0.1,
          consequence: 'Serious',
          riskScore: 50,
          oshaContext: 'Risk assessment unavailable',
          inadequateControls: ['Unable to assess controls']
        }],
        topThreats: ['Risk assessment failed'],
        oshaData
      };
    }
  }

  /**
   * AGENT 3: Incident Predictor
   * Temperature: 1.0 (maximum creative reasoning)
   * Task: Build causal chain for most likely incident
   */
  private async predictIncident(risk: RiskAssessment, checklistData: any): Promise<IncidentPrediction> {
    const topHazard = risk.hazards[0]; // Highest risk score

    const prompt = `You are an incident prediction specialist using the Swiss Cheese Model of accident causation. Your job is to predict EXACTLY how the top-risk incident will unfold if nothing changes.

TOP RISK HAZARD:
${JSON.stringify(topHazard, null, 2)}

CHECKLIST EVIDENCE:
${JSON.stringify(checklistData, null, 2)}

YOUR TASK:
Build a detailed causal chain showing the SPECIFIC sequence of events that leads to this incident TODAY.

SWISS CHEESE MODEL STAGES:
1. **Initiating Event** - What specific trigger starts the sequence? (e.g., "Crane begins lift of 46-inch glass panel during wind gust cycle")
2. **First Defense Failure** - Which control SHOULD stop this but doesn't work? WHY does it fail? (e.g., "Wind monitoring inadequate - no real-time anemometer")
3. **Human Performance Factor** - What decision accelerates the failure? WHY will the worker make this choice? (e.g., "Foreman authorizes lift during borderline winds due to schedule pressure")
4. **Point of No Return** - When does the incident become inevitable? How much time to intervene? (e.g., "Glass panel catches wind at 60 feet - load becomes uncontrollable - 15 seconds to impact")
5. **Injury Mechanism** - EXACTLY how does injury occur? What severity? (e.g., "Glass panel strikes swing stage - worker falls 90 feet - Fatal")

REQUIREMENTS:
- Use ACTUAL details from the checklist (specific equipment, heights, weather, procedures)
- Quote specific checklist responses as evidence
- Be SPECIFIC, not generic (not "worker falls" but "worker on swing stage at 6th floor struck by swinging glass panel")
- Identify 3-5 observable leading indicators supervisors could see RIGHT NOW
- Provide ONE specific intervention that breaks the chain at its weakest point

OUTPUT REQUIREMENTS:
Respond with ONLY valid JSON, no other text:

{
  "incidentName": "Specific incident with mechanism (e.g., 'Struck-by: Glass panel loss of control during crane lift')",
  "confidence": "HIGH|MEDIUM|LOW",
  "causalChain": [
    {
      "stage": "Initiating Event",
      "description": "Specific trigger with details",
      "evidence": "Quote from checklist showing this condition exists"
    },
    {
      "stage": "First Defense Failure",
      "description": "Specific control that fails",
      "whyItFails": "Root cause (procedure unclear, equipment unavailable, etc.)"
    },
    {
      "stage": "Human Performance Factor",
      "description": "Specific worker decision",
      "why": "Why they make this choice (fatigue, pressure, normalized deviation)"
    },
    {
      "stage": "Point of No Return",
      "description": "When incident becomes inevitable",
      "timeToIntervene": "X seconds/minutes"
    },
    {
      "stage": "Injury Mechanism",
      "description": "Exactly how injury occurs",
      "severity": "Minor|Serious|Critical|Fatal"
    }
  ],
  "leadingIndicators": [
    "Observable indicator 1 supervisors would see now",
    "Observable indicator 2",
    "Observable indicator 3"
  ],
  "singleBestIntervention": "ONE specific action that breaks the chain (not 'provide training' but 'Install real-time anemometer with 20mph alarm before authorizing any lifts')"
}`;

    try {
      const result = await this.callGemini(prompt, 1.0, 2500);
      const parsed = JSON.parse(this.extractJSON(result));
      
      return parsed;
    } catch (error) {
      console.error('Agent 3 parsing error:', error);
      // Fallback prediction
      return {
        incidentName: topHazard.name,
        confidence: 'LOW',
        causalChain: [{
          stage: 'Prediction Failed',
          description: 'Unable to build causal chain - incident prediction unavailable'
        }],
        leadingIndicators: ['Incident prediction failed'],
        singleBestIntervention: 'Unable to determine intervention'
      };
    }
  }

  /**
   * Helper: Call Gemini with specific temperature and token limit
   */
  private async callGemini(prompt: string, temperature: number, maxTokens: number): Promise<string> {
    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens
      }
    });
    return result.response.text();
  }

  /**
   * Helper: Extract JSON from markdown code blocks
   */
  private extractJSON(text: string): string {
    // Try to extract from markdown code block
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) return jsonMatch[1].trim();

    const codeMatch = text.match(/```\n([\s\S]*?)\n```/);
    if (codeMatch) return codeMatch[1].trim();

    // Return as-is if no code block
    return text.trim();
  }

  /**
   * AGENT 4: Report Synthesizer
   * Temperature: 0.5 (structured)
   * Task: Generate final formatted safety analysis report
   */
  private async synthesizeReport(
    validation: ValidationResult,
    risk: RiskAssessment,
    prediction: IncidentPrediction,
    weatherData: any,
    checklistData: any
  ): Promise<string> {
    
    const prompt = `You are a safety report writer. Synthesize the multi-agent analysis results into a clear, actionable safety report.

AGENT OUTPUTS:

**DATA VALIDATION:**
Quality Score: ${validation.qualityScore}/10
Data Quality: ${validation.dataQuality}
Missing Critical: ${JSON.stringify(validation.missingCritical)}
Concerns: ${JSON.stringify(validation.concerns)}
Weather Present: ${validation.weatherPresent}

**RISK ASSESSMENT:**
Top Hazard: ${risk.hazards[0]?.name}
Risk Score: ${risk.hazards[0]?.riskScore}/100
Consequence: ${risk.hazards[0]?.consequence}
OSHA Context: ${risk.hazards[0]?.oshaContext}
Inadequate Controls: ${JSON.stringify(risk.hazards[0]?.inadequateControls)}
All Threats: ${JSON.stringify(risk.topThreats)}

**INCIDENT PREDICTION:**
Incident Name: ${prediction.incidentName}
Confidence: ${prediction.confidence}
Causal Chain: ${JSON.stringify(prediction.causalChain)}
Leading Indicators: ${JSON.stringify(prediction.leadingIndicators)}
Best Intervention: ${prediction.singleBestIntervention}

**WEATHER DATA:**
${weatherData ? JSON.stringify(weatherData, null, 2) : 'No weather data available'}

YOUR TASK:
Create a professional safety analysis report with these sections:

1. **EXECUTIVE DECISION** - Based on data quality and risks, recommend: GO / GO WITH CONDITIONS / NO-GO
2. **PRIMARY THREAT** - One sentence describing the top incident risk
3. **INCIDENT FORECAST** - Detailed prediction with causal chain
4. **IMMEDIATE ACTIONS** - Top 3 critical actions before work starts
5. **WEATHER IMPACT** - How conditions affect safety (if weather available)
6. **DATA GAPS** - What information is missing and why it matters

FORMAT: Use clear headings, bullet points, and specific details. Make it actionable for a field supervisor.

OUTPUT REQUIREMENTS:
Return a well-formatted text report (not JSON). Be specific and direct.`;

    try {
      const result = await this.callGemini(prompt, 0.5, 3000);
      return result;
    } catch (error) {
      console.error('Agent 4 synthesis error:', error);
      // Fallback to structured output if AI synthesis fails
      return `**MULTI-AGENT SAFETY ANALYSIS**

**EXECUTIVE DECISION:** ${validation.qualityScore < 5 ? 'NO-GO' : validation.qualityScore < 7 ? 'GO WITH CONDITIONS' : 'GO'}

**PRIMARY THREAT:**
${prediction.incidentName} (Confidence: ${prediction.confidence})

**DATA VALIDATION:**
Quality: ${validation.dataQuality} (${validation.qualityScore}/10)
Missing Critical: ${validation.missingCritical.join(', ') || 'None'}

**TOP HAZARD:**
${risk.hazards[0]?.name} (Risk Score: ${risk.hazards[0]?.riskScore}/100)

**BEST INTERVENTION:**
${prediction.singleBestIntervention}

**LEADING INDICATORS:**
${prediction.leadingIndicators.map((ind, i) => `${i + 1}. ${ind}`).join('\n')}

${weatherData ? `\n**WEATHER:** ${weatherData.temperature}°F, ${weatherData.windSpeed} mph wind` : '⚠️ NO WEATHER DATA'}

--- AI synthesis failed - showing structured fallback ---`;
    }
  }

  /**
   * Fallback report when pipeline fails
   */
  private generateFallbackReport(error: any, checklistData: any, weatherData: any): string {
    return `**ANALYSIS SYSTEM ERROR**

The multi-agent pipeline encountered an error and could not complete the analysis.

Error: ${error instanceof Error ? error.message : 'Unknown error'}

Checklist ID: ${checklistData.id || 'Unknown'}
Weather Data Present: ${weatherData ? 'Yes' : 'No'}

Please review the system logs and try again.`;
  }
}

export const multiAgentSafety = new MultiAgentSafetyAnalysis();
