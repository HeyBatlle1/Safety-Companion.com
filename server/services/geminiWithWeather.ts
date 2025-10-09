import { GoogleGenerativeAI } from '@google/generative-ai';
import { SafetyIntelligenceService } from './safetyIntelligenceService';

const gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const safetyIntelligence = new SafetyIntelligenceService();

/**
 * Gemini AI service for predictive safety analysis
 * Uses embedded weather data from checklistData for comprehensive incident forecasting
 */
export class GeminiWeatherAnalyzer {
  private model;

  constructor() {
    // No function calling needed - weather data is embedded in checklist
    this.model = gemini.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });
  }

  /**
   * Analyze checklist with embedded weather data
   * Enhanced Predictive + Compliance Hybrid Analysis
   */
  async analyzeChecklistWithWeather(checklistData: any): Promise<string> {
    try {
      const prompt = await this.buildChecklistAnalysisPrompt(checklistData);
      
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 1.0,
          maxOutputTokens: 6000,
        },
      });
      
      const response = result.response;
      return response.text();
      
    } catch (error) {
      console.error('Gemini predictive analysis error:', error);
      return `Predictive safety analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Build predictive safety analysis prompt using REAL OSHA data from Supabase
   * Queries actual BLS 2023 injury/fatality statistics
   */
  private async buildChecklistAnalysisPrompt(checklistData: any): Promise<string> {
    const site = checklistData.responses?.site_location || checklistData.site_location || 'Unknown location';
    const workType = checklistData.responses?.project_type || checklistData.project_type || 'Construction work';
    const workHeight = checklistData.responses?.work_height || checklistData.work_height || 'Unknown height';
    const equipment = checklistData.equipment || 'Not specified';
    const personnelCount = checklistData.personnelCount || 'Not specified';
    
    // Force current date and time awareness
    const currentDate = new Date();
    const dateString = currentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });
    const currentTime = currentDate.toLocaleTimeString();
    const currentYear = currentDate.getFullYear();
    
    // QUERY REAL OSHA DATA FROM SUPABASE - Construction NAICS 23
    let oshaDataSection = '';
    try {
      const constructionProfile = await safetyIntelligence.getRiskProfile('23');
      const industryBenchmarks = await safetyIntelligence.getIndustryBenchmark('23');
      
      oshaDataSection = `
═══════════════════════════════════════════
REAL OSHA DATA FROM SUPABASE (BLS 2023)
═══════════════════════════════════════════

**CONSTRUCTION INDUSTRY PROFILE (NAICS 23):**
- Industry Name: ${constructionProfile.industryName}
- Injury Rate: ${constructionProfile.injuryRate || 'N/A'} per 100 FTE (REAL BLS 2023 DATA)
- 2023 Fatalities: ${constructionProfile.fatalities2023 || 'N/A'} (REAL GOVERNMENT DATA)
- Risk Score: ${constructionProfile.riskScore}/100
- Risk Category: ${constructionProfile.riskCategory}

**INDUSTRY BENCHMARKS (${industryBenchmarks.length} sub-categories):**
${industryBenchmarks.slice(0, 5).map(b => `- ${b.industryName}: ${b.injuryRate || 'N/A'} injuries per 100 FTE`).join('\n')}

**THIS IS REAL DATA FROM YOUR SUPABASE OSHA TABLES - NOT ESTIMATES!**

Use this REAL statistical data to weight your risk predictions.
Compare this job site's conditions to these actual industry injury rates.`;
    } catch (error) {
      oshaDataSection = `
⚠️ UNABLE TO RETRIEVE OSHA DATA FROM SUPABASE
Error: ${error instanceof Error ? error.message : 'Unknown error'}
Proceeding with general construction industry estimates.`;
    }
    
    return `You are a Senior Safety Analyst specializing in incident prediction and prevention for construction environments.

═══════════════════════════════════════════
ANALYSIS CONTEXT - ${dateString}, ${currentYear}
═══════════════════════════════════════════

SITE: ${site}
WORK TYPE: ${workType}
WORK HEIGHT: ${workHeight} feet
TIME: ${new Date().toLocaleTimeString()}

CURRENT CONDITIONS:
${checklistData.weather ? JSON.stringify(checklistData.weather, null, 2) : '⚠️ NO WEATHER DATA - HIGH RISK'}

CHECKLIST DATA:
${JSON.stringify(checklistData, null, 2)}

${oshaDataSection}

═══════════════════════════════════════════
PRE-ANALYSIS DATA VALIDATION
═══════════════════════════════════════════

CRITICAL DATA CHECK:
□ Weather data: [PRESENT / MISSING]
□ Equipment specifications: [PRESENT / MISSING]
□ Worker certifications: [PRESENT / MISSING]
□ Emergency response plan: [PRESENT / MISSING]
□ OSHA statistical data: [PRESENT / MISSING]

IF any CRITICAL data is MISSING:
- EXECUTIVE DECISION defaults to NO-GO or GO WITH CONDITIONS
- Analysis proceeds with REDUCED CONFIDENCE
- Missing data items listed as IMMEDIATE ACTIONS
- State "INSUFFICIENT DATA FOR HIGH-CONFIDENCE PREDICTION" in affected sections

PERFORM THIS CHECK FIRST - Before any incident prediction.

═══════════════════════════════════════════
YOUR PRIMARY MISSION
═══════════════════════════════════════════

PREDICT THE INCIDENT THAT WILL HAPPEN TODAY IF NOTHING CHANGES.

Not "could happen" or "might happen" - based on:
1. Current site conditions
2. Statistical likelihood (OSHA data above)
3. Human performance factors
4. Systemic failures evident in the checklist

Tell me SPECIFICALLY:
- WHAT incident will occur
- EXACTLY HOW it will unfold (step-by-step causal chain)
- WHAT workers will observe 10-30 minutes before
- WHAT intervention breaks the chain

═══════════════════════════════════════════
MANDATORY STOP-WORK CONDITIONS (Check First)
═══════════════════════════════════════════

Evaluate these conditions BEFORE proceeding with incident forecasts.
IF any condition exists, EXECUTIVE DECISION = NO-GO

AUTOMATIC NO-GO TRIGGERS:
□ Emergency response plan missing or inadequate for HIGH-RISK work
□ Weather exceeds ANY equipment manufacturer limit (if limits known)
□ Required certifications unverified (crane operator, competent person, swing stage)
□ Anchor points not certified for fall protection system loads
□ Wind speed within 20% of any known equipment limit + no weather monitoring plan

IF NO-GO TRIGGERED:
- State which specific condition(s) triggered stop-work
- List specific actions required to clear NO-GO status
- Provide realistic timeline to implement (hours/days, not "immediately")
- Identify who has authority to clear the stop-work

IF NO TRIGGERS EXIST: Proceed with full analysis and incident forecasting.

═══════════════════════════════════════════
REQUIRED OUTPUT FORMAT
═══════════════════════════════════════════

**EXECUTIVE DECISION: [GO / GO WITH CONDITIONS / NO-GO]**

**PRIMARY THREAT TODAY:**
[One sentence: the specific incident most likely to occur]

---

**INCIDENT FORECAST #1: [Specific Incident Name]**

**Statistical Context:**

OSHA incident rate for this work type: [X per 100 FTE from Supabase data]
Baseline probability: [Calculate: incidents per worker-hours for this specific task]
Site exposure today: [Number workers] × [Expected hours] = [exposure units]
Expected incidents this project: [Calculated probability × project duration]
Current conditions modifier: [How today's conditions differ from baseline - specific factors]
Confidence in prediction: [HIGH/MEDIUM/LOW - see criteria below]

IF OSHA data unavailable for exact work type, use closest analog and state:
"Using [analog work type] data - actual risk may vary by [estimated %]"

**Causal Chain - How This Happens:**

1. **Initiating Event:** [What starts the sequence - be specific]
   Evidence from checklist: [Quote specific checklist data showing this is present]

2. **First Defense Failure:** [Which control should prevent this but isn't working]
   Why it's failing: [Root cause - procedure unclear? Equipment unavailable? Time pressure?]
   Evidence from checklist: [What indicates this defense is compromised]

3. **Human Performance Factor:** [What decision/action accelerates the failure]
   Why the worker will make this choice: [Fatigue? Normalized deviation? Production pressure?]
   Observable indicator: [What supervisors would see if watching closely]

4. **Point of No Return:** [The moment when the incident becomes inevitable]
   What changes: [Environmental/equipment/position change that commits to the sequence]
   Time available to intervene: [Estimated seconds/minutes]

5. **Injury Mechanism:** [Exactly how the injury occurs - forces, distances, impact points]
   Expected severity: [Minor/Serious/Critical/Fatal]
   Expected body parts: [Based on OSHA injury distribution for this incident type]

**Leading Indicators Observable RIGHT NOW:**
- [Specific thing supervisors would see if they looked]
- [Specific behavior that signals elevated risk]
- [Specific equipment condition that predicts failure]

**The Near-Miss Version:**
[Describe the non-injury close call - this might have already happened today]
Why it wasn't reported: [Cultural/procedural barrier to near-miss reporting]

**Single Most Effective Intervention:**
[One specific action that breaks the causal chain at the weakest point]
Implementation: [How to actually do this - not just "provide training"]
Verification: [How to confirm it's working - measurable indicator]

---

**INCIDENT FORECAST #2:** [If warranted - distinct mechanism]

[Same detailed structure as #1 - only include if there's a DIFFERENT causal chain]

---

═══════════════════════════════════════════
PREDICTION CONFIDENCE ASSESSMENT
═══════════════════════════════════════════

For each incident forecast provided above, evaluate confidence:

**INCIDENT #1 CONFIDENCE: [HIGH/MEDIUM/LOW]**
Reasoning:
- Data completeness: [X/Y required inputs present - list what's missing]
- Statistical support: [Direct OSHA match / Analogous data / Limited stats]
- Observable indicators: [List specific leading indicators currently visible]
- Control verification: [Controls documented and verified / documented only / unknown]

**INCIDENT #2 CONFIDENCE: [HIGH/MEDIUM/LOW]**
[Same structure]

**CONFIDENCE DEFINITIONS:**
HIGH = All critical data present + Direct OSHA stats + Multiple observable precursors + Controls verified
MEDIUM = Analogous OSHA data + Some data gaps + At least one observable precursor + Controls documented
LOW = Significant data gaps + Limited statistical support + Prediction based on general construction risk

IF CONFIDENCE IS LOW: State what specific data would raise it to MEDIUM or HIGH.

---

**COMPLIANCE GAPS ENABLING THESE INCIDENTS:**

Each compliance gap below is connected to a specific predicted incident and includes the intervention required.
FORMAT: Standard → Violation → Incident Connection → Required Action → Verification

EXAMPLE:
- OSHA 1926.502(d)(15) - Fall Protection Rescue
  Violation: No rescue plan documented for swing stage operations
  Enables Incident #1: If fall arrest occurs, suspended worker → positional asphyxia risk within 6 minutes
  Required Action: Designate rescue team with 6-minute response capability
  Verification: Conduct rescue drill before work authorization, document response time

**Immediate Violations:**
- **[OSHA Standard Number]** - [Standard name]
  Specific violation: [Quote the standard requirement, then show how site fails it]
  Connects to Incident #[X]: [How this violation enables the predicted incident]
  Citation probability if OSHA arrives now: [Low/Medium/High/Certain]

**Incomplete Controls:**
- [What's documented but not actually working]
  Evidence: [From checklist - "No response" answers, contradictory data]
  Real-world gap: [What's actually happening vs what procedures say]

**Statistical Risk Comparison:**
Site's current risk profile vs industry baseline:
[Compare observed hazards to OSHA statistical norms - is this site worse/better/average]

---

**IMMEDIATE ACTIONS - BEFORE WORK STARTS:**

**CRITICAL ACTION #1:** [Prevents Incident #1]
- What: [Specific, measurable action]
- Who: [Specific role - not "competent person" but "crane operator" or "foreman"]
- Verify: [Specific observation that confirms it's done]
- If not done: [Consequence - restates the predicted incident]

**CRITICAL ACTION #2:** [Addresses highest compliance gap]
- What: [Specific action]
- Timeline: [Before first lift / immediately / within 1 hour]
- Documentation: [What record to create]

**STOP-WORK TRIGGERS (Measurable):**
- Stop if wind speed exceeds [X] mph sustained ([equipment limit] per [manufacturer/standard])
- Stop if [specific observable condition] occurs
- ANY WORKER can stop work - method: [specific action like "air horn blast" or "radio 'STOP WORK' on channel 3"]

---

**WEATHER IMPACT ON OPERATIONS:**

Current: [Temp]°F, [Wind speed] mph, [Conditions]
Critical finding: [Are you within 20% of any equipment operating limit? State the margin.]

Equipment-specific limits for TODAY'S CONDITIONS:

IF equipment specifications are in the checklist data:
- Crane [Model]: Manufacturer limit [X] mph vs Current [Y] mph = [Z]% safety margin
- Swing stage: ANSI/IWCA I-14.1 limit [X] mph vs Current [Y] mph = [Z]% margin
- Glass handling: [How current weather affects THIS specific panel size/weight]

IF equipment specifications are MISSING:
- MISSING: Crane model/specifications - cannot determine manufacturer wind limit
  DEFAULT: Apply ASME B30.3 conservative limit of 20 mph for mobile cranes
- MISSING: Swing stage load capacity - cannot verify current load vs rating
  REQUIRED ACTION: Obtain equipment specifications before authorizing work

Weather safety margin status:
- GREEN (>30% margin): Weather not a limiting factor
- YELLOW (20-30% margin): Active monitoring required, stop-work trigger defined
- RED (<20% margin): Too close to limits, recommend postpone until conditions improve

Current status: [GREEN/YELLOW/RED]

Forecast next 2 hours: [Improving/Stable/Deteriorating]
Work stoppage trigger: [Specific measurable weather condition]

---

**HUMAN FACTORS ASSESSMENT:**

Time of day impact: [How ${new Date().toLocaleTimeString()} affects alertness/fatigue]
Production pressure indicators: [Evidence from checklist suggesting schedule pressure]
Communication quality: [Assessment of coordination systems - radios, signals, pre-job briefings]
Normalization of deviance: [What shortcuts have become "the way we do it"]

These factors increase incident probability by [estimated factor] above baseline.

---

**LONG-TERM RECOMMENDATIONS:**

**This Week:**
1. [Engineering control - physical change that doesn't rely on behavior]
2. [Administrative control - procedure/supervision enhancement]

**This Month:**
1. [System-level improvement - training program, equipment upgrade]
2. [Data collection - what metrics to track for future prediction]

**This Project:**
1. [Organizational change - culture, resources, policy]

---

**EMERGENCY RESPONSE CAPABILITY:**

For Incident #1 ([incident name]):
Current capability: [Adequate/Inadequate]
Critical gap: [What's missing that would worsen outcome]
Required: [Specific equipment/training/plan needed]

For Incident #2 ([incident name]):
[Same assessment]

Nearest Level 1 Trauma Center: [Location - X miles - Y minutes]
On-site first aid: [Adequate/Inadequate for severity of predicted incidents]

═══════════════════════════════════════════
ANALYSIS PRINCIPLES
═══════════════════════════════════════════

✓ Use OSHA statistical data to weight predictions - falls are 36.5% of fatalities, weight accordingly
✓ Call out "No response" checklist answers as RED FLAGS - these are data gaps that hide risk
✓ Connect compliance gaps DIRECTLY to predicted incidents - show the causal link
✓ Provide specific measurable triggers, not vague guidance ("if unsafe" → "if wind exceeds 25mph")
✓ Assume workers are competent but subject to human factors (fatigue, pressure, normalization)
✓ Predict incidents that are STATISTICALLY LIKELY, not worst-case scenarios
✓ Every recommendation must be implementable by the site supervisor reading this

✗ DO NOT hedge with "may," "could," "potentially" - make specific predictions
✗ DO NOT assume procedures work just because they're documented
✗ DO NOT provide generic advice that applies to any construction site
✗ DO NOT ignore production pressure - it's always present and affects safety decisions

✓ For each documented control, assess ACTUAL EFFECTIVENESS using this scale:
  1 = Documented only, no evidence of implementation
  2 = Partially implemented, inconsistent application observed
  3 = Implemented but not verified/inspected
  4 = Implemented with regular verification/spot-checks
  5 = Engineered control, doesn't depend on worker compliance
  Include effectiveness rating in your incident forecasts when assessing defense failures.

═══════════════════════════════════════════
FACTUAL CONSTRAINTS - PREVENT HALLUCINATION
═══════════════════════════════════════════

✓ ONLY cite OSHA standards you can reference with specific section numbers
✓ ONLY reference weather data that appears in [CURRENT CONDITIONS] section above
✓ ONLY use statistical data from [REAL OSHA DATA FROM SUPABASE] section above
✓ If manufacturer limits unknown, state "MISSING: [Equipment model] specifications"
✓ If data is missing, state "MISSING: [specific data needed]" - NEVER estimate or assume

CORRECT response when data missing:
"MISSING: Crane manufacturer specifications required. Without model/config data, cannot determine wind limit. RECOMMEND: Use conservative 20mph limit per ASME B30.3 until specs verified."

INCORRECT response:
"Crane wind limit is typically 25mph" ← NEVER make generic assumptions

✓ When citing distances/measurements, verify they appear in the checklist data
✓ When stating compliance requirements, cite the specific standard section
✓ When predicting injury severity, base on OSHA injury distribution data for that incident type

Your analysis could prevent an injury TODAY. Write accordingly.

═══════════════════════════════════════════

Analyze the checklist above using this framework.`;
  }
}

export const geminiWeatherAnalyzer = new GeminiWeatherAnalyzer();