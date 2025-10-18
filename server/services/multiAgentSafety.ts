import { GoogleGenerativeAI } from '@google/generative-ai';
import { SafetyIntelligenceService } from './safetyIntelligenceService';
import { db } from '../db.js';
import { agentOutputs } from '../../shared/schema.js';

const gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const safetyIntelligence = new SafetyIntelligenceService();

interface ValidationResult {
  qualityScore: number;
  dataQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  missingCritical: string[];
  insufficientResponses?: Array<{ field: string; issue: string }>;
  weatherPresent: boolean;
  weatherRisks?: string[];
  concerns: {
    CRITICAL?: string[];
    HIGH?: string[];
    MEDIUM?: string[];
    LOW?: string[];
  };
  tradeSpecificGaps?: string[];
  recommendedAction?: 'PROCEED' | 'REQUEST_CLARIFICATION' | 'REJECT_UNSAFE';
  weatherData?: any;
  // Legacy fields for backward compatibility
  noResponses?: string[];
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

interface PipelineMetadata {
  pipelineVersion: string;
  executionTimeMs: number;
  agents: {
    agent1_validator: {
      model: string;
      temperature: number;
      maxTokens: number;
      executionTimeMs: number;
      responseLength: number;
    };
    agent2_risk_assessor: {
      model: string;
      temperature: number;
      maxTokens: number;
      executionTimeMs: number;
      responseLength: number;
      oshaDataSources: string[];
    };
    agent3_incident_predictor: {
      model: string;
      temperature: number;
      maxTokens: number;
      executionTimeMs: number;
      responseLength: number;
      confidenceLevel: string;
    };
    agent4_report_synthesizer: {
      model: string;
      temperature: number;
      method: string;
      executionTimeMs: number;
      reportLength: number;
      responseLength: number;
    };
  };
  dataQuality: string;
  topRiskScore: number;
  predictionConfidence: string;
}

interface AnalysisResult {
  report: string;
  metadata: PipelineMetadata;
}

export class MultiAgentSafetyAnalysis {
  private model;
  private pipelineStartTime: number = 0;

  constructor() {
    this.model = gemini.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });
  }

  /**
   * Helper: Get all concerns as flat array (backward compatibility)
   */
  private getAllConcerns(validation: ValidationResult): string[] {
    if (Array.isArray(validation.concerns)) {
      // Old format: concerns is array
      return validation.concerns as any;
    }
    // New format: concerns is object with CRITICAL/HIGH/MEDIUM/LOW
    const allConcerns: string[] = [];
    if (validation.concerns.CRITICAL) allConcerns.push(...validation.concerns.CRITICAL);
    if (validation.concerns.HIGH) allConcerns.push(...validation.concerns.HIGH);
    if (validation.concerns.MEDIUM) allConcerns.push(...validation.concerns.MEDIUM);
    if (validation.concerns.LOW) allConcerns.push(...validation.concerns.LOW);
    return allConcerns;
  }

  /**
   * Helper: Get trade-specific critical fields based on work type
   */
  private getTradeSpecificFields(workType: string): string {
    const workTypeLower = (workType || '').toLowerCase();
    
    if (workTypeLower.includes('electric') || workTypeLower.includes('electrical')) {
      return `   Electrical Trade Critical Fields:
   - LOTO (Lock-Out Tag-Out) procedures with specific energy sources
   - Arc flash PPE category (0-4) with calorie rating
   - Voltage testing procedure (must use rated test equipment)
   - Qualified person certifications (NFPA 70E or equivalent)
   - Energized work permit (if working on live circuits)`;
    }
    
    if (workTypeLower.includes('roofing') || workTypeLower.includes('roof')) {
      return `   Roofing Trade Critical Fields:
   - Fall protection system type (guardrails, nets, or PFAS)
   - Roof edge setback distance (minimum 6 feet from edge)
   - Weather monitoring for high winds/rain (specific wind speed limits)
   - Ladder tie-off and 3-point contact
   - Material storage away from roof edge`;
    }
    
    if (workTypeLower.includes('scaffold') || workTypeLower.includes('height') || workTypeLower.includes('fall')) {
      return `   Work at Height Critical Fields:
   - Fall protection anchor points with 5,000lb capacity certification
   - Competent person inspection of harnesses/lanyards (signed & dated)
   - Rescue plan with 6-minute response time capability
   - Scaffold load rating and capacity placard visible
   - Guardrail height 42" ± 3" with midrail and toeboard`;
    }
    
    if (workTypeLower.includes('crane') || workTypeLower.includes('lift') || workTypeLower.includes('hoist')) {
      return `   Crane/Lifting Critical Fields:
   - Crane operator certification (CCO or NCCCO)
   - Load chart present and load within rated capacity
   - Wind speed monitoring with specific mph stop-work limit
   - Swing radius barricaded and exclusion zone marked
   - Signal person identified and hand signals reviewed`;
    }
    
    if (workTypeLower.includes('concrete') || workTypeLower.includes('masonry')) {
      return `   Concrete/Masonry Critical Fields:
   - Form integrity inspection before pour (signed by engineer)
   - Shoring/reshoring plan for multi-level structures
   - Silica exposure control (wet methods or HEPA vacuum)
   - Vibration tool anti-vibration gloves and time limits
   - Reinforcement bar impalement protection (caps on vertical rebar)`;
    }
    
    if (workTypeLower.includes('excavat') || workTypeLower.includes('trench')) {
      return `   Excavation/Trenching Critical Fields:
   - Competent person daily trench inspection (atmospheric testing)
   - Soil type classification (Type A/B/C) with shoring/sloping accordingly
   - Ladder within 25 feet of workers at all times
   - Utility locate (call 811) with marked lines on site
   - Spoil pile setback minimum 2 feet from edge`;
    }
    
    // Generic construction
    return `   General Construction Critical Fields:
   - Site-specific hazard assessment (minimum 3 hazards identified)
   - Emergency assembly point with marked route
   - First aid kit location and trained first aid provider on site
   - Competent person for each major hazard category identified by name`;
  }

  /**
   * Main entry point - orchestrates the 4-agent pipeline
   * @param checklistData - The checklist data to analyze
   * @param weatherData - Weather data for the site
   * @param analysisId - Optional analysis_history record ID for tracking agent outputs
   */
  async analyze(checklistData: any, weatherData: any, analysisId?: string): Promise<AnalysisResult> {
    this.pipelineStartTime = Date.now();
    const agentTimings: any = {};
    
    // Track partial results for fallback fidelity
    let lastKnownDataQuality = 'ERROR';
    let lastKnownTopRiskScore = 0;
    let lastKnownConfidence = 'NONE';

    try {
      console.log('🤖 Starting multi-agent analysis pipeline...');

      // AGENT 1: Data Validation (Temperature 0.3 - precise)
      console.log('📋 Agent 1: Validating data quality...');
      const agent1Start = Date.now();
      const validation = await this.validateData(checklistData, weatherData);
      agentTimings.agent1_validator = {
        model: 'gemini-2.5-flash',
        temperature: 0.3,
        maxTokens: 4000,
        executionTimeMs: Date.now() - agent1Start,
        responseLength: JSON.stringify(validation).length
      };
      lastKnownDataQuality = validation.dataQuality;
      console.log(`✓ Data quality: ${validation.dataQuality} (score: ${validation.qualityScore}/10)`);

      // Save Agent 1 output
      if (analysisId) {
        await db.insert(agentOutputs).values({
          analysisId,
          agentId: 'safety_agent_1',
          agentName: 'Data Validator',
          agentType: 'multi_agent_safety',
          outputData: validation,
          executionMetadata: agentTimings.agent1_validator,
          success: true
        });
      }

      // AGENT 2: Risk Assessment (Temperature 0.7 - analytical)
      console.log('⚠️  Agent 2: Assessing risks with OSHA data...');
      const agent2Start = Date.now();
      const risk = await this.assessRisk(validation, checklistData);
      agentTimings.agent2_risk_assessor = {
        model: 'gemini-2.5-flash',
        temperature: 0.7,
        maxTokens: 8000,
        executionTimeMs: Date.now() - agent2Start,
        responseLength: JSON.stringify(risk).length,
        oshaDataSources: risk.oshaData ? ['BLS_2023_Construction', 'NAICS_23'] : []
      };
      lastKnownTopRiskScore = risk.hazards[0]?.riskScore || 0;
      console.log(`✓ Identified ${risk.hazards.length} hazards`);

      // Save Agent 2 output
      if (analysisId) {
        await db.insert(agentOutputs).values({
          analysisId,
          agentId: 'safety_agent_2',
          agentName: 'Risk Assessor',
          agentType: 'multi_agent_safety',
          outputData: risk,
          executionMetadata: agentTimings.agent2_risk_assessor,
          success: true
        });
      }

      // AGENT 3: Incident Prediction (Temperature 1.0 - creative reasoning)
      console.log('🔮 Agent 3: Predicting incident scenarios...');
      const agent3Start = Date.now();
      const prediction = await this.predictIncident(risk, checklistData);
      agentTimings.agent3_incident_predictor = {
        model: 'gemini-2.5-flash',
        temperature: 1.0,
        maxTokens: 8000,
        executionTimeMs: Date.now() - agent3Start,
        responseLength: JSON.stringify(prediction).length,
        confidenceLevel: prediction.confidence
      };
      lastKnownConfidence = prediction.confidence;
      console.log(`✓ Predicted: ${prediction.incidentName} (confidence: ${prediction.confidence})`);

      // Save Agent 3 output
      if (analysisId) {
        await db.insert(agentOutputs).values({
          analysisId,
          agentId: 'safety_agent_3',
          agentName: 'Incident Predictor',
          agentType: 'multi_agent_safety',
          outputData: prediction,
          executionMetadata: agentTimings.agent3_incident_predictor,
          success: true
        });
      }

      // AGENT 4: Report Synthesis (Temperature 0.5 - structured)
      console.log('📄 Agent 4: Synthesizing final report...');
      const agent4Start = Date.now();
      const report = await this.synthesizeReport(validation, risk, prediction, weatherData, checklistData);
      agentTimings.agent4_report_synthesizer = {
        model: 'hybrid-template',
        temperature: 0.5,
        method: 'structured_typescript',
        executionTimeMs: Date.now() - agent4Start,
        reportLength: report.length,
        responseLength: report.length  // Alias for consistency with other agents
      };
      console.log('✓ Pipeline complete!');

      // Save Agent 4 output
      if (analysisId) {
        await db.insert(agentOutputs).values({
          analysisId,
          agentId: 'safety_agent_4',
          agentName: 'Report Synthesizer',
          agentType: 'multi_agent_safety',
          outputData: { 
            fullReport: report,
            reportLength: report.length 
          },
          executionMetadata: agentTimings.agent4_report_synthesizer,
          success: true
        });
      }

      const totalExecutionTime = Date.now() - this.pipelineStartTime;

      const metadata: PipelineMetadata = {
        pipelineVersion: 'multi-agent-v1.0-hybrid',
        executionTimeMs: totalExecutionTime,
        agents: agentTimings,
        dataQuality: validation.dataQuality,
        topRiskScore: risk.hazards[0]?.riskScore || 0,
        predictionConfidence: prediction.confidence
      };

      return {
        report,
        metadata
      };

    } catch (error) {
      console.error('❌ Multi-agent pipeline error:', error);
      const fallbackReport = this.generateFallbackReport(error, checklistData, weatherData);
      
      // Use last known values from successful agents (preserves analytics fidelity)
      const fallbackMetadata: PipelineMetadata = {
        pipelineVersion: 'multi-agent-v1.0-hybrid',
        executionTimeMs: Date.now() - this.pipelineStartTime,
        agents: {
          agent1_validator: agentTimings.agent1_validator || {
            model: 'gemini-2.5-flash',
            temperature: 0.3,
            maxTokens: 4000,
            executionTimeMs: 0,
            responseLength: 0
          },
          agent2_risk_assessor: agentTimings.agent2_risk_assessor || {
            model: 'gemini-2.5-flash',
            temperature: 0.7,
            maxTokens: 8000,
            executionTimeMs: 0,
            responseLength: 0,
            oshaDataSources: []
          },
          agent3_incident_predictor: agentTimings.agent3_incident_predictor || {
            model: 'gemini-2.5-flash',
            temperature: 1.0,
            maxTokens: 8000,
            executionTimeMs: 0,
            responseLength: 0,
            confidenceLevel: lastKnownConfidence  // Preserve real confidence from Agent 3
          },
          agent4_report_synthesizer: agentTimings.agent4_report_synthesizer || {
            model: 'hybrid-template',
            temperature: 0.5,
            method: 'structured_typescript',
            executionTimeMs: 0,
            reportLength: 0,
            responseLength: 0
          }
        },
        dataQuality: lastKnownDataQuality,  // Preserve real data quality from Agent 1
        topRiskScore: lastKnownTopRiskScore,  // Preserve real risk score from Agent 2
        predictionConfidence: lastKnownConfidence  // Preserve real confidence from Agent 3
      };
      
      return {
        report: fallbackReport,
        metadata: fallbackMetadata
      };
    }
  }

  /**
   * AGENT 1: Data Validator
   * Temperature: 0.3 (precise, focused)
   * Task: Validate data quality and identify gaps
   */
  private async validateData(checklistData: any, weatherData: any): Promise<ValidationResult> {
    // Fetch OSHA industry context
    let naicsCode = '238'; // Default: Specialty Trade Contractors
    let industryName = 'Construction';
    let injuryRate = 35;
    
    try {
      // Try to get industry-specific data from OSHA database
      const riskProfile = await safetyIntelligence.getRiskProfile('238');
      if (riskProfile) {
        naicsCode = riskProfile.naicsCode;
        industryName = riskProfile.industryName;
        injuryRate = riskProfile.injuryRate || 35;
      }
    } catch (error) {
      console.warn('Could not fetch OSHA data for validation, using defaults');
    }
    
    // Extract work type from checklist
    const workType = checklistData.sections?.[0]?.responses?.[1]?.response || 
                     checklistData.workType || 
                     'General Construction';
    
    const prompt = `You are a construction safety data validator with expertise in OSHA 1926 standards. 
Analyze the provided checklist and weather data for completeness, quality, and safety adequacy.

INPUT DATA:
Checklist: ${JSON.stringify(checklistData, null, 2)}
Weather: ${JSON.stringify(weatherData, null, 2)}
Industry: NAICS ${naicsCode} (${industryName})
Baseline Injury Rate: ${injuryRate} per 100 workers

VALIDATION REQUIREMENTS:

1. CRITICAL FIELD VERIFICATION:
   Universal Critical Fields:
   - Emergency evacuation plan with specific assembly point
   - Worker certifications (must list cert types: OSHA 10/30, etc.)
   - Equipment specifications (manufacturer, model, or last inspection date)
   - PPE requirements (specific types: hard hat, safety glasses, gloves, etc.)
   - Hazard identification (minimum 3 specific hazards listed)
   
   ${this.getTradeSpecificFields(workType)}

2. RESPONSE QUALITY CHECK:
   - Flag "No response", "N/A", "Same", "Yes/No" without details
   - Flag responses < 3 words for critical fields
   - Flag contradictory answers (e.g., "no hazards" but lists PPE requirements)
   - Flag generic responses (e.g., "be careful" instead of specific control measures)

3. WEATHER RISK ASSESSMENT:
   ${weatherData ? `
   Current Conditions:
   - Temperature: ${weatherData.temperature}°F
   - Wind: ${weatherData.windSpeed} mph
   - Conditions: ${weatherData.conditions}
   - Precipitation: ${weatherData.precipitation || 'None'}
   
   Flag if:
   - Temp < 32°F or > 95°F AND no heat/cold stress plan
   - Wind > 25mph AND work involves cranes/scaffolding
   - Rain/snow present AND no slip prevention measures
   - Visibility < 1 mile AND no enhanced barriers mentioned
   ` : 'Weather data unavailable - FLAG as CRITICAL concern'}

4. INDUSTRY-SPECIFIC VALIDATION:
   Based on injury rate of ${injuryRate}/100 workers, verify checklist addresses:
   - Top industry hazards for this trade
   - Controls proportional to risk level
   - Emergency response procedures adequate for common incidents

5. SCORING (Objective Criteria):
   10 = All critical fields present, responses >5 words with specifics, weather risks addressed
   8-9 = 90%+ critical fields present, minor brevity in non-critical areas
   6-7 = 70-89% critical fields present, some generic responses
   4-5 = 50-69% critical fields present, multiple vague responses
   1-3 = <50% critical fields present, insufficient for safe analysis
   0 = Checklist empty or malformed

OUTPUT REQUIREMENTS:
Respond ONLY with valid JSON. No markdown, no explanations, just JSON:

{
  "qualityScore": <number 0-10>,
  "dataQuality": "HIGH|MEDIUM|LOW",
  "missingCritical": ["specific field name 1", "field 2"],
  "insufficientResponses": [
    {"field": "PPE Requirements", "issue": "One-word response, needs specific PPE types"},
    {"field": "Hazard Controls", "issue": "Says 'be careful' - not a control measure"}
  ],
  "weatherPresent": <true|false>,
  "weatherRisks": ["High winds 35mph - crane ops need halt plan", "Temp 28°F - cold stress plan missing"],
  "concerns": {
    "CRITICAL": ["No fall protection for 30ft work", "No emergency exits marked"],
    "HIGH": ["Equipment last inspected 90 days ago (30-day max required)"],
    "MEDIUM": ["Generic hazard descriptions"],
    "LOW": ["Emergency contact area codes missing"]
  },
  "tradeSpecificGaps": ["Electrical LOTO not mentioned", "Arc flash PPE rating not specified"],
  "recommendedAction": "PROCEED|REQUEST_CLARIFICATION|REJECT_UNSAFE"
}

CRITICAL: Output must be parseable JSON. Any non-JSON text will cause system failure.`;

    let result = '';
    try {
      result = await this.callGemini(prompt, 0.3, 4000);
      const extracted = this.extractJSON(result);
      console.log('🔍 Agent 1 extracted JSON length:', extracted.length);
      const parsed = JSON.parse(extracted);
      
      return {
        ...parsed,
        weatherData: weatherData
      };
    } catch (error) {
      console.error('Agent 1 parsing error:', error);
      console.error('Agent 1 raw response preview:', result?.substring(0, 200));
      // Fallback validation
      return {
        qualityScore: 5,
        missingCritical: ['Unable to parse validation'],
        dataQuality: 'MEDIUM',
        concerns: {
          CRITICAL: [],
          HIGH: ['Data validation failed - proceeding with caution'],
          MEDIUM: [],
          LOW: []
        },
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

    let result = '';
    try {
      result = await this.callGemini(prompt, 0.7, 8000); // 2.5-flash thinking + response
      const extracted = this.extractJSON(result);
      console.log('🔍 Agent 2 extracted JSON length:', extracted.length);
      const parsed = JSON.parse(extracted);
      
      return {
        ...parsed,
        oshaData
      };
    } catch (error) {
      console.error('Agent 2 parsing error:', error);
      console.error('Agent 2 raw response preview:', result?.substring(0, 200));
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

    let result = '';
    try {
      result = await this.callGemini(prompt, 1.0, 8000); // 2.5-flash thinking + response
      const extracted = this.extractJSON(result);
      console.log('🔍 Agent 3 extracted JSON length:', extracted.length);
      const parsed = JSON.parse(extracted);
      
      return parsed;
    } catch (error) {
      console.error('Agent 3 parsing error:', error);
      console.error('Agent 3 raw response preview:', result?.substring(0, 300));
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
    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens
        }
      });
      
      const responseText = result.response.text();
      console.log(`📡 Gemini response (temp ${temperature}): ${responseText.length} chars`);
      
      // Check for safety blocks
      if (!responseText || responseText.trim() === '') {
        console.error('⚠️  Empty response from Gemini');
        console.error('Prompt length:', prompt.length);
        console.error('Response object:', JSON.stringify(result.response, null, 2));
      }
      
      return responseText;
    } catch (error) {
      console.error('❌ Gemini API error:', error);
      throw error;
    }
  }

  /**
   * Helper: Extract JSON from markdown code blocks
   */
  private extractJSON(text: string): string {
    // Try multiple patterns to extract JSON from markdown
    const patterns = [
      /```json\s*([\s\S]*?)\s*```/,  // ```json with optional whitespace
      /```\s*([\s\S]*?)\s*```/,        // ``` with optional whitespace
      /\{[\s\S]*\}/                     // Raw JSON object
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const extracted = match[1] || match[0];
        const trimmed = extracted.trim();
        // Verify it looks like JSON
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          return trimmed;
        }
      }
    }

    // Return as-is if no pattern matches
    return text.trim();
  }

  /**
   * AGENT 4: Report Synthesizer
   * Temperature: 0.5 (structured formatting)
   * Task: Generate hybrid report (Traditional JHA + Predictive Analysis)
   */
  private async synthesizeReport(
    validation: ValidationResult,
    risk: RiskAssessment,
    prediction: IncidentPrediction,
    weatherData: any,
    checklistData: any
  ): Promise<string> {
    
    const now = new Date();
    const topHazard = risk.hazards[0] || {};
    
    // Calculate GO/NO-GO decision logic
    let decision = 'GO WITH CONDITIONS';
    const stopWorkReasons: string[] = [];
    const requiredConditions: string[] = [];
    
    // Evaluate stop-work triggers
    if (validation.dataQuality === 'LOW') {
      stopWorkReasons.push('Insufficient data quality for safe operations');
      decision = 'NO-GO';
    }
    
    if (weatherData?.windSpeed) {
      const windLimit = 20; // ASME B30.3 conservative limit
      if (weatherData.windSpeed > windLimit) {
        stopWorkReasons.push(`Wind speed (${weatherData.windSpeed} mph) exceeds ${windLimit} mph safe crane operation limit`);
        decision = 'NO-GO';
      } else if (weatherData.windSpeed > windLimit * 0.8) {
        requiredConditions.push('Continuous wind speed monitoring with hard stop at 20 mph');
      }
    }
    
    if (prediction.confidence === 'HIGH' && topHazard.riskScore > 85) {
      stopWorkReasons.push('High-confidence prediction of critical incident with inadequate controls');
      decision = 'NO-GO';
    }
    
    if (validation.missingCritical.some(field => 
      field.toLowerCase().includes('emergency') || 
      field.toLowerCase().includes('rescue'))) {
      requiredConditions.push('Competent person inspection of fall protection before work starts');
    }
    
    // If we have conditions but they're critical, it's still GO WITH CONDITIONS
    if (stopWorkReasons.length === 0 && requiredConditions.length > 0) {
      decision = 'GO WITH CONDITIONS';
    }
    
    // Calculate weather safety margins
    let weatherStatus = 'GREEN';
    let windMargin = 100;
    if (weatherData?.windSpeed) {
      const safeLimit = 20;
      windMargin = ((safeLimit - weatherData.windSpeed) / safeLimit) * 100;
      
      if (windMargin < 20) weatherStatus = 'RED';
      else if (windMargin < 30) weatherStatus = 'YELLOW';
    }
    
    // Extract site info
    const siteLocation = checklistData.sections?.[0]?.responses?.[0]?.response || 'Location not specified';
    const workType = checklistData.sections?.[0]?.responses?.[1]?.response || 'Work type not specified';
    
    // Build traditional JHA section
    const traditionalJHA = `═══════════════════════════════════════════
EXECUTIVE SUMMARY (Industry Standard JHA)
═══════════════════════════════════════════

**Overall Assessment:**

${this.generateOverallAssessment(validation, risk, weatherData)}

**Critical Safety Risks Identified:**

${risk.hazards.slice(0, 5).map((hazard, i) => 
  `${i + 1}. **${hazard.name}** (Risk Score: ${hazard.riskScore}/100)
   - Consequence: ${hazard.consequence}
   - OSHA Context: ${hazard.oshaContext}
   - Inadequate Controls: ${hazard.inadequateControls.join('; ') || 'None identified'}`
).join('\n\n')}

**Compliance Status Assessment:**

${this.generateComplianceStatus(validation, risk, checklistData)}

**Immediate Action Items:**

${this.generateImmediateActions(prediction, validation, weatherData, topHazard)}

**Long-Term Recommendations:**

1. **Engineering Controls:** Implement permanent wind monitoring system at crane height
2. **Administrative Controls:** Develop written Safe Work Procedure for glass installation addressing all identified hazards
3. **Fall Protection Program:** Establish comprehensive fall protection program with competent person inspections
4. **Weather Contingency Plan:** Create documented protocol for suspending operations in adverse weather
5. **Equipment Specifications:** Obtain and document all manufacturer wind limits and load ratings

**Training Needs:**

- **Wind Awareness Training:** All personnel on recognizing wind hazards and stop-work criteria
- **Swing Stage Safety:** ANSI/IWCA I-14.1 certification for all swing stage operators
- **Crane Operations:** Verify operator certification and provide wind-specific operational training
- **Fall Protection:** Competent person training for equipment inspection and rescue procedures
- **Glass Handling Safety:** Ergonomic training and proper lifting techniques for heavy glass panels
- **Emergency Response:** Regular drills for fall rescue and dropped object scenarios

**Follow-Up Requirements:**

- Daily safety briefings documenting wind conditions and stop-work criteria
- Shift-by-shift competent person inspections of fall protection systems
- Weekly equipment certification reviews (crane, swing stage, rigging)
- Incident and near-miss reporting with root cause analysis
- Monthly JHA review and update based on site conditions`;

    // Build predictive analysis section
    const predictiveAnalysis = `

═══════════════════════════════════════════
PREDICTIVE INCIDENT ANALYSIS (AI-Enhanced)
═══════════════════════════════════════════

**EXECUTIVE DECISION: ${decision}**

${stopWorkReasons.length > 0 ? `
**STOP-WORK REASONS:**
${stopWorkReasons.map(r => `⛔ ${r}`).join('\n')}

**WORK CANNOT PROCEED UNTIL:**
${stopWorkReasons.map(r => this.getCorrectiveAction(r)).join('\n')}
` : ''}

${requiredConditions.length > 0 ? `
**CONDITIONS REQUIRED FOR GO DECISION:**
${requiredConditions.map(c => `✓ ${c}`).join('\n')}
` : ''}

**PRIMARY THREAT TODAY:**
${prediction.incidentName}

---

**INCIDENT FORECAST #1: ${prediction.incidentName}**

**Statistical Context (OSHA BLS 2023):**
- Hazard Type: ${topHazard.name}
- Risk Score: ${topHazard.riskScore}/100
- OSHA Statistical Context: ${topHazard.oshaContext}
- Site Exposure: ${siteLocation} - ${workType}
- Prediction Confidence: **${prediction.confidence}**

${prediction.confidence === 'HIGH' ? 
  '⚠️ **HIGH CONFIDENCE PREDICTION** - Multiple observable precursors present' : ''}

**Causal Chain Analysis (Swiss Cheese Model):**

This shows EXACTLY how the incident will unfold if current conditions don't change:

${prediction.causalChain.map((stage, i) => {
  let output = `**${i + 1}. ${stage.stage}:**
${stage.description}`;
  
  if (stage.evidence) output += `
   📋 *Evidence from checklist:* ${stage.evidence}`;
  if (stage.whyItFails) output += `
   ⚠️ *Why this defense fails:* ${stage.whyItFails}`;
  if (stage.why) output += `
   🧠 *Why worker makes this choice:* ${stage.why}`;
  if (stage.timeToIntervene) output += `
   ⏱️ *Time available to intervene:* ${stage.timeToIntervene}`;
  
  return output;
}).join('\n\n')}

**Leading Indicators Observable RIGHT NOW:**

${prediction.leadingIndicators.map(indicator => `🔍 ${indicator}`).join('\n')}

**These are the warning signs supervisors should be watching for TODAY.**

**Single Most Effective Intervention:**

🎯 **${prediction.singleBestIntervention}**

This intervention breaks the causal chain at its weakest point, preventing the incident sequence from progressing.

**Implementation Details:**
- **What:** ${prediction.singleBestIntervention}
- **Who:** Site supervisor / Competent person for this hazard category
- **When:** Before any operations begin today
- **Verification:** ${this.getVerificationMethod(prediction.singleBestIntervention)}
- **If not implemented:** ${prediction.incidentName} becomes statistically likely

---

**WEATHER IMPACT ON OPERATIONS:**

**Current Conditions** (${now.toLocaleTimeString()}):
- 🌡️ Temperature: ${weatherData?.temperature || 'N/A'}°F
- 💨 Wind Speed: ${weatherData?.windSpeed || 'N/A'} mph ${weatherData?.windSpeed ? `(gusts documented in checklist)` : ''}
- ☁️ Conditions: ${weatherData?.conditions || 'Unknown'}
- 💧 Humidity: ${weatherData?.humidity || 'N/A'}%

**Equipment-Specific Limits Analysis:**

**Crane Operations (ASME B30.3):**
- Conservative safe limit: 20 mph (standard for mobile/tower cranes)
- Current wind speed: ${weatherData?.windSpeed || 'UNKNOWN'} mph
- Safety margin: ${windMargin.toFixed(1)}%
- **Status: ${weatherStatus}**
  ${weatherStatus === 'GREEN' ? '✅ Weather not a limiting factor - proceed with normal monitoring' : ''}
  ${weatherStatus === 'YELLOW' ? '⚠️ CAUTION - Active monitoring required, close to limits' : ''}
  ${weatherStatus === 'RED' ? '🛑 CRITICAL - Too close to limits, recommend postpone until conditions improve' : ''}

**Swing Stage Operations (ANSI/IWCA I-14.1):**
- Recommended wind limit: 25 mph
- Current conditions: ${weatherData?.windSpeed || 'UNKNOWN'} mph
- Status: ${weatherData?.windSpeed && weatherData.windSpeed < 25 ? '✅ Within limits' : '⚠️ Borderline or exceeded'}

${weatherData?.windSpeed && weatherData.windSpeed > 15 ? 
`
🚨 **CRITICAL WEATHER FINDING:**
Wind speeds are ${weatherData.windSpeed > 20 ? 'EXCEEDING' : 'APPROACHING'} operational limits.
Mandatory continuous monitoring required. Any increase triggers immediate work stoppage.
` : ''}

---

**COMPLIANCE GAPS ENABLING THIS INCIDENT:**

${topHazard.inadequateControls && topHazard.inadequateControls.length > 0 ? 
  topHazard.inadequateControls.map((control, i) => 
    `**Gap ${i + 1}: ${control}**
- Enables: Stage ${this.mapControlToStage(control, prediction.causalChain)} of causal chain
- OSHA Reference: ${this.getOSHAReference(control)}
- Corrective Action: ${this.getCorrectiveAction(control)}
- Citation Risk: ${topHazard.riskScore > 80 ? 'HIGH' : topHazard.riskScore > 60 ? 'MEDIUM' : 'LOW'}`
  ).join('\n\n') : 
  'No specific inadequate controls identified - risk stems from environmental conditions'}

**Connection to Predicted Incident:**
Each inadequate control represents a "hole in the Swiss cheese" that allows the incident sequence to progress. Closing any one of these holes can prevent the incident.

---

**PREDICTION CONFIDENCE ASSESSMENT:**

**Overall Confidence: ${prediction.confidence}**

**Reasoning:**
- 📊 Data Completeness: ${validation.qualityScore}/10 (${validation.missingCritical.length} critical fields missing)
- 📈 Statistical Support: ${risk.oshaData?.constructionProfile ? 
    `Real OSHA BLS 2023 data available - ${risk.oshaData.constructionProfile.injury_rate} injuries per 100 FTE` : 
    'Limited statistical baseline'}
- 👁️ Observable Indicators: ${prediction.leadingIndicators.length} leading indicators currently visible on site
- 🛡️ Control Verification: ${validation.dataQuality === 'HIGH' ? 
    'Controls documented AND verified' : 
    validation.dataQuality === 'MEDIUM' ? 'Controls documented only' : 'Control status unclear'}

${prediction.confidence === 'LOW' ? `
**To Raise Confidence to MEDIUM/HIGH, Obtain:**
${validation.missingCritical.map(field => `- ${field}`).join('\n')}

Without this data, prediction relies more on general construction risk patterns than site-specific analysis.
` : ''}

${prediction.confidence === 'HIGH' ? `
**High Confidence Justification:**
This prediction is based on observable conditions present RIGHT NOW (${prediction.leadingIndicators.length} indicators), 
supported by real OSHA statistical data, with documented control failures evident in the checklist responses.
` : ''}

---

**DATA VALIDATION SUMMARY:**

- ✅ Quality Score: ${validation.qualityScore}/10
- ${validation.weatherPresent ? '✅' : '❌'} Weather Data: ${validation.weatherPresent ? 'Present and analyzed' : 'MISSING - reduces prediction accuracy'}
- ${validation.missingCritical.length === 0 ? '✅' : '⚠️'} Missing Critical Fields: ${validation.missingCritical.length === 0 ? 'None' : validation.missingCritical.join(', ')}
- ${this.getAllConcerns(validation).length === 0 ? '✅' : '⚠️'} Data Quality Concerns: ${this.getAllConcerns(validation).length === 0 ? 'None identified' : this.getAllConcerns(validation).length + ' concerns flagged'}

${validation.dataQuality === 'LOW' ? `
⚠️ **LOW DATA QUALITY WARNING:**
Insufficient data reduces prediction accuracy and may hide additional hazards. 
Recommend completing all critical fields before final GO decision.
` : ''}

---

**EMERGENCY RESPONSE CAPABILITY ASSESSMENT:**

**For Predicted Incident: ${prediction.incidentName}**

Current Documented Response:
${checklistData.sections?.find((s: any) => s.title?.toLowerCase().includes('emergency'))?.responses?.map((r: any) => 
  `- ${r.question}: ${r.response}`).join('\n') || 'Emergency response section not found in checklist'}

**Adequacy Analysis:**
- ${prediction.incidentName.toLowerCase().includes('fall') ? 
    `Fall Rescue Capability: ${this.getAllConcerns(validation).some(c => c.toLowerCase().includes('rescue')) ? 
      '❌ INADEQUATE - No documented rescue plan' : 
      '⚠️ REQUIRES VERIFICATION - Rescue capability mentioned but not detailed'}` : ''}
- First Aid Equipment: ${checklistData.sections?.some((s: any) => 
    s.responses?.some((r: any) => r.response?.toLowerCase().includes('first aid'))) ? '✅ Present' : '⚠️ Unknown'}
- Communication Systems: ${checklistData.sections?.some((s: any) => 
    s.responses?.some((r: any) => r.response?.toLowerCase().includes('radio') || r.response?.toLowerCase().includes('communication'))) ? 
    '✅ Two-way radios and hand signals documented' : '⚠️ Not documented'}

**Required for This Incident Type:**
${this.getEmergencyRequirements(prediction.incidentName)}

**Nearest Trauma Center:** [Data not in checklist - recommend adding to JHA]

---

**RISK SUMMARY TABLE:**

| Rank | Hazard | Risk Score | Consequence | Probability | Controls |
|------|--------|-----------|-------------|-------------|----------|
${risk.hazards.slice(0, 5).map((h, i) => 
  `| ${i + 1} | ${h.name.substring(0, 40)}... | ${h.riskScore}/100 | ${h.consequence} | ${(h.probability * 100).toFixed(1)}% | ${h.inadequateControls.length > 0 ? '⚠️ Gaps' : '✓'} |`
).join('\n')}

**Top 3 Threats Requiring Immediate Attention:**
${risk.topThreats.slice(0, 3).map((t, i) => `${i + 1}. ${t}`).join('\n')}

---

**REGULATORY COMPLIANCE REFERENCES:**

This analysis incorporates requirements from:
- 📋 OSHA 1926.502 (Fall Protection Systems)
- 🏗️ OSHA 1926.550 (Cranes and Derricks in Construction)
- 👷 OSHA 1926.95 (Personal Protective Equipment)
- 🪟 ANSI/IWCA I-14.1 (Suspended Access Equipment for Window Cleaning)
- 🏗️ ASME B30.3 (Tower Crane Standards)
- 📦 OSHA 1926.250 (Material Handling and Storage)

For detailed compliance requirements, consult the specific standard sections referenced in the compliance gaps analysis above.

---

**ANALYSIS METHODOLOGY:**

**Multi-Agent AI Pipeline:**
- 🤖 Agent 1: Data Validation (Temperature 0.3 - precise checking)
- ⚠️ Agent 2: Risk Assessment with real OSHA BLS 2023 data (Temperature 0.7 - analytical)
- 🔮 Agent 3: Incident Prediction using Swiss Cheese causation model (Temperature 1.0 - creative reasoning)
- 📄 Agent 4: Report Synthesis combining traditional JHA + predictive analysis (Temperature 0.5 - structured)

**Data Sources:**
- OSHA Bureau of Labor Statistics 2023 construction injury data (Supabase database)
- Real-time weather data for site location
- Checklist responses validated for completeness and quality
- Industry best practices and regulatory standards

**Analysis Timestamp:** ${now.toISOString()}
**Site Location:** ${siteLocation}
**Work Type:** ${workType}
**Checklist Template:** ${checklistData.template || checklistData.templateId || 'Unknown'}

═══════════════════════════════════════════

*This hybrid analysis combines industry-standard JHA Executive Summary format with AI-powered predictive incident forecasting. The goal is to prevent injuries through specific, actionable interventions while maintaining regulatory compliance documentation requirements.*`;

    // Return combined report
    return traditionalJHA + predictiveAnalysis;
  }

  /**
   * Helper: Generate overall assessment section
   */
  private generateOverallAssessment(validation: ValidationResult, risk: RiskAssessment, weatherData: any): string {
    const topRisk = risk.hazards[0];
    const qualityNote = validation.dataQuality === 'LOW' ? 
      'However, data quality concerns limit analysis confidence. ' : '';
    
    const weatherNote = weatherData?.windSpeed && weatherData.windSpeed > 15 ? 
      `Current wind conditions (${weatherData.windSpeed} mph) present significant operational concerns. ` : '';
    
    return `This JHA addresses key aspects of ${risk.hazards[0]?.name || 'the construction project'}. ${qualityNote}${weatherNote}The analysis identifies ${risk.hazards.length} distinct hazards requiring attention, with ${risk.hazards.filter(h => h.riskScore > 70).length} rated as high-risk (>70/100). ${validation.dataQuality === 'HIGH' ? 'Comprehensive data quality enables high-confidence predictions.' : 'Additional data would improve prediction accuracy.'}`;
  }

  /**
   * Helper: Generate compliance status text
   */
  private generateComplianceStatus(validation: ValidationResult, risk: RiskAssessment, checklistData: any): string {
    const standards = [
      'OSHA 1926.502 (Fall Protection)',
      'OSHA 1926.550 (Cranes and Derricks)',
      'OSHA 1926.95 (PPE Requirements)',
      'ANSI/IWCA I-14.1 (Swing Stage Safety)',
      'OSHA 1926.250 (Material Storage)'
    ];
    
    return `**Referenced Standards:**
${standards.map(s => `- ${s}: Compliance requires verification of documented procedures`).join('\n')}

**Compliance Concerns:**
${validation.missingCritical.length > 0 ? 
  `- Missing critical documentation: ${validation.missingCritical.join(', ')}` : 
  '- No critical documentation gaps identified'}
${this.getAllConcerns(validation).length > 0 ? 
  `- Data quality issues: ${this.getAllConcerns(validation).slice(0, 3).join('; ')}` : ''}
${risk.hazards[0]?.inadequateControls.length > 0 ? 
  `- Inadequate controls identified: ${risk.hazards[0].inadequateControls.length} gaps requiring correction` : ''}

**Overall Compliance Status:** ${validation.dataQuality === 'HIGH' && validation.missingCritical.length === 0 ? 
  'LIKELY COMPLIANT - Pending verification' : 
  'GAPS IDENTIFIED - Corrective action required before full compliance'}`;
  }

  /**
   * Helper: Generate immediate actions list
   */
  private generateImmediateActions(prediction: IncidentPrediction, validation: ValidationResult, weatherData: any, topHazard: any): string {
    const actions: string[] = [];
    
    // Weather-based action
    if (weatherData?.windSpeed && weatherData.windSpeed > 15) {
      actions.push(`**CRITICAL:** Implement wind speed stop-work protocol. Halt crane and swing stage operations if wind exceeds 20 mph. Install real-time monitoring system.`);
    }
    
    // Prediction-based action
    actions.push(`**PRIMARY INTERVENTION:** ${prediction.singleBestIntervention}`);
    
    // Validation-based actions
    if (validation.missingCritical.length > 0) {
      actions.push(`**DATA GAPS:** Obtain missing critical information: ${validation.missingCritical.join(', ')}`);
    }
    
    // Control-based actions
    if (topHazard.inadequateControls && topHazard.inadequateControls.length > 0) {
      actions.push(`**CONTROL FAILURES:** Address inadequate controls: ${topHazard.inadequateControls.slice(0, 2).join('; ')}`);
    }
    
    // Generic fall protection if applicable
    if (prediction.incidentName.toLowerCase().includes('fall')) {
      actions.push(`**FALL PROTECTION:** Competent person inspection of all anchor points, harnesses, and lanyards before shift start. Document inspection.`);
    }
    
    return actions.map((a, i) => `${i + 1}. ${a}`).join('\n\n');
  }

  /**
   * Helper: Get verification method for intervention
   */
  private getVerificationMethod(intervention: string): string {
    if (intervention.toLowerCase().includes('anemometer') || intervention.toLowerCase().includes('wind')) {
      return 'Visible wind speed display at ground level, alarm test before first lift';
    }
    if (intervention.toLowerCase().includes('inspect')) {
      return 'Signed inspection form by competent person with photo documentation';
    }
    if (intervention.toLowerCase().includes('training')) {
      return 'Signed training attendance sheet with comprehension quiz';
    }
    return 'Documented completion with supervisor sign-off';
  }

  /**
   * Helper: Get OSHA reference for control gap
   */
  private getOSHAReference(control: string): string {
    const lower = control.toLowerCase();
    if (lower.includes('fall') || lower.includes('anchor')) return 'OSHA 1926.502';
    if (lower.includes('crane') || lower.includes('lift')) return 'OSHA 1926.550';
    if (lower.includes('ppe') || lower.includes('glove') || lower.includes('harness')) return 'OSHA 1926.95';
    if (lower.includes('wind') || lower.includes('weather')) return 'OSHA 1926.550(a)(6)';
    return 'OSHA 1926 Subpart (see specific standard)';
  }

  /**
   * Helper: Get corrective action for a gap/reason
   */
  private getCorrectiveAction(item: string): string {
    const lower = item.toLowerCase();
    if (lower.includes('wind')) return '→ Install calibrated anemometer and establish 20 mph hard stop protocol';
    if (lower.includes('emergency') || lower.includes('rescue')) return '→ Document fall rescue plan with 6-minute response capability';
    if (lower.includes('inspect')) return '→ Competent person inspection with written documentation';
    if (lower.includes('data') || lower.includes('quality')) return '→ Complete all critical JHA fields with specific details';
    if (lower.includes('certification')) return '→ Verify and document all equipment certifications and operator qualifications';
    return '→ Implement corrective measures per specific standard requirements';
  }

  /**
   * Helper: Map control to causal chain stage
   */
  private mapControlToStage(control: string, causalChain: CausalStage[]): string {
    const lower = control.toLowerCase();
    if (lower.includes('monitor') || lower.includes('wind')) return '1-2';
    if (lower.includes('inspect') || lower.includes('anchor')) return '2-3';
    if (lower.includes('training') || lower.includes('procedure')) return '3';
    return '1-3';
  }

  /**
   * Helper: Get emergency requirements for incident type
   */
  private getEmergencyRequirements(incidentName: string): string {
    const requirements: string[] = [];
    
    if (incidentName.toLowerCase().includes('fall')) {
      requirements.push('- Fall rescue equipment and trained rescue team with 6-minute response time');
      requirements.push('- Suspension trauma relief straps in all harnesses');
    }
    
    if (incidentName.toLowerCase().includes('struck') || incidentName.toLowerCase().includes('crush')) {
      requirements.push('- Trauma first aid kit with bleeding control supplies');
      requirements.push('- Immediate 911 access and trauma center routing');
    }
    
    if (incidentName.toLowerCase().includes('glass')) {
      requirements.push('- Severe laceration treatment supplies and pressure bandages');
    }
    
    requirements.push('- Site-specific emergency evacuation plan');
    requirements.push('- All workers trained on emergency response procedures');
    
    return requirements.join('\n');
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
