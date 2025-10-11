import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import {
  EAPQuestionnaire,
  EAPValidation,
  EmergencyClassification,
  EmergencyProcedure,
  GeneratedEAP,
  RequiredEmergency
} from '../types/eap.types.js';
import { db } from '../db.js';
import { agentOutputs } from '../../shared/schema.js';

dotenv.config();

const gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export class EAPGeneratorService {
  private model;

  constructor() {
    this.model = gemini.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });
  }

  /**
   * Main entry point - orchestrates 4-agent EAP generation pipeline
   * @param questionnaire - The EAP questionnaire data
   * @param analysisId - Optional analysis_history record ID for tracking agent outputs
   */
  async generateEAP(questionnaire: EAPQuestionnaire, analysisId?: string): Promise<GeneratedEAP> {
    try {
      console.log('📝 Starting EAP generation pipeline...');

      // AGENT 1: Validate questionnaire data (Temperature 0.3 - precise)
      console.log('✅ Agent 1: Validating questionnaire data...');
      const validationStartTime = Date.now();
      const validation = await this.validateQuestionnaire(questionnaire);
      const validationDuration = Date.now() - validationStartTime;
      console.log(`✓ Validation complete: ${validation.readyToGenerate ? 'Ready' : 'Incomplete'}`);

      // Save Agent 1 output
      if (analysisId) {
        await db.insert(agentOutputs).values({
          analysisId,
          agentId: 'eap_agent_1',
          agentName: 'Data Validator',
          agentType: 'eap_generator',
          outputData: validation,
          executionMetadata: {
            temperature: 0.3,
            executionTime: validationDuration,
            model: 'javascript_validation',
            purpose: 'Validate questionnaire data and check for missing fields'
          },
          success: validation.readyToGenerate
        });
      }

      if (!validation.readyToGenerate) {
        throw new Error(`Incomplete questionnaire: ${validation.missingRequired.join(', ')}`);
      }

      // AGENT 2: Classify required emergencies (Temperature 0.5 - analytical)
      console.log('🔍 Agent 2: Classifying required emergency procedures...');
      const classificationStartTime = Date.now();
      const classification = await this.classifyEmergencies(questionnaire);
      const classificationDuration = Date.now() - classificationStartTime;
      console.log(`✓ Identified ${classification.requiredEmergencies.length} required emergency procedures`);

      // Save Agent 2 output
      if (analysisId) {
        await db.insert(agentOutputs).values({
          analysisId,
          agentId: 'eap_agent_2',
          agentName: 'Emergency Classifier',
          agentType: 'eap_generator',
          outputData: classification,
          executionMetadata: {
            temperature: 0.5,
            executionTime: classificationDuration,
            model: 'gemini-2.5-flash',
            purpose: 'Classify required emergency procedures based on facility characteristics'
          },
          success: true
        });
      }

      // AGENT 3: Generate procedures for each emergency (Temperature 0.7 - detailed)
      console.log('📋 Agent 3: Generating site-specific procedures...');
      const procedures: EmergencyProcedure[] = [];
      const procedureStartTime = Date.now();
      for (const emergency of classification.requiredEmergencies) {
        console.log(`  Writing procedure: ${emergency.type}...`);
        const procedure = await this.generateProcedure(questionnaire, emergency);
        procedures.push(procedure);
      }
      const procedureDuration = Date.now() - procedureStartTime;
      console.log(`✓ Generated ${procedures.length} procedures`);

      // Save Agent 3 output
      if (analysisId) {
        await db.insert(agentOutputs).values({
          analysisId,
          agentId: 'eap_agent_3',
          agentName: 'Procedure Generator',
          agentType: 'eap_generator',
          outputData: { procedures },
          executionMetadata: {
            temperature: 0.7,
            executionTime: procedureDuration,
            model: 'gemini-2.5-flash',
            procedureCount: procedures.length,
            purpose: 'Generate site-specific emergency procedures'
          },
          success: true
        });
      }

      // AGENT 4: Assemble final document (Temperature 0.3 - structured)
      console.log('📄 Agent 4: Assembling OSHA-compliant document...');
      const assemblyStartTime = Date.now();
      const eapDocument = await this.assembleDocument(
        questionnaire,
        validation,
        classification,
        procedures
      );
      const assemblyDuration = Date.now() - assemblyStartTime;
      console.log('✓ EAP generation complete!');

      // Save Agent 4 output
      if (analysisId) {
        await db.insert(agentOutputs).values({
          analysisId,
          agentId: 'eap_agent_4',
          agentName: 'Document Assembler',
          agentType: 'eap_generator',
          outputData: { metadata: eapDocument.metadata, sectionCount: Object.keys(eapDocument.sections).length },
          executionMetadata: {
            temperature: 0.3,
            executionTime: assemblyDuration,
            model: 'gemini-2.5-flash',
            purpose: 'Assemble final OSHA-compliant EAP document'
          },
          success: true
        });
      }

      return eapDocument;

    } catch (error) {
      console.error('❌ EAP generation error:', error);
      throw error;
    }
  }

  /**
   * AGENT 1: Validate questionnaire data
   * Temperature: 0.3 (precise validation)
   * Using JavaScript validation due to Gemini safety blocks
   */
  private async validateQuestionnaire(q: EAPQuestionnaire): Promise<EAPValidation> {
    const missing: string[] = [];
    const warnings: string[] = [];
    const mismatches: string[] = [];

    // Check mandatory fields
    if (!q.companyName) missing.push('Company name');
    if (!q.siteAddress) missing.push('Site address');
    if (!q.city) missing.push('City');
    if (!q.state) missing.push('State');
    if (!q.zipCode) missing.push('ZIP code');
    if (!q.projectDescription) missing.push('Project description');
    if (!q.buildingType) missing.push('Building type');
    
    // Check personnel
    if (!q.emergencyCoordinator.name) missing.push('Emergency coordinator name');
    if (!q.emergencyCoordinator.title) missing.push('Emergency coordinator title');
    if (!q.emergencyCoordinator.phone) missing.push('Emergency coordinator phone');
    if (!q.alternateCoordinator.name) missing.push('Alternate coordinator name');
    if (!q.alternateCoordinator.phone) missing.push('Alternate coordinator phone');
    
    // Check emergency resources
    if (!q.nearestHospital.name) missing.push('Hospital name');
    if (!q.nearestHospital.phone) missing.push('Hospital phone');
    if (!q.fireStation.phone) missing.push('Fire department phone');
    if (!q.localPolice.phone) missing.push('Police phone');
    
    // Check assembly areas
    if (!q.primaryAssembly.location) missing.push('Primary assembly location');
    if (!q.secondaryAssembly.location) missing.push('Secondary assembly location');
    
    // Check alarm systems
    if (!q.alarmSystems || q.alarmSystems.length === 0) missing.push('At least one alarm system');
    
    // Check hazard-equipment alignment
    if (q.hazards.craneOperations && !q.equipment.some(e => e.toLowerCase().includes('crane'))) {
      mismatches.push('Crane operations checked but no crane in equipment list');
    }
    
    // Logical consistency checks
    if (q.buildingHeight && q.buildingHeight > 30 && !q.hazards.fallFromHeight) {
      warnings.push('Building height >30ft but fall hazard not marked');
    }
    
    if (!q.primaryAssembly.gpsCoordinates) {
      warnings.push('Missing GPS coordinates for primary assembly');
    }
    
    if (!q.radioChannel) {
      warnings.push('No radio channel specified');
    }

    return {
      complete: missing.length === 0,
      missingRequired: missing,
      warnings,
      hazardEquipmentMismatches: mismatches,
      readyToGenerate: missing.length === 0
    };
  }

  /**
   * AGENT 2: Classify required emergency procedures
   * Temperature: 0.5 (analytical classification)
   */
  private async classifyEmergencies(q: EAPQuestionnaire): Promise<EmergencyClassification> {
    const prompt = `You are an OSHA emergency planning specialist. Determine which emergency procedures are REQUIRED for this site.

SITE CHARACTERISTICS:
- Company: ${q.companyName}
- Site Type: ${q.siteType}
- Building Height: ${q.buildingHeight || 'N/A'} feet
- Work Elevation: ${q.workElevation || 'N/A'} feet
- Project: ${q.projectDescription}
- Construction Phase: ${q.constructionPhase || 'N/A'}

HAZARDS PRESENT:
${JSON.stringify(q.hazards, null, 2)}

EQUIPMENT IN USE:
${q.equipment.join(', ')}

WEATHER CONCERNS:
${q.weatherConcerns.join(', ')}

CLASSIFICATION RULES:
ALWAYS REQUIRED (every EAP must have):
- Fire emergency
- Medical emergency
- General evacuation

CONDITIONALLY REQUIRED:
- Fall from height rescue: IF buildingHeight >6ft OR workElevation >6ft OR fallFromHeight=true OR swingStage equipment present
- Confined space rescue: IF confinedSpace=true
- Crane emergency: IF craneOperations=true OR "crane" in equipment list
- Swing stage rescue: IF swingStage=true OR "swing stage" in equipment
- Tornado/severe weather: IF weatherConcerns includes tornado/severe storms
- Hazmat spill: IF hazardousMaterials=true
- Structural collapse: IF excavation=true OR demolition=true
- Electrical emergency: IF electricalHighVoltage=true
- Hot work fire watch: IF hotWork=true

PRIORITY LEVELS:
- CRITICAL: Could result in death if not addressed (fall rescue, confined space, crane)
- HIGH: Significant injury risk (electrical, hazmat, structural)
- MEDIUM: Important but lower immediate risk (weather, hot work)

OUTPUT REQUIREMENTS:
Respond with ONLY valid JSON:

{
  "requiredEmergencies": [
    {
      "type": "fall_from_height_rescue",
      "reason": "Work at 90 feet with swing stage operations",
      "oshaReference": "29 CFR 1926.502(d)(20)",
      "criticalDetails": ["6-minute rescue window", "Suspension trauma prevention"],
      "priority": "critical"
    }
  ],
  "optionalEmergencies": ["extreme_heat_protocol", "winter_weather"],
  "totalProcedures": 8
}`;

    try {
      const result = await this.callGemini(prompt, 0.5, 2000);
      const parsed = JSON.parse(this.extractJSON(result));
      return parsed;
    } catch (error) {
      console.error('Agent 2 classification error:', error);
      // Fallback: return minimum required emergencies (all 3 mandatory)
      return {
        requiredEmergencies: [
          {
            type: 'fire_emergency',
            reason: 'Required for all EAPs per OSHA 1926.35',
            oshaReference: '29 CFR 1926.35(b)',
            criticalDetails: ['Evacuation procedures', 'Fire extinguisher use'],
            priority: 'critical'
          },
          {
            type: 'medical_emergency',
            reason: 'Required for all EAPs per OSHA 1926.35',
            oshaReference: '29 CFR 1926.35(b)(4)',
            criticalDetails: ['First aid', 'EMS notification'],
            priority: 'critical'
          },
          {
            type: 'general_evacuation',
            reason: 'Required for all EAPs per OSHA 1926.35',
            oshaReference: '29 CFR 1926.35(a)',
            criticalDetails: ['Evacuation routes', 'Assembly points', 'Head count'],
            priority: 'critical'
          }
        ],
        optionalEmergencies: [],
        totalProcedures: 3
      };
    }
  }

  /**
   * AGENT 3: Generate specific emergency procedure
   * Temperature: 0.7 (detailed, site-specific)
   */
  private async generateProcedure(
    q: EAPQuestionnaire,
    emergency: RequiredEmergency
  ): Promise<EmergencyProcedure> {
    
    const prompt = `You are writing a site-specific emergency procedure for an OSHA-compliant Emergency Action Plan.

SITE INFORMATION:
Company: ${q.companyName}
Location: ${q.siteAddress}, ${q.city}, ${q.state}
Project: ${q.projectDescription}
Building: ${q.buildingType}
Height: ${q.buildingHeight || 'N/A'} feet
Workers: ${q.totalEmployees}

Emergency Coordinator: ${q.emergencyCoordinator.name} (${q.emergencyCoordinator.phone})
Assembly Point: ${q.primaryAssembly.location}
Nearest Hospital: ${q.nearestHospital.name} - ${q.nearestHospital.distance} miles (${q.nearestHospital.phone})
Fire Department: ${q.fireStation.phone}${q.fireStation.estimatedResponseTime ? ` - ${q.fireStation.estimatedResponseTime} min response` : ''}

Alarm Systems: ${q.alarmSystems.join(', ')}
Radio Channel: ${q.radioChannel || 'Not specified'}

EMERGENCY TYPE: ${emergency.type}
WHY REQUIRED: ${emergency.reason}
OSHA REFERENCE: ${emergency.oshaReference}
CRITICAL DETAILS: ${emergency.criticalDetails.join('; ')}

REQUIREMENTS FOR THIS PROCEDURE:
1. Use ACTUAL site details (real names, addresses, phone numbers, distances)
2. Write STEP-BY-STEP procedures with specific timings where critical
3. Include SITE-SPECIFIC challenges (wind, access, equipment locations)
4. Specify EXACT equipment and where it's located
5. Name SPECIFIC personnel with their roles
6. Include ALTERNATIVE plans if primary fails
7. Add VERIFICATION methods to ensure procedure works

WRITE IN THIS FORMAT:
**[EMERGENCY TYPE IN CAPS]**

**When This Applies:**
[Specific triggering conditions]

**Designated Personnel:**
- Primary: [Actual name from questionnaire] ([Role/Certification])
- Backup: [Name or "Site superintendent" if not specified]

**Equipment & Locations:**
[Specific equipment with exact locations on site]

**PROCEDURE STEPS:**
1. **Immediate (0-X seconds):** [First actions with timing]
   - [Specific action using actual site details]
   - [Who does what]

2. **[Next phase (X-Y seconds)]:** [Next actions]
   - [Specific steps]
   
[Continue with numbered, timed steps]

**Site-Specific Factors:**
- [Challenge 1 based on actual site: wind, access, terrain, etc.]
- [Challenge 2]
- [Mitigation for each]

**Alternative if Primary Plan Fails:**
[Backup plan using actual resources - fire department, etc.]

**Training Required:**
[What training workers need for this procedure]

**Verification:**
[How to test this procedure works]

OUTPUT REQUIREMENTS:
Respond with ONLY valid JSON:

{
  "emergencyType": "${emergency.type}",
  "title": "FALL FROM HEIGHT RESCUE PROCEDURE",
  "whenApplicable": "Any worker suspended in fall arrest system at 90-foot elevation",
  "procedureSteps": "[Full formatted procedure text as shown above - use \\n for line breaks]",
  "siteSpecificFactors": "Wind conditions at 90ft, swing stage access from north side, coordination with Fire Station 12",
  "equipmentNeeded": "Rescue kit (Tool Trailer #2), descent device, trauma straps",
  "trainingRequired": "Quarterly rescue drills, fall protection competent person certification",
  "oshaReference": "${emergency.oshaReference}"
}`;

    try {
      const result = await this.callGemini(prompt, 0.7, 3000);
      const parsed = JSON.parse(this.extractJSON(result));
      return parsed;
    } catch (error) {
      console.error(`Agent 3 procedure generation error for ${emergency.type}:`, error);
      // Fallback to comprehensive OSHA-compliant template
      return this.getOSHACompliantFallback(emergency, q);
    }
  }

  /**
   * Get OSHA-compliant fallback procedure (replaces AI-generated content when Gemini blocks)
   */
  private getOSHACompliantFallback(emergency: RequiredEmergency, q: EAPQuestionnaire): EmergencyProcedure {
    const procedures: Record<string, EmergencyProcedure> = {
      fire_emergency: {
        emergencyType: 'fire_emergency',
        title: 'FIRE EMERGENCY PROCEDURE',
        whenApplicable: 'Any fire, smoke, or burning smell detected on site',
        procedureSteps: `═══════════════════════════════════════════
FIRE EMERGENCY PROCEDURE
Per OSHA 29 CFR 1926.35(b) & 1926.150
═══════════════════════════════════════════

**IMMEDIATE ACTIONS:**

1. **DISCOVER FIRE**
   - Anyone discovering fire shall immediately:
   - Sound alarm: ${q.alarmSystems.join(' or ')}
   - Call 911 from ${q.emergencyCoordinator.phone}
   - Notify Emergency Coordinator: ${q.emergencyCoordinator.name}

2. **FIRE ASSESSMENT**
   IF SMALL (wastebasket-sized) AND SAFE TO FIGHT:
   - Use nearest fire extinguisher (Type ABC)
   - PASS method: Pull, Aim, Squeeze, Sweep
   - Keep exit route behind you
   - Fight fire ONLY if trained
   
   IF LARGE OR SPREADING:
   - DO NOT ATTEMPT TO FIGHT
   - Proceed immediately to evacuation

3. **EVACUATION**
   - Close doors behind you (do not lock)
   - Use stairs, NEVER elevators
   - Assist injured/disabled personnel
   - Proceed to Primary Assembly: ${q.primaryAssembly.location}
   - If blocked, use Secondary: ${q.secondaryAssembly.location}

4. **ASSEMBLY & ACCOUNTABILITY**
   - Report to Emergency Coordinator
   - Do NOT re-enter until Fire Department clears site
   - Provide information about trapped personnel

**SITE-SPECIFIC INFORMATION:**
- Building Height: ${q.buildingHeight} feet
- Fire Department: ${q.fireStation.phone}
- Nearest Hospital: ${q.nearestHospital.name} (${q.nearestHospital.phone})
- Distance to Hospital: ${q.nearestHospital.distance} miles`,
        siteSpecificFactors: `${q.buildingType}, ${q.equipment.join(', ')}, ${q.totalEmployees} workers on site`,
        equipmentNeeded: 'Fire extinguishers (Type ABC), alarm systems, emergency lighting',
        trainingRequired: 'Annual fire safety training, fire extinguisher use, evacuation drills',
        oshaReference: '29 CFR 1926.35(b), 29 CFR 1926.150'
      },
      
      medical_emergency: {
        emergencyType: 'medical_emergency',
        title: 'MEDICAL EMERGENCY PROCEDURE',
        whenApplicable: 'Any injury, illness, or medical emergency requiring immediate attention',
        procedureSteps: `═══════════════════════════════════════════
MEDICAL EMERGENCY PROCEDURE
Per OSHA 29 CFR 1926.35(b)(4) & 1926.50
═══════════════════════════════════════════

**IMMEDIATE ACTIONS:**

1. **ASSESS SITUATION**
   - Check scene safety BEFORE approaching victim
   - Identify nature of injury/illness
   - Determine severity: Life-threatening vs non-emergency

2. **CALL FOR HELP**
   **LIFE-THREATENING (unconscious, not breathing, severe bleeding, chest pain):**
   - Call 911 IMMEDIATELY
   - Notify Emergency Coordinator: ${q.emergencyCoordinator.name} at ${q.emergencyCoordinator.phone}
   - Send runner to meet ambulance at site entrance
   
   **NON-EMERGENCY (minor cuts, sprains, minor burns):**
   - Contact Emergency Coordinator
   - Provide first aid from site first aid kit
   - Document on OSHA 300 log if recordable

3. **PROVIDE FIRST AID**
   - Only if trained in first aid/CPR
   - Use PPE (gloves) for bloodborne pathogen protection
   - Keep victim still and comfortable
   - Monitor vital signs until EMS arrives
   - Do NOT move victim unless immediate danger

4. **TRANSPORT DECISION**
   **CALL 911 IF:**
   - Unconscious or altered mental status
   - Difficulty breathing
   - Chest pain or suspected heart attack
   - Severe bleeding
   - Head, neck, or spinal injury
   - Multiple injuries
   - Fall from >6 feet
   
   **TRANSPORT BY VEHICLE IF:**
   - Minor injury but needs medical evaluation
   - Victim is stable and alert
   - Faster than waiting for ambulance

5. **HOSPITAL INFORMATION**
   - Nearest: ${q.nearestHospital.name}
   - Address: ${q.nearestHospital.address}
   - Phone: ${q.nearestHospital.phone}
   - Distance: ${q.nearestHospital.distance} miles
   - ETA: Approximately ${Math.ceil(q.nearestHospital.distance * 2)} minutes

6. **DOCUMENTATION**
   - Complete OSHA 300 log within 7 days if recordable
   - Incident investigation within 24 hours
   - Workers' comp notification if lost time
   
**EMERGENCY CONTACTS:**
- Emergency Coordinator: ${q.emergencyCoordinator.name} - ${q.emergencyCoordinator.phone}
- Alternate: ${q.alternateCoordinator.name} - ${q.alternateCoordinator.phone}
- EMS: 911
- Poison Control: 1-800-222-1222`,
        siteSpecificFactors: `${q.totalEmployees} workers, ${q.buildingHeight}ft elevation, rescue capability: ${q.rescueCapability}`,
        equipmentNeeded: 'First aid kits, AED, emergency eye wash, trauma supplies, communication devices',
        trainingRequired: 'First aid/CPR certification, bloodborne pathogen training, emergency response drills',
        oshaReference: '29 CFR 1926.35(b)(4), 29 CFR 1926.50'
      },
      
      general_evacuation: {
        emergencyType: 'general_evacuation',
        title: 'GENERAL EVACUATION PROCEDURE',
        whenApplicable: 'Any emergency requiring personnel to leave the worksite',
        procedureSteps: `═══════════════════════════════════════════
GENERAL EVACUATION PROCEDURE
Per OSHA 29 CFR 1926.35(a)
═══════════════════════════════════════════

**EVACUATION TRIGGERS:**
- Fire or explosion
- Hazardous material release
- Structural collapse or imminent danger
- Severe weather (tornado, hurricane, lightning)
- Gas leak or utility failure
- Bomb threat or violence threat
- Any order from Emergency Coordinator

**EVACUATION STEPS:**

1. **ALARM ACTIVATION**
   - Emergency Coordinator activates: ${q.alarmSystems.join(' or ')}
   - Continuous alarm = EVACUATE IMMEDIATELY
   - All personnel must respond

2. **IMMEDIATE ACTIONS**
   - Stop work immediately
   - Shut down equipment if time permits (NO DELAY)
   - Grab personal belongings if immediately accessible
   - Close doors (do not lock)
   - Assist injured or disabled personnel

3. **EVACUATION ROUTES**
   - Use nearest marked exit
   - Walk quickly, do NOT run
   - Use stairs, NEVER elevators
   - Stay to right, keep left clear for emergency personnel
   - Do not stop to gather belongings
   - Do not return for any reason

4. **ASSEMBLY AREAS**
   **PRIMARY ASSEMBLY POINT:**
   Location: ${q.primaryAssembly.location}
   GPS: ${q.primaryAssembly.gpsCoordinates || 'See site map'}
   Capacity: ${q.totalEmployees}+ persons
   Features: ${q.primaryAssembly.safetyFeatures || 'Upwind, safe distance from hazards'}
   
   **SECONDARY ASSEMBLY POINT:**
   Location: ${q.secondaryAssembly.location}
   GPS: ${q.secondaryAssembly.gpsCoordinates || 'See site map'}
   Use if primary is blocked or unsafe

5. **ACCOUNTABILITY**
   - Report immediately to Emergency Coordinator
   - Supervisors take headcount of their crews
   - Report missing personnel IMMEDIATELY
   - Provide last known location of missing persons
   - Do NOT re-enter to search

6. **COMMUNICATION**
   - Listen for instructions from Emergency Coordinator
   - Radio channel: ${q.radioChannel || 'Channel 1'}
   - Maintain radio silence except emergencies
   - Cell phones may be used
   - No one leaves without authorization

7. **ALL CLEAR**
   - Emergency Coordinator will announce all clear
   - Return only when authorized
   - Resume work only when safe

**SEVERE WEATHER PROCEDURES:**
${q.weatherEmergencies?.join(', ') || 'Weather concerns'} may require:
- Immediate shelter-in-place vs evacuation
- Move to designated safe area
- Avoid windows and glass
- Low-lying areas away from falling objects

**SPECIAL CONSIDERATIONS:**
- Building Height: ${q.buildingHeight} feet
- Total Employees: ${q.totalEmployees}
- Equipment on Site: ${q.equipment.join(', ')}
- Site Type: ${q.siteType}

**POST-EVACUATION:**
- Emergency Coordinator coordinates with first responders
- Investigation begins once safe
- Site entry requires authorization
- Resume operations only when cleared`,
        siteSpecificFactors: `${q.buildingType}, ${q.projectDescription}, outdoor assembly areas`,
        equipmentNeeded: 'Alarm systems, emergency lighting, evacuation maps, assembly area signs, radios',
        trainingRequired: 'Quarterly evacuation drills, evacuation route familiarization, assembly area procedures',
        oshaReference: '29 CFR 1926.35(a)'
      }
    };

    // Return specific template or create basic one
    return procedures[emergency.type] || {
      emergencyType: emergency.type,
      title: emergency.type.replace(/_/g, ' ').toUpperCase(),
      whenApplicable: emergency.reason,
      procedureSteps: `This procedure must be developed based on site-specific hazards and OSHA requirements.\n\nRefer to: ${emergency.oshaReference}`,
      siteSpecificFactors: q.projectDescription,
      equipmentNeeded: 'Per OSHA requirements',
      trainingRequired: 'Per OSHA requirements',
      oshaReference: emergency.oshaReference
    };
  }

  /**
   * AGENT 4: Assemble complete EAP document
   * Temperature: 0.3 (structured formatting)
   * NOTE: This does NOT call AI - just formats data into sections
   */
  private async assembleDocument(
    q: EAPQuestionnaire,
    validation: EAPValidation,
    classification: EmergencyClassification,
    procedures: EmergencyProcedure[]
  ): Promise<GeneratedEAP> {
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Build each section using the data (these are TypeScript methods, not AI calls)
    const coverPage = this.buildCoverPage(q, dateStr);
    const tableOfContents = this.buildTableOfContents();
    const section1 = this.buildSection1_Policy(q);
    const section2 = this.buildSection2_Responsibilities(q);
    const section3 = this.buildSection3_EmergencyReporting(q);
    const section4 = this.buildSection4_Evacuation(q);
    const section5 = this.buildSection5_Accounting(q);
    const section6 = this.buildSection6_CriticalOperations(q);
    const section7 = this.buildSection7_RescueMedical(q, procedures);
    const section8 = this.buildSection8_Contacts(q);
    const section9 = this.buildSection9_SpecificProcedures(procedures);
    const section10 = this.buildSection10_AlarmSystems(q);
    const section11 = this.buildSection11_Training(q);
    const section12 = this.buildSection12_Review(q);
    const attachments = this.buildAttachments(q);

    return {
      metadata: {
        generatedDate: now.toISOString(),
        companyName: q.companyName,
        siteAddress: `${q.siteAddress}, ${q.city}, ${q.state} ${q.zipCode}`,
        documentVersion: '1.0'
      },
      sections: {
        coverPage,
        tableOfContents,
        section1_policy: section1,
        section2_responsibilities: section2,
        section3_emergencyReporting: section3,
        section4_evacuation: section4,
        section5_accounting: section5,
        section6_criticalOperations: section6,
        section7_rescueMedical: section7,
        section8_contacts: section8,
        section9_specificProcedures: section9,
        section10_alarmSystems: section10,
        section11_training: section11,
        section12_review: section12,
        attachments
      },
      completeness: this.calculateCompleteness(validation, procedures),
      oshaCompliant: validation.readyToGenerate && procedures.length >= 2
    };
  }

  // ==================== HELPER METHODS FOR BUILDING SECTIONS ====================
  // These are TypeScript string template functions - they DON'T call AI
  
  private buildCoverPage(q: EAPQuestionnaire, dateStr: string): string {
    return `
═══════════════════════════════════════════
EMERGENCY ACTION PLAN
═══════════════════════════════════════════

${q.companyName}
${q.projectDescription}

Site Location:
${q.siteAddress}
${q.city}, ${q.state} ${q.zipCode}

Date Created: ${dateStr}
Document Version: 1.0

Site Type: ${q.siteType === 'construction' ? 'Construction' : q.siteType === 'general_industry' ? 'General Industry' : 'Maritime'}
Building Type: ${q.buildingType}
${q.buildingHeight ? `Building Height: ${q.buildingHeight} feet` : ''}
${q.workElevation ? `Work Elevation: ${q.workElevation} feet` : ''}
Number of Workers: ${q.totalEmployees}

This Emergency Action Plan complies with OSHA Standard:
${q.siteType === 'construction' ? '29 CFR 1926.35' : '29 CFR 1910.38'}

Emergency Coordinator: ${q.emergencyCoordinator.name}
Phone: ${q.emergencyCoordinator.phone}

═══════════════════════════════════════════
`.trim();
  }

  private buildTableOfContents(): string {
    return `
═══════════════════════════════════════════
TABLE OF CONTENTS
═══════════════════════════════════════════

Section 1: Company Policy...............................Page 3
Section 2: Assignment of Responsibilities...............Page 4
Section 3: Emergency Reporting Procedures...............Page 5
Section 4: Evacuation Procedures........................Page 6
Section 5: Employee Accounting..........................Page 8
Section 6: Critical Operations Shutdown.................Page 9
Section 7: Rescue and Medical Duties....................Page 10
Section 8: Emergency Contact Information................Page 12
Section 9: Specific Emergency Procedures................Page 13
Section 10: Alarm Systems...............................Page 20
Section 11: Training Requirements.......................Page 21
Section 12: Plan Review and Updates.....................Page 22

Attachments:
- Appendix A: Evacuation Route Maps
- Appendix B: Training Roster
- Appendix C: Equipment Inspection Logs
- Appendix D: Coordination Letters

═══════════════════════════════════════════
`.trim();
  }

  private buildSection1_Policy(q: EAPQuestionnaire): string {
    const oshaStandard = q.siteType === 'construction' ? '29 CFR 1926.35' : '29 CFR 1910.38';
    
    return `
═══════════════════════════════════════════
SECTION 1: COMPANY POLICY
═══════════════════════════════════════════

The objective of this Emergency Action Plan is to comply with the Occupational Safety and Health Administration's (OSHA) Emergency Action Plans Standard, ${oshaStandard}, and to prepare employees for dealing with emergency situations.

This plan is designed to minimize injury and loss of human life and company resources by training employees, procuring and maintaining necessary equipment, and assigning responsibilities.

This plan applies to all emergencies that may reasonably be expected to occur at ${q.companyName} operations located at ${q.siteAddress}, ${q.city}, ${q.state}.

**Scope of Coverage:**
This Emergency Action Plan covers ${q.totalEmployees} employees${q.constructionPhase ? ` working on ${q.constructionPhase}` : ''} at the ${q.buildingType}.

**Hazards Addressed:**
This plan specifically addresses the following hazards present at this site:
${Object.entries(q.hazards)
  .filter(([_, value]) => value === true)
  .map(([key]) => `- ${key.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase())}`)
  .join('\n')}

**Plan Availability:**
This Emergency Action Plan is:
- Posted at the main site entrance
- Available in the site office for employee review
- Discussed during new employee orientation
- Reviewed during monthly safety meetings

`.trim();
  }

  private buildSection2_Responsibilities(q: EAPQuestionnaire): string {
    return `
═══════════════════════════════════════════
SECTION 2: ASSIGNMENT OF RESPONSIBILITIES
═══════════════════════════════════════════

**Emergency Coordinator:**
Name: ${q.emergencyCoordinator.name}
Title: ${q.emergencyCoordinator.title}
Phone: ${q.emergencyCoordinator.phone}
${q.emergencyCoordinator.email ? `Email: ${q.emergencyCoordinator.email}` : ''}

**Responsibilities:**
- Manage and maintain this Emergency Action Plan
- Coordinate with local emergency responders (fire, police, EMS)
- Maintain all training records
- Conduct emergency drills
- Authority to order evacuation or work stoppage
- Primary contact for emergency incidents

**Alternate Emergency Coordinator:**
Name: ${q.alternateCoordinator.name}
Title: ${q.alternateCoordinator.title}
Phone: ${q.alternateCoordinator.phone}
${q.alternateCoordinator.email ? `Email: ${q.alternateCoordinator.email}` : ''}

The Alternate Emergency Coordinator assumes all responsibilities when the Primary Emergency Coordinator is unavailable.

**Additional Contacts for Plan Information:**
Employees can contact the Emergency Coordinator or Alternate for questions about this plan, their responsibilities, or emergency procedures.

`.trim();
  }

  private buildSection3_EmergencyReporting(q: EAPQuestionnaire): string {
    return `
═══════════════════════════════════════════
SECTION 3: EMERGENCY REPORTING PROCEDURES
═══════════════════════════════════════════

**Types of Emergencies to Report Immediately:**
- Fire or smoke
- Medical emergency or serious injury
- Fall from height or worker suspended in fall arrest
- Natural disaster (tornado, earthquake, flood)
- Hazardous material spill or release
- Structural instability or collapse
- Equipment failure (crane, aerial lift, etc.)
- Electrical emergency
- Workplace violence or active threat
- Any life-threatening situation

**How to Report an Emergency:**

**Step 1: Alert Others**
Use available alarm systems:
${q.alarmSystems.map(system => `- ${system}`).join('\n')}
${q.radioChannel ? `\n**Radio Protocol:** Broadcast "EMERGENCY - [type] at [location]" on ${q.radioChannel}` : ''}

**Step 2: Call for Help**
- **Life-threatening emergencies:** Call 911 FIRST
- **All emergencies:** Notify Emergency Coordinator: ${q.emergencyCoordinator.phone}

**Step 3: Provide Information**
When calling 911 or Emergency Coordinator, state:
1. Type of emergency (fire, medical, fall, etc.)
2. Exact location: ${q.siteAddress}, ${q.city}, ${q.state}
   - Building/area: ${q.buildingType}
   - Specific floor/location if known
3. Number of people involved/injured
4. Your name and callback number${q.radioChannel ? ` (or radio ${q.radioChannel})` : ''}
5. Any immediate hazards (fire spreading, structural instability, etc.)

**Step 4: Meet Emergency Responders**
${q.siteAccessNotes ? `- Site Access: ${q.siteAccessNotes}\n` : ''}- Designated person will meet responders at main entrance to guide them
- Have site layout and emergency information ready

**DO NOT Hang Up** until emergency operator tells you to.

`.trim();
  }

  private buildSection4_Evacuation(q: EAPQuestionnaire): string {
    return `
═══════════════════════════════════════════
SECTION 4: EVACUATION PROCEDURES
═══════════════════════════════════════════

**Assembly Areas:**

**Primary Assembly Point:**
${q.primaryAssembly.location}
${q.primaryAssembly.gpsCoordinates ? `GPS: ${q.primaryAssembly.gpsCoordinates}` : ''}

**Secondary Assembly Point:**
${q.secondaryAssembly.location}
${q.secondaryAssembly.gpsCoordinates ? `GPS: ${q.secondaryAssembly.gpsCoordinates}` : ''}

Use secondary assembly point if primary is unsafe or inaccessible.

**Evacuation Procedures:**

**When Evacuation is Ordered:**
1. **Stop work immediately** - Secure tools/equipment only if safe (< 30 seconds)
2. **Alert others** - Notify nearby workers of evacuation
3. **Close doors** - Close doors behind you (DO NOT LOCK)
4. **Use nearest safe exit** - Refer to posted evacuation maps
   - DO NOT USE ELEVATORS${q.buildingHeight && q.buildingHeight > 30 ? ' - Use stairs only' : ''}
5. **Assist others** - Help those who need assistance
6. **Proceed to assembly area** - Walk, do not run
7. **Report to supervisor** - Check in for head count
8. **Stay at assembly point** - DO NOT leave or re-enter until "All Clear"

**Evacuation Routes:**
[PLACEHOLDER: Attach site-specific evacuation route maps showing:
- All exit locations
- Primary and alternate routes from each area
- Assembly point locations
- Location of fire extinguishers and first aid stations]

**When to Evacuate:**
- Fire alarm activation
- Smoke or fire observed
- Structural instability or collapse warning
- Hazardous material release
- Tornado warning
- Emergency Coordinator orders evacuation
- Any immediate threat to life safety

**Who Can Order Evacuation:**
- Emergency Coordinator: ${q.emergencyCoordinator.name}
- Alternate Coordinator: ${q.alternateCoordinator.name}
- Any employee may initiate evacuation if immediate danger observed

`.trim();
  }

  private buildSection5_Accounting(q: EAPQuestionnaire): string {
    return `
═══════════════════════════════════════════
SECTION 5: EMPLOYEE ACCOUNTING
═══════════════════════════════════════════

**Purpose:**
To account for all ${q.totalEmployees} employees after evacuation and identify anyone missing who may require rescue.

**Accounting Procedures:**

**Before Emergency:**
- Daily sign-in sheet maintained at site entrance
- Current employee roster posted in site office
- Visitor log maintained for all non-employees on site
- Contractor/subcontractor employee counts confirmed daily

**During Evacuation:**
- Supervisors conduct head counts of their crews
- Names of missing persons reported immediately to Emergency Coordinator
- DO NOT re-enter to search - inform emergency responders

**At Assembly Area:**
- Emergency Coordinator or Alternate takes roll call
- Each supervisor reports crew status:
  * Number of employees accounted for
  * Names of anyone missing
  * Last known location of missing persons
  * Any known injuries requiring medical attention

**Accountability Tools:**
- Employee roster (updated daily)
- Visitor sign-in log
- Contractor lists
- Radio communication: ${q.radioChannel || 'As available'}

**Missing Persons Protocol:**
If anyone is unaccounted for:
1. Report names and last known locations to Emergency Coordinator
2. Emergency Coordinator notifies 911/emergency responders
3. Provide specific location information to rescue teams
4. NO employees attempt rescue - wait for trained responders
5. Continue accounting until all personnel located

**All Clear:**
Only the Emergency Coordinator or fire department can give "All Clear" to return to work.

`.trim();
  }

  private buildSection6_CriticalOperations(q: EAPQuestionnaire): string {
    const equipmentList = q.equipment.length > 0 ? q.equipment.join(', ') : 'Various construction equipment';
    
    return `
═══════════════════════════════════════════
SECTION 6: CRITICAL OPERATIONS SHUTDOWN
═══════════════════════════════════════════

**Purpose:**
To safely shut down critical operations and equipment before evacuation to prevent additional hazards.

**Equipment at This Site:**
${equipmentList}

**Shutdown Priorities:**

**IMMEDIATE (0-30 seconds):**
${q.hazards.craneOperations ? '- **Cranes:** Set load down, engage brake, shut down engine\n' : ''}${q.hazards.hotWork ? '- **Hot Work:** Extinguish torches, shut off gas valves\n' : ''}${q.hazards.electricalHighVoltage ? '- **Electrical:** De-energize if safe to do so\n' : ''}- **Power Tools:** Drop tools, leave powered equipment where it is
- **DO NOT DELAY** evacuation to shut down equipment

**IF TIME PERMITS (30-60 seconds):**
- Close gas/fuel valves if immediately accessible
- Shut down generators or compressors
- Secure crane loads if operator is at controls
- Turn off welding equipment

**NEVER Delay Evacuation To:**
- Retrieve personal items
- Shut down non-critical equipment
- Secure materials or tools
- Document work in progress

**Designated Shutdown Personnel:**
Emergency Coordinator: ${q.emergencyCoordinator.name}
Alternate: ${q.alternateCoordinator.name}

Only designated personnel may delay evacuation for critical shutdown procedures, and only if:
- No immediate life threat exists
- Shutdown can be completed in under 60 seconds
- Emergency responders have not arrived on scene

**Post-Shutdown:**
- All personnel report to assembly area for accounting
- Equipment status reported to Emergency Coordinator
- Restart procedures followed only after "All Clear" given

`.trim();
  }

  private buildSection7_RescueMedical(q: EAPQuestionnaire, procedures: EmergencyProcedure[]): string {
    const rescueType = q.rescueOption === 'local_fire_ems' ? 'Local Fire Department/EMS' :
                      q.rescueOption === 'trained_employees' ? 'Trained Employee Rescue Team' :
                      'Contracted Rescue Service';
    
    return `
═══════════════════════════════════════════
SECTION 7: RESCUE AND MEDICAL DUTIES
═══════════════════════════════════════════

**Rescue Service Provider:**
${rescueType}

**Medical Emergencies:**

**Life-Threatening Emergencies:**
- Call 911 immediately
- Begin CPR if trained and necessary
- Control severe bleeding with direct pressure
- Keep patient calm and still
- DO NOT move patient unless immediate danger (fire, collapse)

**Non-Life-Threatening Injuries:**
- Provide first aid if trained
- Notify Emergency Coordinator: ${q.emergencyCoordinator.phone}
- Transport to hospital if needed

**Nearest Medical Facility:**
${q.nearestHospital.name}
${q.nearestHospital.address}
Distance: ${q.nearestHospital.distance} miles
Phone: ${q.nearestHospital.phone}
${q.nearestHospital.traumaLevel ? `Trauma Level: ${q.nearestHospital.traumaLevel}` : ''}

**Directions to Hospital:**
[Provide specific turn-by-turn directions from site to hospital]

**First Aid Resources:**
- First aid kits located: [Specify locations]
- AED devices located: [Specify locations if applicable]
- Eyewash stations: [Specify locations]

**Specialized Rescue Procedures:**
${procedures.filter(p => 
  p.emergencyType.includes('rescue') || 
  p.emergencyType.includes('fall') ||
  p.emergencyType.includes('confined')
).map(p => `
**${p.title}**
When Applicable: ${p.whenApplicable}
Equipment Needed: ${p.equipmentNeeded}
See Section 9 for detailed procedures.
`).join('\n') || 'Standard emergency response procedures apply.'}

**Medical Information:**
- Emergency Coordinator maintains confidential medical information for employees with special needs
- Employees with medical conditions should notify supervisor
- All injuries must be reported, no matter how minor

`.trim();
  }

  private buildSection8_Contacts(q: EAPQuestionnaire): string {
    return `
═══════════════════════════════════════════
SECTION 8: EMERGENCY CONTACT INFORMATION
═══════════════════════════════════════════

**EMERGENCY: CALL 911 FIRST FOR LIFE-THREATENING SITUATIONS**

**Site Emergency Contacts:**

Emergency Coordinator: ${q.emergencyCoordinator.name}
Title: ${q.emergencyCoordinator.title}
Phone: ${q.emergencyCoordinator.phone}
${q.emergencyCoordinator.email ? `Email: ${q.emergencyCoordinator.email}` : ''}

Alternate Coordinator: ${q.alternateCoordinator.name}
Title: ${q.alternateCoordinator.title}
Phone: ${q.alternateCoordinator.phone}
${q.alternateCoordinator.email ? `Email: ${q.alternateCoordinator.email}` : ''}

**Local Emergency Services:**

**Fire Department:**
${q.fireStation.district ? `District: ${q.fireStation.district}\n` : ''}Phone: ${q.fireStation.phone}
${q.fireStation.estimatedResponseTime ? `Estimated Response: ${q.fireStation.estimatedResponseTime} minutes` : ''}

**Police Department:**
${q.localPolice.jurisdiction}
Phone: ${q.localPolice.phone}

**Medical:**
${q.nearestHospital.name}
${q.nearestHospital.address}
Phone: ${q.nearestHospital.phone}
Distance: ${q.nearestHospital.distance} miles
${q.nearestHospital.traumaLevel ? `Trauma Level: ${q.nearestHospital.traumaLevel}` : ''}

**Site Information for Emergency Responders:**
Site Address: ${q.siteAddress}, ${q.city}, ${q.state} ${q.zipCode}
Building Type: ${q.buildingType}
${q.buildingHeight ? `Height: ${q.buildingHeight} feet` : ''}
Number of Workers: ${q.totalEmployees}
${q.siteAccessNotes ? `Access Notes: ${q.siteAccessNotes}` : ''}

**Additional Emergency Numbers:**
- Poison Control: 1-800-222-1222
- OSHA Hotline: 1-800-321-6742
- National Suicide Prevention: 988
- Company Safety Hotline: [Insert number]

**Utility Emergency Contacts:**
- Electric Company: [Insert number]
- Gas Company: [Insert number]
- Water Department: [Insert number]

`.trim();
  }

  private buildSection9_SpecificProcedures(procedures: EmergencyProcedure[]): string {
    const procedureText = procedures.map(proc => `
═══════════════════════════════════════════
${proc.title}
═══════════════════════════════════════════

OSHA Reference: ${proc.oshaReference}

When Applicable: ${proc.whenApplicable}

${proc.procedureSteps}

Site-Specific Factors:
${proc.siteSpecificFactors}

Equipment Needed:
${proc.equipmentNeeded}

Training Required:
${proc.trainingRequired}

`).join('\n\n');

    return `
═══════════════════════════════════════════
SECTION 9: SPECIFIC EMERGENCY PROCEDURES
═══════════════════════════════════════════

This section contains site-specific emergency procedures based on the hazards present at this location.

${procedureText}

**General Emergency Response Principles:**
1. Ensure personal safety first
2. Alert others and call for help
3. Only attempt rescue if trained and equipped
4. Provide clear information to emergency responders
5. Follow Emergency Coordinator instructions
6. Document all incidents

`.trim();
  }

  private buildSection10_AlarmSystems(q: EAPQuestionnaire): string {
    return `
═══════════════════════════════════════════
SECTION 10: ALARM SYSTEMS
═══════════════════════════════════════════

**Alarm Systems in Use at This Site:**
${q.alarmSystems.map((system, index) => `${index + 1}. ${system}`).join('\n')}

${q.radioChannel ? `\n**Radio Communication:**\nChannel: ${q.radioChannel}\nRadios distributed to: Supervisors, Emergency Coordinator, equipment operators\n` : ''}

**Alarm Signal Meanings:**

**EVACUATION ALARM:**
${q.alarmSystems[0] || 'Primary alarm system'}: Continuous signal
- Immediately evacuate to assembly area
- Follow evacuation procedures in Section 4
- Report to supervisor for accountability

**ALL CLEAR:**
Announcement via: ${q.radioChannel ? q.radioChannel : 'On-site communication'}
- Safe to return to work area
- Only Emergency Coordinator can give "All Clear"
- Remain at assembly point until "All Clear" received

**SHELTER IN PLACE:**
${q.alarmSystems[1] || 'Alternate alarm'}: Intermittent signal (if severe weather)
- Seek shelter in designated areas
- Stay away from windows
- Wait for "All Clear" or further instructions

**Testing and Maintenance:**
- Alarm systems tested: Weekly on [specify day/time]
- Testing announced in advance: "This is a test"
- Report malfunctioning alarms to: ${q.emergencyCoordinator.name}
- Backup communication: ${q.radioChannel || 'Verbal relay'}

**Responsibilities:**
- Emergency Coordinator: ${q.emergencyCoordinator.name}
  * Test alarm systems weekly
  * Maintain batteries/power supply
  * Ensure audible throughout site
  * Train employees on alarm meanings

**Alarm Coverage:**
All alarms must be:
- Audible in all work areas
- Distinguishable from ambient noise
- Recognizable as emergency signal
- Tested regularly

${q.weatherConcerns.includes('Tornado Risk') || q.weatherConcerns.includes('High Winds') ? `\n**Severe Weather Alerts:**\nMonitor: NOAA Weather Radio, weather apps\nShelter locations: [Specify interior rooms/areas]` : ''}

`.trim();
  }

  private buildSection11_Training(q: EAPQuestionnaire): string {
    return `
═══════════════════════════════════════════
SECTION 11: TRAINING REQUIREMENTS
═══════════════════════════════════════════

**New Employee Orientation:**
All new employees receive Emergency Action Plan training before beginning work.

Training includes:
- Evacuation procedures and assembly areas
- Alarm systems and their meanings
- Emergency contact information
- Location of emergency equipment
- Individual responsibilities
- Site-specific hazards
- Emergency reporting procedures

Trainer: ${q.emergencyCoordinator.name}, Emergency Coordinator
Documentation: Attendance roster, signed acknowledgment

**Ongoing Training:**

**Monthly Safety Meetings:**
- Review emergency procedures
- Discuss near-misses and lessons learned
- Update on plan changes
- Q&A session

**Quarterly Emergency Drills:**
Frequency: At least once every 3 months
Types:
- Fire evacuation drill
${q.hazards.fallFromHeight ? '- Fall rescue drill\n' : ''}${q.hazards.confinedSpace ? '- Confined space rescue simulation\n' : ''}${q.weatherConcerns.includes('Tornado Risk') ? '- Tornado drill\n' : ''}- Medical emergency response

Drill Procedures:
1. Announce drill in advance (or conduct unannounced)
2. Activate alarm system
3. Time evacuation and accountability
4. Emergency Coordinator observes and documents
5. Debrief after drill - identify improvements
6. Update plan based on drill results

**Specialized Training:**

${q.hazards.fallFromHeight ? `**Fall Rescue Training:**
- Required for: [Specify rescue team members]
- Frequency: Annual refresher
- Provider: Certified fall protection trainer
- Topics: Suspension trauma, rescue techniques, equipment use\n\n` : ''}

${q.hazards.confinedSpace ? `**Confined Space Entry:**
- Required for: Entrants, attendants, supervisors
- Frequency: Annual refresher
- Provider: Competent person
- Topics: Atmospheric testing, rescue procedures, permits\n\n` : ''}

**First Aid/CPR:**
- Recommended: At least 2 trained employees per shift
- Certification: American Red Cross or equivalent
- Renewal: Every 2 years

**Training Documentation:**
Emergency Coordinator maintains records including:
- Employee name
- Training date
- Topics covered
- Trainer name
- Employee signature

Records kept for: Duration of employment plus 3 years

**Annual Plan Review:**
Date: ${new Date().toLocaleDateString('en-US', { month: 'long' })} (anniversary of plan creation)
Conducted by: Emergency Coordinator
Includes: Full plan review with all employees
Updates: Incorporate lessons learned, regulatory changes, site modifications

`.trim();
  }

  private buildSection12_Review(q: EAPQuestionnaire): string {
    return `
═══════════════════════════════════════════
SECTION 12: PLAN REVIEW AND UPDATES
═══════════════════════════════════════════

**Review Schedule:**

**Annual Review:** Required at least once per year
Next Review Date: ${new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

**Trigger for Immediate Review:**
This plan must be reviewed and updated whenever:
- New hazards introduced on site
- Changes to building layout or egress routes
- Changes to emergency equipment locations
- Personnel changes (new Emergency Coordinator)
- New equipment or processes introduced
- Emergency drill reveals deficiencies
- Actual emergency reveals inadequacies
- Regulatory changes to OSHA standards
- Changes in local emergency response capabilities

**Review Process:**

1. **Emergency Coordinator Review:**
   - Verify all contact information current
   - Confirm assembly areas still appropriate
   - Check equipment locations accurate
   - Review training records

2. **Employee Input:**
   - Solicit feedback during safety meetings
   - Review drill observations
   - Incorporate lessons learned from incidents

3. **Management Approval:**
   - Present updates to management
   - Obtain approval for changes
   - Allocate resources as needed

4. **Implementation:**
   - Update plan document
   - Distribute to employees
   - Provide training on changes
   - Post updated version

**Document Control:**

Current Version: 1.0
Date Created: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
Last Reviewed: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
Next Review: ${new Date(Date.now() + 365*24*60*60*1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

**Plan Location:**
- Posted: Main site entrance
- Available: Site office
- Digital copy: [Specify location/system]
- Emergency Coordinator maintains master copy

**Acknowledgment:**

I acknowledge that I have received, read, and understand the Emergency Action Plan for ${q.companyName} located at ${q.siteAddress}, ${q.city}, ${q.state}.

I understand my responsibilities during an emergency and know:
- Location of assembly areas
- Evacuation procedures
- How to report an emergency
- Who the Emergency Coordinator is

Employee Name: ______________________ Date: __________

Employee Signature: ______________________

Supervisor Name: ______________________ Date: __________

**Revision History:**
| Version | Date | Changes Made | Approved By |
|---------|------|--------------|-------------|
| 1.0     | ${new Date().toLocaleDateString()} | Initial creation | ${q.emergencyCoordinator.name} |
|         |      |              |             |
|         |      |              |             |

`.trim();
  }

  private buildAttachments(q: EAPQuestionnaire): string {
    return `
═══════════════════════════════════════════
ATTACHMENTS
═══════════════════════════════════════════

**APPENDIX A: EVACUATION ROUTE MAPS**
[Attach site-specific evacuation maps showing:
- Building floor plans
- Exit locations (primary and alternate)
- Evacuation routes marked with arrows
- Assembly point locations
- "You Are Here" indicators
- Fire extinguisher locations
- First aid station locations]

**APPENDIX B: TRAINING ROSTER**
[Maintain updated training records including:
- New employee orientation dates
- Monthly safety meeting attendance
- Quarterly drill participation
- Specialized training certifications
- CPR/First Aid certifications]

**APPENDIX C: EQUIPMENT INSPECTION LOGS**
[Maintain inspection records for:
- Fire extinguishers (monthly)
- First aid kits (monthly)
- Emergency alarm systems (weekly)
- Rescue equipment (before each use)
- Emergency lighting (monthly)]

**APPENDIX D: COORDINATION LETTERS**
[Include copies of coordination letters with:
- Local fire department
- Local police department
- Nearest hospital
- Contracted rescue service (if applicable)
- Neighboring businesses (mutual aid)
- OSHA compliance verification]

**APPENDIX E: SITE-SPECIFIC INFORMATION**

Site Location: ${q.siteAddress}, ${q.city}, ${q.state} ${q.zipCode}
${q.primaryAssembly.gpsCoordinates ? `Primary Assembly GPS: ${q.primaryAssembly.gpsCoordinates}` : ''}
${q.secondaryAssembly.gpsCoordinates ? `Secondary Assembly GPS: ${q.secondaryAssembly.gpsCoordinates}` : ''}

${q.nearbyHazards ? `\n**Nearby External Hazards:**\n${q.nearbyHazards}\n` : ''}

${q.siteAccessNotes ? `\n**Site Access Information:**\n${q.siteAccessNotes}\n` : ''}

**Weather Concerns at This Location:**
${q.weatherConcerns.map(w => `- ${w}`).join('\n')}

**Equipment Inventory:**
${q.equipment.map(e => `- ${e}`).join('\n')}

═══════════════════════════════════════════
END OF EMERGENCY ACTION PLAN
═══════════════════════════════════════════

This plan was generated for ${q.companyName} and is specific to operations at ${q.siteAddress}, ${q.city}, ${q.state}.

For questions or updates, contact:
${q.emergencyCoordinator.name}
${q.emergencyCoordinator.phone}
${q.emergencyCoordinator.email || ''}

`.trim();
  }

  // ==================== UTILITY METHODS ====================
  
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
        throw new Error('Empty response from AI');
      }
      
      return responseText;
    } catch (error: any) {
      console.error('❌ Gemini API error:', error.message);
      throw error;
    }
  }

  private extractJSON(text: string): string {
    // Remove all markdown code fences and backticks
    let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').replace(/`/g, '').trim();
    
    // Try to find JSON object in the cleaned text
    const patterns = [
      /\{[\s\S]*\}/,  // Match any JSON object
      /\[[\s\S]*\]/   // Match any JSON array
    ];

    for (const pattern of patterns) {
      const match = cleaned.match(pattern);
      if (match) {
        const extracted = match[0].trim();
        // Verify it looks like valid JSON
        if ((extracted.startsWith('{') && extracted.endsWith('}')) ||
            (extracted.startsWith('[') && extracted.endsWith(']'))) {
          return extracted;
        }
      }
    }
    
    // Last resort: return cleaned text
    console.warn('⚠️  Could not extract JSON from response, returning cleaned text');
    return cleaned;
  }

  private calculateCompleteness(validation: EAPValidation, procedures: EmergencyProcedure[]): number {
    let score = 0;
    if (validation.complete) score += 50;
    if (validation.missingRequired.length === 0) score += 20;
    if (procedures.length >= 3) score += 30;
    return Math.min(100, score);
  }
}
