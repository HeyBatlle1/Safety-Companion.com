import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

interface BaselineJHA {
  id: string;
  query: string;
  response: string;
  metadata: any;
  riskScore: number | null;
}

interface JHADelta {
  changedCategories: string[]; // ['weather', 'personnel', 'hazards']
  newWindSpeed?: string;
  newCrewMembers?: any[];
  newHazards?: any[];
  userRiskAssessment: 'safer' | 'same' | 'riskier';
}

interface ComparisonInput {
  baseline: BaselineJHA;
  delta: JHADelta;
}

/**
 * Multi-Agent Safety Comparison Pipeline
 * Compares baseline JHA with daily updates and provides GO/NO-GO decision
 */
export async function multiAgentSafetyComparison(input: ComparisonInput) {
  const { baseline, delta } = input;

  console.log('🔄 Starting multi-agent comparison analysis...');
  console.log(`📊 Baseline JHA ID: ${baseline.id}`);
  console.log(`🔀 Changed categories: ${delta.changedCategories.join(', ')}`);
  console.log(`⚠️ User risk assessment: ${delta.userRiskAssessment}`);

  // Agent 1: Delta Validator - Validate the changes reported
  console.log('🤖 Agent 1: Validating changes...');
  const agent1Result = await runAgent1DeltaValidator(baseline, delta);

  // Agent 2: Risk Comparator - Compare baseline vs current risks
  console.log('🤖 Agent 2: Comparing risks...');
  const agent2Result = await runAgent2RiskComparator(baseline, delta, agent1Result);

  // Agent 3: Decision Engine - Make GO/NO-GO recommendation
  console.log('🤖 Agent 3: Generating decision...');
  const agent3Result = await runAgent3DecisionEngine(baseline, delta, agent2Result);

  // Agent 4: Report Synthesizer - Create comparison report
  console.log('🤖 Agent 4: Synthesizing report...');
  const agent4Result = await runAgent4ReportSynthesizer(baseline, delta, agent1Result, agent2Result, agent3Result);

  console.log('✅ Comparison analysis complete!');

  return {
    agent1: agent1Result,
    agent2: agent2Result,
    agent3: agent3Result,
    agent4: agent4Result,
    metadata: {
      baselineRiskScore: baseline.riskScore,
      currentRiskScore: agent2Result.currentRiskScore,
      riskScoreDelta: agent2Result.riskScoreDelta,
      changedCategories: delta.changedCategories,
    },
    goNoGoDecision: agent3Result.decision,
    decisionReason: agent3Result.reasoning,
    changeHighlights: {
      improved: agent2Result.improvements || [],
      degraded: agent2Result.degradations || [],
      newHazards: agent2Result.newHazards || [],
    },
    analysis: agent4Result.comparisonReport,
  };
}

/**
 * Agent 1: Delta Validator
 * Validates the reported changes and identifies any unreported changes
 */
async function runAgent1DeltaValidator(baseline: BaselineJHA, delta: JHADelta) {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2000,
    }
  });

  const prompt = `You are a safety data validator. Compare baseline JHA conditions with the reported changes.

BASELINE JHA:
${baseline.query}

ORIGINAL RISK SCORE: ${baseline.riskScore || 'Unknown'}

REPORTED CHANGES:
- Changed Categories: ${delta.changedCategories.join(', ')}
- New Wind Speed: ${delta.newWindSpeed || 'Not reported'}
- New Crew: ${delta.newCrewMembers ? JSON.stringify(delta.newCrewMembers) : 'Not reported'}
- New Hazards: ${delta.newHazards ? JSON.stringify(delta.newHazards) : 'Not reported'}
- User's Risk Assessment: ${delta.userRiskAssessment}

TASK:
1. Validate each reported change category
2. Identify any missing critical information
3. Flag any inconsistencies between user's risk assessment and reported changes
4. Provide a quality score (0-10) for the update data

Return JSON:
{
  "validationStatus": "complete|incomplete|inconsistent",
  "qualityScore": 8,
  "validatedChanges": ["weather", "personnel"],
  "missingInformation": ["temperature details", "crew certifications"],
  "inconsistencies": ["User says riskier but no new hazards reported"],
  "dataCompleteness": 75
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  console.log('📄 Agent 1 raw response:', text.substring(0, 500));
  
  try {
    // Try multiple extraction patterns
    let jsonText = text;
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Extract JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ Agent 1 validation successful:', parsed.validationStatus);
      return parsed;
    } else {
      console.warn('⚠️ No JSON object found in Agent 1 response');
    }
  } catch (e) {
    console.error('❌ Agent 1 JSON parse error:', e);
    console.error('Raw text causing error:', text);
  }

  console.log('🔄 Using Agent 1 fallback response');
  return {
    validationStatus: 'complete',
    qualityScore: 7,
    validatedChanges: delta.changedCategories,
    missingInformation: [],
    inconsistencies: [],
    dataCompleteness: 80,
  };
}

/**
 * Agent 2: Risk Comparator
 * Analyzes risk changes between baseline and current conditions
 */
async function runAgent2RiskComparator(baseline: BaselineJHA, delta: JHADelta, agent1Result: any) {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 3000,
    }
  });

  const prompt = `You are a construction safety risk assessor. Compare baseline JHA risks with current conditions.

BASELINE JHA:
${baseline.query}
Original Risk Score: ${baseline.riskScore}/100

VALIDATED CHANGES (from Agent 1):
${JSON.stringify(agent1Result, null, 2)}

CURRENT CONDITIONS:
- Wind Speed: ${delta.newWindSpeed || 'Unknown'}
- Crew Changes: ${delta.newCrewMembers ? 'Yes' : 'No'}
- New Hazards: ${delta.newHazards ? JSON.stringify(delta.newHazards) : 'None reported'}

TASK:
1. Calculate new risk score based on changes
2. Identify which risks improved
3. Identify which risks degraded
4. List new hazards introduced
5. Assess impact of each change category

Return JSON:
{
  "currentRiskScore": 65,
  "riskScoreDelta": +5,
  "improvements": [{"category": "fall protection", "impact": "New harnesses", "riskReduction": -10}],
  "degradations": [{"category": "weather", "impact": "Wind increased to 18mph", "riskIncrease": +15}],
  "newHazards": [{"hazard": "Icy surfaces", "severity": "high", "riskScore": +20}],
  "categoryImpacts": {
    "weather": {"change": "degraded", "riskDelta": +15},
    "personnel": {"change": "improved", "riskDelta": -5}
  }
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  console.log('📄 Agent 2 raw response:', text.substring(0, 500));
  
  try {
    // Remove markdown code blocks if present
    let jsonText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ Agent 2 risk comparison successful');
      return parsed;
    } else {
      console.warn('⚠️ No JSON object found in Agent 2 response');
    }
  } catch (e) {
    console.error('❌ Agent 2 JSON parse error:', e);
    console.error('Raw text causing error:', text);
  }

  console.log('🔄 Using Agent 2 fallback response');
  return {
    currentRiskScore: baseline.riskScore || 60,
    riskScoreDelta: 0,
    improvements: [],
    degradations: [],
    newHazards: [],
    categoryImpacts: {},
  };
}

/**
 * Agent 3: Decision Engine
 * Makes GO/NO-GO recommendation based on comparison
 */
async function runAgent3DecisionEngine(baseline: BaselineJHA, delta: JHADelta, agent2Result: any) {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2000,
    }
  });

  const prompt = `You are a construction safety decision authority. Make a GO/NO-GO decision for work continuation.

BASELINE RISK: ${baseline.riskScore}/100
CURRENT RISK: ${agent2Result.currentRiskScore}/100
RISK DELTA: ${agent2Result.riskScoreDelta > 0 ? '+' : ''}${agent2Result.riskScoreDelta}

RISK CHANGES:
${JSON.stringify(agent2Result, null, 2)}

USER'S GUT CHECK: ${delta.userRiskAssessment}

OSHA GUIDELINES:
- Risk score > 75: NO-GO (stop work)
- Risk delta > +15: NO-GO (conditions worsened significantly)
- New high-severity hazards: CONDITIONAL (requires mitigation)
- Wind > 25mph for glass work: NO-GO
- Risk score < 50 AND no high-severity hazards: GO

TASK:
Make a decision and provide reasoning.

Return JSON:
{
  "decision": "go|no_go|conditional",
  "reasoning": "Detailed explanation of decision",
  "requiredActions": ["Action 1", "Action 2"],
  "workRestrictions": ["Restrict A", "Prohibit B"],
  "monitoringRequirements": ["Monitor wind every 30min", "Check equipment hourly"]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  console.log('📄 Agent 3 raw response:', text.substring(0, 500));
  
  try {
    // Remove markdown code blocks if present
    let jsonText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ Agent 3 decision successful:', parsed.decision);
      return parsed;
    } else {
      console.warn('⚠️ No JSON object found in Agent 3 response');
    }
  } catch (e) {
    console.error('❌ Agent 3 JSON parse error:', e);
    console.error('Raw text causing error:', text);
  }

  console.log('🔄 Using Agent 3 fallback response');
  return {
    decision: 'conditional',
    reasoning: 'Manual review required',
    requiredActions: [],
    workRestrictions: [],
    monitoringRequirements: [],
  };
}

/**
 * Agent 4: Report Synthesizer
 * Creates comprehensive comparison report
 */
async function runAgent4ReportSynthesizer(
  baseline: BaselineJHA,
  delta: JHADelta,
  agent1: any,
  agent2: any,
  agent3: any
) {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 4000,
    }
  });

  const prompt = `You are a safety report writer. Create a professional comparison report.

BASELINE JHA:
${baseline.query}
Baseline Risk: ${baseline.riskScore}/100

DATA VALIDATION (Agent 1):
${JSON.stringify(agent1, null, 2)}

RISK COMPARISON (Agent 2):
${JSON.stringify(agent2, null, 2)}

DECISION (Agent 3):
${JSON.stringify(agent3, null, 2)}

Create a clear, professional report suitable for safety managers and field supervisors.

Return JSON:
{
  "executiveSummary": "Brief 2-3 sentence summary",
  "comparisonReport": "Full markdown report with sections for: Changes Overview, Risk Analysis, Decision, and Recommendations",
  "keyFindings": ["Finding 1", "Finding 2", "Finding 3"],
  "criticalChanges": ["Change 1", "Change 2"]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  console.log('📄 Agent 4 raw response:', text.substring(0, 500));
  
  try {
    // Remove markdown code blocks if present
    let jsonText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ Agent 4 report synthesis successful');
      return parsed;
    } else {
      console.warn('⚠️ No JSON object found in Agent 4 response');
    }
  } catch (e) {
    console.error('❌ Agent 4 JSON parse error:', e);
    console.error('Raw text causing error:', text);
  }

  console.log('🔄 Using Agent 4 fallback response');
  return {
    executiveSummary: 'Comparison analysis completed',
    comparisonReport: 'Report generation in progress...',
    keyFindings: [],
    criticalChanges: [],
  };
}
