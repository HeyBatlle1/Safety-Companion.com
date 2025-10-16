import { Router } from 'express';
import { EAPGeneratorService } from '../services/eapGenerator.js';
import { EAPQuestionnaire } from '../types/eap.types.js';
import { db } from '../db.js';
import { analysisHistory } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();
const eapGenerator = new EAPGeneratorService();

/**
 * Generate Emergency Action Plan from questionnaire
 * POST /api/eap/generate
 */
router.post('/generate', async (req, res) => {
  try {
    console.log('📝 EAP generation request received');
    
    // Extract questionnaire data from request
    // The form submits as checklist format, so we need to transform it
    const checklistData = req.body;
    
    // Transform checklist responses into EAPQuestionnaire format
    const questionnaire = transformChecklistToQuestionnaire(checklistData);
    
    // Create analysis_history record to link agent outputs
    const userId = (req as any).session?.userId || null;
    const [analysisRecord] = await db.insert(analysisHistory).values({
      userId: userId,
      query: `Emergency Action Plan - ${questionnaire.companyName || 'Unknown Company'}`,
      response: 'Generating EAP...', // Will be updated after generation
      type: 'eap_generation',
    }).returning();
    
    // Generate the EAP document with analysis ID for agent output tracking
    const eapDocument = await eapGenerator.generateEAP(questionnaire, analysisRecord.id);
    
    // Update analysis_history with final EAP document
    const finalEAPText = Object.entries(eapDocument.sections)
      .map(([key, content]) => content)
      .join('\n\n');
    
    await db.update(analysisHistory)
      .set({ 
        response: finalEAPText,
        metadata: { 
          questionnaire,
          generatedAt: new Date().toISOString()
        }
      })
      .where(eq(analysisHistory.id, analysisRecord.id));
    
    // Return the generated document with analysisId for agent output viewing
    res.json({
      success: true,
      document: eapDocument,
      analysisId: analysisRecord.id,
      message: 'Emergency Action Plan generated successfully'
    });
    
  } catch (error: any) {
    console.error('❌ EAP generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate EAP'
    });
  }
});

/**
 * Helper: Transform checklist format to EAPQuestionnaire
 */
function transformChecklistToQuestionnaire(checklistData: any): EAPQuestionnaire {
  // Extract responses by question ID
  const responses = new Map<string, string>();
  
  if (checklistData.sections) {
    checklistData.sections.forEach((section: any) => {
      section.items?.forEach((item: any) => {
        if (item.response) {
          responses.set(item.id, item.response);
        }
      });
    });
  }
  
  // Helper to get response
  const get = (id: string): string => responses.get(id) || '';
  const getBool = (id: string): boolean => responses.get(id)?.toLowerCase() === 'yes';
  const getNum = (id: string): number => parseInt(responses.get(id) || '0') || 0;
  const getArray = (id: string): string[] => {
    const value = responses.get(id) || '';
    if (!value) return [];
    // Handle comma-separated or multi-select format
    return value.split(',').map(e => e.trim()).filter(e => e);
  };
  
  // Build EAPQuestionnaire object
  return {
    companyName: get('eap-company-name'),
    siteAddress: get('eap-site-address'),
    city: get('eap-city'),
    state: get('eap-state'),
    zipCode: get('eap-zip'),
    siteType: (get('eap-site-type').toLowerCase() || 'construction') as any,
    projectDescription: get('eap-project-description'),
    
    totalEmployees: getNum('eap-total-employees'),
    emergencyCoordinator: {
      name: get('eap-coordinator-name'),
      title: get('eap-coordinator-title'),
      phone: get('eap-coordinator-phone'),
      email: get('eap-coordinator-email') || undefined
    },
    alternateCoordinator: {
      name: get('eap-alternate-name'),
      title: get('eap-alternate-title'),
      phone: get('eap-alternate-phone'),
      email: get('eap-alternate-email') || undefined
    },
    
    buildingHeight: getNum('eap-building-height') || undefined,
    workElevation: getNum('eap-work-elevation') || undefined,
    buildingType: get('eap-building-type'),
    constructionPhase: get('eap-construction-phase') || undefined,
    
    hazards: {
      fallFromHeight: getBool('eap-hazard-fall'),
      confinedSpace: getBool('eap-hazard-confined'),
      craneOperations: getBool('eap-hazard-crane'),
      hotWork: getBool('eap-hazard-hotwork'),
      hazardousMaterials: getBool('eap-hazard-chemicals'),
      swingStage: getBool('eap-hazard-swing'),
      excavation: getBool('eap-hazard-excavation'),
      electricalHighVoltage: getBool('eap-hazard-electrical'),
      roofWork: getBool('eap-hazard-roof'),
      demolition: getBool('eap-hazard-demolition')
    },
    
    equipment: getArray('eap-equipment'),
    
    nearestHospital: {
      name: get('eap-hospital-name'),
      address: get('eap-hospital-address'),
      distance: getNum('eap-hospital-distance'),
      phone: get('eap-hospital-phone'),
      traumaLevel: get('eap-hospital-trauma') || undefined
    },
    fireStation: {
      district: get('eap-fire-district') || undefined,
      phone: get('eap-fire-phone'),
      estimatedResponseTime: getNum('eap-fire-response') || undefined
    },
    localPolice: {
      jurisdiction: get('eap-police-jurisdiction'),
      phone: get('eap-police-phone')
    },
    
    primaryAssembly: {
      location: get('eap-primary-assembly'),
      gpsCoordinates: get('eap-primary-gps') || undefined
    },
    secondaryAssembly: {
      location: get('eap-secondary-assembly'),
      gpsCoordinates: get('eap-secondary-gps') || undefined
    },
    
    weatherConcerns: getArray('eap-weather-concerns'),
    siteAccessNotes: get('eap-site-access') || undefined,
    nearbyHazards: get('eap-nearby-hazards') || undefined,
    
    rescueOption: (get('eap-rescue-option').toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_') || 'local_fire_ems') as any,
    trainedRescuers: undefined, // TODO: Parse if rescue option is trained_employees
    
    alarmSystems: getArray('eap-alarm-systems'),
    radioChannel: get('eap-radio-channel') || undefined,
    
    additionalInfo: get('eap-additional-info') || undefined
  };
}

export default router;
