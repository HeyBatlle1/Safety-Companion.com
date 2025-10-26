import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Upload, X, Camera, MapPin, Loader, Check, ArrowLeft, Clock, Save, Printer, Share2, Flag, MessageSquare, Plus, Send, Sparkles, CheckCircle, XCircle, FileText, FileImage, Building, Eye, RotateCcw } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { checklistData } from './checklistData';
import BackButton from '../navigation/BackButton';
import { useAuth } from '../../contexts/AuthContext';
import { getMSDSResponse } from '../../services/msdsChat';
import { saveChecklistResponse } from '../../services/checklistService';
import { showToast } from '../common/ToastContainer';
import { safetyCompanionAPI, type RiskProfile, type SafetyAnalysis } from '../../services/safetyCompanionAPI';
import { blueprintStorage, type BlueprintUpload } from '../../services/blueprintStorage';
import { multiModalAnalysis } from '../../services/multiModalAnalysis';
import { ReportFormatter } from '../../services/reportFormatter';
import { SafetyAnalysisReport } from '../SafetyAnalysis/SafetyAnalysisReport';
import { JHAUpdateForm } from '../JHA/JHAUpdateForm';
import { JHAComparisonView } from '../JHA/JHAComparisonView';
import supabase from '@/services/supabase';
import { ProjectLocationQuestion, type ProjectLocationData } from '../JHA/ProjectLocationQuestion';
import { GlassInstallationQuestion, type GlassInstallationData } from '../JHA/GlassInstallationQuestion';
import { BuildingAccessQuestion, type BuildingAccessData } from '../JHA/BuildingAccessQuestion';
import { PublicExposureQuestion, type PublicExposureData } from '../JHA/PublicExposureQuestion';
import { WindConditionsQuestion, type WindConditionsData } from '../JHA/WindConditionsQuestion';
import { TemperatureQuestion, type TemperatureData } from '../JHA/TemperatureQuestion';
import { PrecipitationQuestion, type PrecipitationData } from '../JHA/PrecipitationQuestion';
import { GlassHandlingQuestion, type GlassHandlingData } from '../JHA/GlassHandlingQuestion';
import { FallProtectionQuestion, type FallProtectionData } from '../JHA/FallProtectionQuestion';
import { EquipmentCertificationQuestion, type EquipmentCertificationData } from '../JHA/EquipmentCertificationQuestion';
import { GlassStorageQuestion, type GlassStorageData } from '../JHA/GlassStorageQuestion';
import { TransportPathQuestion, type TransportPathData } from '../JHA/TransportPathQuestion';
import { GlassPanelRiskQuestion, type GlassPanelRiskData } from '../JHA/GlassPanelRiskQuestion';
import { CrewQualificationsQuestion, type CrewQualificationsData } from '../JHA/CrewQualificationsQuestion';
import { PPEInspectionQuestion, type PPEInspectionData } from '../JHA/PPEInspectionQuestion';
import { CommunicationSystemsQuestion, type CommunicationSystemsData } from '../JHA/CommunicationSystemsQuestion';
import { EmergencyEquipmentQuestion, type EmergencyEquipmentData } from '../JHA/EmergencyEquipmentQuestion';
import { EmergencyPlanQuestion, type EmergencyPlanData } from '../JHA/EmergencyPlanQuestion';
import { GroundProtectionQuestion, type GroundProtectionData } from '../JHA/GroundProtectionQuestion';
import { AdjacentPropertyQuestion, type AdjacentPropertyData } from '../JHA/AdjacentPropertyQuestion';

interface ChecklistItem {
  id: string;
  question: string;
  options: string[];
  notes?: boolean;
  critical?: boolean;
  images?: boolean;
  deadline?: boolean;
}

interface Section {
  title: string;
  items: ChecklistItem[];
}

interface Response {
  value: string;
  timestamp: string;
  images?: string[];
  blueprints?: BlueprintUpload[];
  notes?: string;
  deadline?: string;
  flagged?: boolean;
}

const ChecklistForm = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromSDS = location.state?.fromSDS;
  const { user } = useAuth();
  
  const template = templateId && checklistData[templateId] 
    ? checklistData[templateId] 
    : { title: 'Unknown Checklist', sections: [] };
  
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [responseHistory, setResponseHistory] = useState<any[]>([]);
  const [shareSuccess, setShareSuccess] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [agentData, setAgentData] = useState<any | null>(null); // Structured agent outputs
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [safetyAnalysis, setSafetyAnalysis] = useState<SafetyAnalysis | null>(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  
  // JHA Update state
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateComparison, setUpdateComparison] = useState<any | null>(null);
  const [analysisMode] = useState<'standard'>('standard');
  const [uploadingBlueprints, setUploadingBlueprints] = useState<Record<string, boolean>>({});
  
  // Structured question data
  const [projectLocationData, setProjectLocationData] = useState<ProjectLocationData>({
    location: '',
    buildingHeight: '',
    workHeight: '',
    fallDistance: '',
    nearestHospital: ''
  });
  const [glassInstallationData, setGlassInstallationData] = useState<GlassInstallationData>({
    installationMethod: [],
    panelWidth: '',
    panelHeight: '',
    panelThickness: '',
    panelWeight: '',
    glassType: [],
    specialFeatures: []
  });
  const [buildingAccessData, setBuildingAccessData] = useState<BuildingAccessData>({
    accessMethod: [],
    equipmentType: '',
    loadCapacity: '',
    actualLoad: '',
    safetyFactor: '',
    operatorCertification: [],
    groundConditions: [],
    powerLinesNearby: '',
    powerLineDistance: ''
  });
  const [publicExposureData, setPublicExposureData] = useState<PublicExposureData>({
    publicTraffic: '',
    barricadeDistance: '',
    protectionSystems: [],
    barricadeStatus: [],
    adjacentActivity: []
  });
  const [windData, setWindData] = useState<WindConditionsData>({
    currentSpeed: '',
    forecastedGusts: '',
    source: '',
    stoppageThreshold: '20',
    monitoringPlan: []
  });
  const [tempData, setTempData] = useState<TemperatureData>({
    currentTemp: '',
    humidity: '',
    heatIndex: '',
    windChill: '',
    thermalRisk: 'none',
    precautions: [],
    fatigueIndicators: {
      waterBreakFrequency: '',
      restAreaTemp: '',
      workerFatigueLevel: ''
    }
  });
  const [precipitationData, setPrecipitationData] = useState<PrecipitationData>({
    currentPrecipitation: [],
    forecastHour1: '',
    forecastHour2: '',
    forecastHour3: '',
    forecastHour4: '',
    currentVisibility: '',
    groundVisibility: '',
    surfaceConditions: [],
    slipFallPrecautions: [],
    workInRainPolicy: ''
  });
  
  // Weather Input Module - Heads-up display for environmental section
  const [weatherInputData, setWeatherInputData] = useState({
    temperature: '',
    windSpeed: '',
    conditions: '',
    precipitation: '',
    visibility: '',
    humidity: ''
  });
  
  const [glassHandlingData, setGlassHandlingData] = useState<GlassHandlingData>({
    liftingMethod: [],
    numberOfCups: '',
    capacityPerCup: '',
    totalCapacity: '',
    actualLoad: '',
    safetyFactor: '',
    backupSystems: [],
    cupsInspected: '',
    riggingInspected: '',
    vacuumPumpTested: '',
    inspectionFindings: [],
    damageDescription: '',
    loadDistribution: ''
  });
  const [fallProtectionData, setFallProtectionData] = useState<FallProtectionData>({
    primaryProtection: [],
    harnessType: '',
    dRingLocation: '',
    lanyardType: [],
    anchorageCapacity: '',
    harnessInspected: '',
    inspectionFindings: '',
    damageDescription: '',
    inspectorName: '',
    freeFallDistance: '',
    lanyardDeceleration: '',
    safetyMargin: '',
    totalClearance: '',
    availableClearance: '',
    clearanceAdequate: '',
    rescuePlan: [],
    rescueETA: '',
    rescueEquipment: []
  });
  const [equipmentCertificationData, setEquipmentCertificationData] = useState<EquipmentCertificationData>({
    lastInspectionDate: '',
    inspectionType: [],
    inspectorName: '',
    inspectorCredentials: [],
    nextInspectionDue: '',
    craneSerial: '',
    boomSerial: '',
    riggingSerial: '',
    riggingInspectionFrequency: [],
    riggingInspector: '',
    inspectionFindings: [],
    defectDescription: '',
    lastLoadTestDate: '',
    testCapacity: '',
    testResult: '',
    harnessesCertified: '',
    lanyardsCertified: '',
    anchorageCertified: ''
  });
  const [glassStorageData, setGlassStorageData] = useState<GlassStorageData>({
    distanceFromBuilding: '',
    distanceFromEdge: '',
    groundConditions: [],
    fallProtection: [],
    rackSystem: [],
    rackCapacity: '',
    currentLoad: '',
    environmentalProtection: [],
    securityAccess: [],
    windProtected: '',
    maxWindBeforeMoving: ''
  });
  const [transportPathData, setTransportPathData] = useState<TransportPathData>({
    transportMethod: [],
    manualCarryCrewSize: '',
    horizontalDistance: '',
    verticalDistance: '',
    tripTime: '',
    pathHazards: [],
    stairsCount: '',
    rampSlope: '',
    doorwayWidth: '',
    overheadClearance: '',
    unevenDescription: '',
    tripHazards: [],
    hazardMitigation: [],
    trafficConflicts: [],
    trafficControl: []
  });
  const [glassPanelRiskData, setGlassPanelRiskData] = useState<GlassPanelRiskData>({
    weightCategory: '',
    actualWeight: '',
    crewSize: '',
    weightPerPerson: '',
    sizeShape: '',
    panelSurfaceArea: '',
    windForce: '',
    canResistWind: '',
    panelsToday: '',
    timePerPanel: '',
    totalHandlingTime: '',
    restBreakFrequency: ''
  });
  const [crewQualificationsData, setCrewQualificationsData] = useState<CrewQualificationsData>({
    totalWorkers: '',
    installers: '',
    craneOperator: '',
    groundSupport: '',
    supervisor: '',
    competentPersonName: '',
    competentPersonRole: [],
    competentPersonQualifications: [],
    foremanYears: '',
    crewExperience: '',
    trainingRecords: [],
    glassTraining: [],
    previousExperience: [],
    nearMissCount: '',
    correctiveActions: '',
    correctiveActionsTaken: ''
  });
  const [ppeInspectionData, setPPEInspectionData] = useState<PPEInspectionData>({
    requiredPPE: [],
    fallProtectionPPE: [],
    inspectionStatus: [],
    dRingCorrect: '',
    hardHatCorrect: '',
    glovesAppropriate: '',
    glassesWorn: '',
    spareAvailable: ''
  });
  const [communicationSystemsData, setCommunicationSystemsData] = useState<CommunicationSystemsData>({
    primaryMethod: [],
    radioChannel: '',
    communicationChecks: [],
    groundToHeightClear: '',
    craneSignalsVisible: '',
    backgroundNoise: '',
    noiseDescription: '',
    emergencyStopSignal: '',
    manDownSignal: '',
    evacuateSignal: '',
    crewBriefed: '',
    emergencyNumbers: [],
    supervisorPhone: '',
    safetyManagerPhone: '',
    hospitalPhone: '',
    backupMethod: ''
  });
  const [emergencyEquipmentData, setEmergencyEquipmentData] = useState<EmergencyEquipmentData>({
    medicalEquipment: [],
    firstAidLocation: '',
    aedLocation: '',
    rescueEquipmentLocation: '',
    equipmentInspection: [],
    aedPadExpiration: '',
    fallRescueEquipment: [],
    crewTraining: [],
    fallRescueTime: '',
    emsArrival: '',
    helicopterAvailable: '',
    traumaCenter: '',
    traumaCenterTime: ''
  });
  const [emergencyPlanData, setEmergencyPlanData] = useState<EmergencyPlanData>({
    eapStatus: '',
    eapComponents: [],
    assemblyLocation: '',
    assemblyDistance: '',
    assemblySafeFromFalling: '',
    assemblyReachable: '',
    whoCalls911: '',
    whoNotifiesSupervisor: '',
    whoNotifiesSafety: '',
    crewAwareness: '',
    lastDrillDate: '',
    drillFrequency: '',
    hospitalName: '',
    hospitalAddress: '',
    hospitalDriveTime: '',
    hospitalTraumaCenter: ''
  });
  const [groundProtectionData, setGroundProtectionData] = useState<GroundProtectionData>({
    workHeight: '',
    requiredExclusionZone: '',
    actualExclusionZone: '',
    exclusionAdequate: '',
    barricadeSystem: [],
    barricadeStatus: '',
    overheadProtection: [],
    spotterAssigned: '',
    spotterName: '',
    spotterPosition: '',
    spotterEquipment: [],
    publicTrafficVolume: '',
    signage: [],
    enforcement: [],
    breachResponse: []
  });
  const [adjacentPropertyData, setAdjacentPropertyData] = useState<AdjacentPropertyData>({
    adjacentProperties: [],
    closestDistance: '',
    ownerNotification: '',
    notificationIncluded: [],
    protectionMeasures: [],
    vehicleProtection: [],
    adjacentHazards: [],
    coordination: ''
  });
  
  const formRef = useRef<HTMLFormElement>(null);
  const analysisAbortController = useRef<AbortController | null>(null);
  const statusCleanupTimeout = useRef<NodeJS.Timeout | null>(null);
  const runIdRef = useRef<number>(0);

  const handleResponse = (itemId: string, value: string) => {
    const updatedResponses = {
      ...responses,
      [itemId]: {
        ...responses[itemId],
        value,
        timestamp: new Date().toISOString()
      }
    };
    setResponses(updatedResponses);
    localStorage.setItem(`checklist-${templateId}-responses`, JSON.stringify(updatedResponses));
  };
  
  // Handle structured question data
  const handleProjectLocationDataChange = (data: ProjectLocationData) => {
    setProjectLocationData(data);
    handleResponse('sa-1', JSON.stringify(data));
  };
  
  const handleGlassInstallationDataChange = (data: GlassInstallationData) => {
    setGlassInstallationData(data);
    handleResponse('sa-2', JSON.stringify(data));
  };
  
  const handleBuildingAccessDataChange = (data: BuildingAccessData) => {
    setBuildingAccessData(data);
    handleResponse('sa-3', JSON.stringify(data));
  };
  
  const handlePublicExposureDataChange = (data: PublicExposureData) => {
    setPublicExposureData(data);
    handleResponse('sa-4', JSON.stringify(data));
  };
  
  const handleWindDataChange = (data: WindConditionsData) => {
    setWindData(data);
    handleResponse('sa-5', JSON.stringify(data));
  };
  
  const handleTempDataChange = (data: TemperatureData) => {
    setTempData(data);
    handleResponse('sa-6', JSON.stringify(data));
  };
  
  const handlePrecipitationDataChange = (data: PrecipitationData) => {
    setPrecipitationData(data);
    handleResponse('sa-7', JSON.stringify(data));
  };
  
  const handleGlassHandlingDataChange = (data: GlassHandlingData) => {
    setGlassHandlingData(data);
    handleResponse('sa-8', JSON.stringify(data));
  };
  
  const handleFallProtectionDataChange = (data: FallProtectionData) => {
    setFallProtectionData(data);
    handleResponse('sa-9', JSON.stringify(data));
  };
  
  const handleEquipmentCertificationDataChange = (data: EquipmentCertificationData) => {
    setEquipmentCertificationData(data);
    handleResponse('sa-10', JSON.stringify(data));
  };
  
  const handleGlassStorageDataChange = (data: GlassStorageData) => {
    setGlassStorageData(data);
    handleResponse('sa-11', JSON.stringify(data));
  };
  
  const handleTransportPathDataChange = (data: TransportPathData) => {
    setTransportPathData(data);
    handleResponse('sa-12', JSON.stringify(data));
  };
  
  const handleGlassPanelRiskDataChange = (data: GlassPanelRiskData) => {
    setGlassPanelRiskData(data);
    handleResponse('sa-13', JSON.stringify(data));
  };
  
  const handleCrewQualificationsDataChange = (data: CrewQualificationsData) => {
    setCrewQualificationsData(data);
    handleResponse('sa-14', JSON.stringify(data));
  };
  
  const handlePPEInspectionDataChange = (data: PPEInspectionData) => {
    setPPEInspectionData(data);
    handleResponse('sa-15', JSON.stringify(data));
  };
  
  const handleCommunicationSystemsDataChange = (data: CommunicationSystemsData) => {
    setCommunicationSystemsData(data);
    handleResponse('sa-16', JSON.stringify(data));
  };
  
  const handleEmergencyEquipmentDataChange = (data: EmergencyEquipmentData) => {
    setEmergencyEquipmentData(data);
    handleResponse('sa-17', JSON.stringify(data));
  };
  
  const handleEmergencyPlanDataChange = (data: EmergencyPlanData) => {
    setEmergencyPlanData(data);
    handleResponse('sa-18', JSON.stringify(data));
  };
  
  const handleGroundProtectionDataChange = (data: GroundProtectionData) => {
    setGroundProtectionData(data);
    handleResponse('sa-19', JSON.stringify(data));
  };
  
  const handleAdjacentPropertyDataChange = (data: AdjacentPropertyData) => {
    setAdjacentPropertyData(data);
    handleResponse('sa-20', JSON.stringify(data));
  };

  const toggleFlag = (itemId: string) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        flagged: !prev[itemId]?.flagged,
        timestamp: new Date().toISOString()
      }
    }));
  };

  const handleNotes = (itemId: string, notes: string) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        notes,
        timestamp: new Date().toISOString()
      }
    }));
  };

  const handleDeadline = (itemId: string, deadline: string) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        deadline,
        timestamp: new Date().toISOString()
      }
    }));
  };

  const handleImageUpload = async (itemId: string, files: FileList) => {
    const imagePromises = Array.from(files).map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    try {
      const images = await Promise.all(imagePromises);
      setResponses(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          images: [...(prev[itemId]?.images || []), ...images],
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error) {
      
      showToast('Failed to upload images. Please try again.', 'error');
    }
  }

  const handleBlueprintUpload = async (itemId: string, files: FileList) => {
    setUploadingBlueprints(prev => ({ ...prev, [itemId]: true }));
    
    try {
      // User from auth context available
      if (!user) {
        showToast('Please log in to upload blueprints', 'error');
        return;
      }

      const uploadPromises = Array.from(files).map(file => 
        blueprintStorage.uploadBlueprint(file, templateId || 'unknown', itemId, user.id)
      );

      const uploadedBlueprints = await Promise.all(uploadPromises);
      
      setResponses(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          blueprints: [...(prev[itemId]?.blueprints || []), ...uploadedBlueprints],
          timestamp: new Date().toISOString()
        }
      }));

      showToast(`Successfully uploaded ${files.length} blueprint(s)`, 'success');
    } catch (error) {
      console.error('Blueprint upload error:', error);
      showToast('Failed to upload blueprints. Please try again.', 'error');
    } finally {
      setUploadingBlueprints(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Prevent navigation during analysis
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isProcessing) {
        e.preventDefault();
        e.returnValue = 'Analysis in progress. Are you sure you want to leave? You will lose your results.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isProcessing]);

  useEffect(() => {
    // Load previous responses from localStorage
    const savedResponses = localStorage.getItem(`checklist-${templateId}-responses`);
    if (savedResponses) {
      const parsedResponses = JSON.parse(savedResponses);
      setResponses(parsedResponses);
      
      // Hydrate structured question data from saved responses
      const hydrateStructuredData = (questionId: string, setter: (data: any) => void) => {
        if (parsedResponses[questionId]?.value) {
          try {
            const value = parsedResponses[questionId].value;
            if (typeof value === 'string' && value.startsWith('{')) {
              setter(JSON.parse(value));
            }
          } catch (e) {
            // Silently handle parse errors - data might be from old format
          }
        }
      };
      
      hydrateStructuredData('sa-1', setProjectLocationData);
      hydrateStructuredData('sa-2', setGlassInstallationData);
      hydrateStructuredData('sa-3', setBuildingAccessData);
      hydrateStructuredData('sa-4', setPublicExposureData);
      hydrateStructuredData('sa-5', setWindData);
      hydrateStructuredData('sa-6', setTempData);
      hydrateStructuredData('sa-7', setPrecipitationData);
      hydrateStructuredData('sa-8', setGlassHandlingData);
      hydrateStructuredData('sa-9', setFallProtectionData);
      hydrateStructuredData('sa-10', setEquipmentCertificationData);
      hydrateStructuredData('sa-11', setGlassStorageData);
      hydrateStructuredData('sa-12', setTransportPathData);
      hydrateStructuredData('sa-13', setGlassPanelRiskData);
      hydrateStructuredData('sa-14', setCrewQualificationsData);
      hydrateStructuredData('sa-15', setPPEInspectionData);
      hydrateStructuredData('sa-16', setCommunicationSystemsData);
      hydrateStructuredData('sa-17', setEmergencyEquipmentData);
      hydrateStructuredData('sa-18', setEmergencyPlanData);
      hydrateStructuredData('sa-19', setGroundProtectionData);
      hydrateStructuredData('sa-20', setAdjacentPropertyData);
    }

    // Load response history
    const history = Object.keys(localStorage)
      .filter(key => key.startsWith(`checklist-${templateId}-`) && !key.endsWith('-responses'))
      .map(key => JSON.parse(localStorage.getItem(key) || '{}'))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setResponseHistory(history);
    
    // Expand all sections initially
    const initialExpandedState: Record<string, boolean> = {};
    template.sections.forEach((_, index) => {
      initialExpandedState[index] = true;
    });
    setExpandedSections(initialExpandedState);
  }, [templateId, template.sections]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Clear any pending status cleanup from previous run
    if (statusCleanupTimeout.current) {
      clearTimeout(statusCleanupTimeout.current);
      statusCleanupTimeout.current = null;
    }
    
    // Increment run ID to track this specific analysis
    const currentRunId = ++runIdRef.current;
    
    setIsProcessing(true);
    setAiResponse(null);
    setSafetyAnalysis(null);

    try {
      // Format checklist data for enhanced AI processing
      const checklistData = {
        template: template.title,
        templateId: templateId,
        // Weather Input Module - Heads-up display data for AI fail-safe
        weatherInputOverride: weatherInputData,
        sections: template.sections.map(section => ({
          title: section.title,
          items: section.items.map(item => ({
            id: item.id,
            question: item.question,
            response: responses[item.id]?.value || '',
            notes: responses[item.id]?.notes,
            critical: item.critical || false,
            flagged: responses[item.id]?.flagged || false,
            aiWeight: item.aiWeight || 1,
            riskCategory: item.riskCategory,
            complianceStandard: item.complianceStandard,
            images: responses[item.id]?.images || [],
            blueprints: responses[item.id]?.blueprints || []
          })),
          responses: section.items.map(item => ({
            question: item.question,
            response: responses[item.id]?.value || 'No response',
            notes: responses[item.id]?.notes,
            critical: item.critical || false,
            flagged: responses[item.id]?.flagged || false,
            aiWeight: item.aiWeight || 1,
            riskCategory: item.riskCategory,
            complianceStandard: item.complianceStandard,
            images: responses[item.id]?.images || [],
            blueprints: responses[item.id]?.blueprints || []
          }))
        }))
      };

      // Route Emergency Action Plan Generator to EAP endpoint
      if (templateId === 'emergency-action-plan') {
        // Create abort controller for this request and store instance
        const thisAbortController = new AbortController();
        analysisAbortController.current = thisAbortController;
        
        setProcessingStatus('Initializing 4-agent EAP pipeline...');
        showToast('Generating OSHA-compliant Emergency Action Plan...', 'info');
        
        // Simulate progress updates (since backend doesn't stream)
        const progressInterval = setInterval(() => {
          // Exit immediately if this is no longer the active run
          if (currentRunId !== runIdRef.current) {
            return;
          }
          
          const statusMessages = [
            'Agent 1: Validating questionnaire data...',
            'Agent 2: Classifying emergency procedures...',
            'Agent 3: Generating site-specific procedures...',
            'Agent 4: Assembling OSHA-compliant document...',
            'Finalizing Emergency Action Plan...'
          ];
          setProcessingStatus(prev => {
            const currentIndex = statusMessages.indexOf(prev);
            if (currentIndex < statusMessages.length - 1) {
              return statusMessages[currentIndex + 1];
            }
            return prev;
          });
        }, 30000); // Update every 30 seconds
        
        try {
          const response = await fetch('/api/eap/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(checklistData),
            signal: analysisAbortController.current.signal
          });

          clearInterval(progressInterval);

          if (!response.ok) {
            throw new Error('EAP generation failed');
          }

          const eapResult = await response.json();
          
          if (eapResult.success && eapResult.document) {
            // Only update state if this is still the active run
            if (currentRunId === runIdRef.current) {
              // Use requestAnimationFrame to batch state updates
              requestAnimationFrame(() => {
                // Double-check run is still active inside animation frame
                if (currentRunId === runIdRef.current) {
                  // Format the EAP document for display
                  const formattedEAP = Object.entries(eapResult.document.sections)
                    .map(([key, content]) => content)
                    .join('\n\n');
                  
                  setAiResponse(formattedEAP);
                  setCurrentAnalysisId(eapResult.analysisId || null); // Store analysisId for agent output viewing
                  setProcessingStatus('Complete!');
                  showToast('Emergency Action Plan generated successfully!', 'success');
                }
              });
            }
            
            // Save to database async (don't block UI)
            saveChecklistResponse(
              templateId || 'unknown',
              template.title,
              responses
            ).catch(() => {
              showToast('EAP generated! (Database save pending)', 'warning');
            });
            
            // Early return to prevent fallback analysis from running
            return;
          } else {
            throw new Error('Invalid EAP response');
          }
        } finally {
          clearInterval(progressInterval);
          // Only clear if this is still our controller instance
          if (analysisAbortController.current === thisAbortController) {
            analysisAbortController.current = null;
          }
        }
      } else if (templateId === 'master-jha') {
        // Master JHA route with weather integration and progress tracking
        setProcessingStatus('Initializing 4-agent JHA pipeline...');
        showToast('Running predictive incident analysis...', 'info');
        
        // Create abort controller for this request
        const thisAbortController = new AbortController();
        analysisAbortController.current = thisAbortController;
        
        // Declare interval variable outside try block for cleanup access
        let jhaProgressInterval: NodeJS.Timeout | null = null;
        
        try {
          // Add progress tracking similar to EAP
          jhaProgressInterval = setInterval(() => {
            // Exit immediately if this is no longer the active run
            if (currentRunId !== runIdRef.current) {
              return;
            }
            
            const statusMessages = [
              'Agent 1: Validating checklist data quality...',
              'Agent 2: Assessing risks with OSHA statistics...',
              'Agent 3: Predicting incident using Swiss Cheese Model...',
              'Agent 4: Synthesizing comprehensive safety report...',
              'Finalizing predictive analysis...'
            ];
            setProcessingStatus(prev => {
              const currentIndex = statusMessages.indexOf(prev);
              if (currentIndex < statusMessages.length - 1) {
                return statusMessages[currentIndex + 1];
              }
              return prev;
            });
          }, 30000); // Update every 30 seconds
          
          // Get Supabase auth token
          const { data: { session } } = await supabase.auth.getSession();
          const authHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          
          if (session?.access_token) {
            authHeaders['Authorization'] = `Bearer ${session.access_token}`;
          }
          
          const response = await fetch('/api/checklist-analysis', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(checklistData),
            signal: thisAbortController.signal
          });

          if (jhaProgressInterval) {
            clearInterval(jhaProgressInterval); // Clear immediately after fetch completes
          }

          if (!response.ok) {
            throw new Error('Analysis failed');
          }

          const result = await response.json();
          const analysisResult = result.analysis || result;
        
          // Only update state if this is still the active run
          if (currentRunId === runIdRef.current) {
            // Use requestAnimationFrame for smooth state update
            requestAnimationFrame(() => {
              if (currentRunId === runIdRef.current) {
                // Check if we received structured agent outputs
                if (result.agent1 && result.agent2 && result.agent3 && result.agent4 && result.metadata) {
                  // Store structured agent data for SafetyAnalysisReport
                  setAgentData({
                    agent1: result.agent1,
                    agent2: result.agent2,
                    agent3: result.agent3,
                    agent4: result.agent4,
                    metadata: {
                      reportId: result.metadata.reportId || result.analysisId || `JHA-${Date.now()}`,
                      generatedAt: new Date(),
                      projectName: result.agent4.metadata?.projectName || 'Safety Analysis',
                      location: result.site_location || result.agent4.metadata?.location || 'Unknown',
                      workType: result.agent4.metadata?.workType || 'Construction',
                      supervisor: result.agent4.metadata?.supervisor || 'Unknown'
                    }
                  });
                  setAiResponse(null); // Clear markdown view when showing structured data
                } else {
                  // Error fallback: Display error messages when analysis fails
                  const formattedResult = (analysisResult && typeof analysisResult === 'object' && analysisResult.metadata)
                    ? ReportFormatter.formatStructuredJHAReport(analysisResult)
                    : analysisResult;
                  setAiResponse(formattedResult);
                  setAgentData(null);
                }
                
                setCurrentAnalysisId(result.analysisId || null); // Store analysisId for agent output viewing
                setProcessingStatus('Analysis complete!');
                showToast('Predictive JHA analysis with agent pipeline completed!', 'success');
              }
            });
          }
        } finally {
          if (jhaProgressInterval) {
            clearInterval(jhaProgressInterval);
          }
          // Only clear if this is still our controller instance
          if (analysisAbortController.current === thisAbortController) {
            analysisAbortController.current = null;
          }
        }
      } else {
        // Collect all blueprints and images for multi-modal analysis
        const allBlueprints: BlueprintUpload[] = [];
        const allImages: string[] = [];
        
        template.sections.forEach(section => {
          section.items.forEach(item => {
            const itemResponse = responses[item.id];
            if (itemResponse?.blueprints && itemResponse.blueprints.length > 0) {
              allBlueprints.push(...itemResponse.blueprints);
            }
            if (itemResponse?.images && itemResponse.images.length > 0) {
              allImages.push(...itemResponse.images);
            }
          });
        });

        // Get real OSHA risk profile first
        const oshaRiskProfile = await safetyCompanionAPI.getRiskProfile(templateId || 'general-construction', checklistData);
        
        // Only update state if this is still the active run
        if (currentRunId === runIdRef.current) {
          setRiskProfile(oshaRiskProfile);
        }

        // Perform multi-modal analysis if blueprints or images exist
        if (allBlueprints.length > 0 || allImages.length > 0) {
          showToast('Analyzing blueprints and images with AI...', 'info');
          
          const multiModalResult = await multiModalAnalysis.analyzeComprehensive({
            checklistData,
            blueprints: allBlueprints,
            images: allImages,
            railwayData: oshaRiskProfile // Include railway system data
          });

          // Generate professional markdown report
          const formattedReport = ReportFormatter.formatMultiModalReport(
            multiModalResult, 
            template.title, 
            allBlueprints.length, 
            allImages.length
          );
          
          // Only update state if this is still the active run
          if (currentRunId === runIdRef.current) {
            setAiResponse(formattedReport);
            showToast('Complete AI analysis with blueprint pattern recognition finished!', 'success');
          }
        } else {
          // Standard intelligent analysis without visual data
          const intelligentAnalysis = await safetyCompanionAPI.analyzeChecklist(checklistData, oshaRiskProfile || undefined);
          
          // Convert SafetyAnalysis to SafetyAnalysisReport format
          const reportData = {
            risk_level: intelligentAnalysis.risk_level,
            overall_score: intelligentAnalysis.score || 75,
            critical_issues: intelligentAnalysis.critical_issues || [],
            recommendations: intelligentAnalysis.recommendations || [],
            action_items: intelligentAnalysis.action_items || [],
            compliance_status: intelligentAnalysis.compliance_status || 'Under Review',
            summary: intelligentAnalysis.summary || 'Safety analysis completed successfully.'
          };
          
          // Format the response as professional markdown
          const formattedReport = ReportFormatter.formatStandardSafetyReport(reportData, template.title);
          
          // Only update state if this is still the active run
          if (currentRunId === runIdRef.current) {
            setAiResponse(formattedReport);
            setSafetyAnalysis(intelligentAnalysis);

            if (oshaRiskProfile) {
              showToast(`Analysis complete! Risk Level: ${intelligentAnalysis.risk_level.toUpperCase()}`, 'success');
            } else {
              showToast('Analysis complete using Supabase OSHA intelligence', 'success');
            }
          }
        }
      }

      // Standard analysis fallback (if needed)
      if (!aiResponse) {
        // Standard analysis using existing system
        const prompt = `As a safety expert, please analyze this comprehensive safety checklist and provide detailed recommendations:

${JSON.stringify(checklistData, null, 2)}

Please provide a structured analysis including:
1. Critical safety risks identified
2. Compliance status assessment
3. Immediate action items
4. Long-term recommendations
5. Training needs
6. Follow-up requirements

Format your response professionally with clear sections and actionable insights.`;

        const aiAnalysis = await getMSDSResponse(prompt);
        
        // Only update state if this is still the active run
        if (currentRunId === runIdRef.current) {
          setAiResponse(aiAnalysis);
          showToast('Standard analysis completed successfully!', 'success');
        }
      }

      // Save to database (handle gracefully if fails)
      try {
        await saveChecklistResponse(
          templateId || 'unknown',
          template.title,
          responses
        );
      } catch (saveError) {
        
        showToast('Analysis completed! (Database save pending - check connection)', 'warning');
      }
    } catch (error) {
      // Only update error state if this is still the active run
      if (currentRunId === runIdRef.current) {
        setError(error instanceof Error ? error.message : 'Failed to process checklist');
        showToast('Error processing checklist', 'error');
        setProcessingStatus('');
      }
    } finally {
      // Only reset processing state if this is still the active run
      if (currentRunId === runIdRef.current) {
        setIsProcessing(false);
        
        // Clear status after brief delay to show completion
        statusCleanupTimeout.current = setTimeout(() => {
          // Double-check we're still on the same run before clearing
          if (currentRunId === runIdRef.current) {
            setProcessingStatus('');
          }
        }, 1000);
      }
      
      // Note: Abort controller cleanup handled in EAP branch's finally block
    }
  };

  const handleClear = () => {
    // Clear all responses
    setResponses({});
    setAiResponse(null);
    setSafetyAnalysis(null);
    setError(null);
    
    // Clear localStorage
    if (templateId) {
      localStorage.removeItem(`checklist-${templateId}-responses`);
    }
    
    showToast('Form cleared successfully', 'success');
  };

  const handleSave = async () => {
    try {
      const timestamp = new Date().toISOString();
      
      // Check authentication before saving
      // User from auth context available
      if (!user) {
        setError('Please sign in to save the checklist');
        showToast('Authentication required', 'error');
        return;
      }
      
      const data = {
        templateId,
        responses,
        timestamp,
        title: template.title
      };
      
      // Save current state
      localStorage.setItem(`checklist-${templateId}-responses`, JSON.stringify(responses));
      
      // Save to history
      localStorage.setItem(`checklist-${templateId}-${timestamp}`, JSON.stringify(data));
      
      // Show success toast
      showToast('Checklist saved successfully!', 'success');
      
      // Update history
      const history = Object.keys(localStorage)
        .filter(key => key.startsWith(`checklist-${templateId}-`) && !key.endsWith('-responses'))
        .map(key => JSON.parse(localStorage.getItem(key) || '{}'))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setResponseHistory(history);
    } catch (error) {
      setError('Failed to save checklist');
      showToast('Error saving checklist', 'error');
    }
  };

  const handlePrint = () => {
    // Create a printable version using safe DOM methods
    const printContent = document.createElement('div');
    
    // Add styles safely
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        body { font-family: Arial, sans-serif; }
        .header { margin-bottom: 20px; }
        .section { margin-bottom: 15px; }
        .item { margin-bottom: 10px; }
        .response { margin-left: 20px; }
        .notes { margin-left: 20px; font-style: italic; }
        .timestamp { color: #666; font-size: 0.9em; }
        @page { margin: 2cm; }
      }
    `;
    printContent.appendChild(style);

    // Create header safely
    const headerDiv = document.createElement('div');
    headerDiv.className = 'header';
    
    const titleH1 = document.createElement('h1');
    titleH1.textContent = template.title;
    headerDiv.appendChild(titleH1);
    
    const datePara = document.createElement('p');
    datePara.textContent = `Generated on: ${new Date().toLocaleString()}`;
    headerDiv.appendChild(datePara);
    
    printContent.appendChild(headerDiv);

    template.sections.forEach(section => {
      const sectionDiv = document.createElement('div');
      sectionDiv.className = 'section';
      
      const sectionTitle = document.createElement('h2');
      sectionTitle.textContent = section.title;
      sectionDiv.appendChild(sectionTitle);

      section.items.forEach(item => {
        const response = responses[item.id];
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item';
        
        const questionPara = document.createElement('p');
        const questionStrong = document.createElement('strong');
        questionStrong.textContent = item.question;
        questionPara.appendChild(questionStrong);
        itemDiv.appendChild(questionPara);

        if (response) {
          const responsePara = document.createElement('p');
          responsePara.className = 'response';
          responsePara.textContent = `Response: ${response.value}`;
          itemDiv.appendChild(responsePara);

          if (response.notes) {
            const notesPara = document.createElement('p');
            notesPara.className = 'notes';
            notesPara.textContent = `Notes: ${response.notes}`;
            itemDiv.appendChild(notesPara);
          }

          if (response.deadline) {
            const timestampPara = document.createElement('p');
            timestampPara.className = 'timestamp';
            timestampPara.textContent = `Deadline: ${new Date(response.deadline).toLocaleString()}`;
            itemDiv.appendChild(timestampPara);
          }
        } else {
          const noResponsePara = document.createElement('p');
          noResponsePara.className = 'response';
          noResponsePara.textContent = 'No response recorded';
          itemDiv.appendChild(noResponsePara);
        }
        
        sectionDiv.appendChild(itemDiv);
      });

      printContent.appendChild(sectionDiv);
    });

    // Create a new window for printing using safe methods
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.head.innerHTML = '';
      printWindow.document.body.innerHTML = '';
      printWindow.document.body.appendChild(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const shareReport = async () => {
    if (!aiResponse) {
      showToast('No report available to share', 'error');
      return;
    }

    try {
      const formattedForSharing = ReportFormatter.formatForSharing(aiResponse);
      
      if (navigator.share) {
        await navigator.share({
          title: `Safety Report: ${template.title}`,
          text: formattedForSharing
        });
        showToast('Report shared successfully!', 'success');
      } else {
        await navigator.clipboard.writeText(formattedForSharing);
        showToast('Report copied to clipboard!', 'success');
      }
    } catch (error) {
      showToast('Failed to share report', 'error');
    }
  };

  const emailReport = async () => {
    if (!aiResponse) {
      showToast('No report available to email', 'error');
      return;
    }

    try {
      const emailData = ReportFormatter.formatForEmail(aiResponse, template.title);
      const mailtoLink = `mailto:?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
      window.open(mailtoLink);
      showToast('Email client opened with report!', 'success');
    } catch (error) {
      showToast('Failed to prepare email', 'error');
    }
  };

  const saveReportToDatabase = async () => {
    if (!aiResponse) {
      showToast('No report available to save', 'error');
      return;
    }

    try {
      // User from auth context available
      if (!user) {
        showToast('Please log in to save reports', 'error');
        return;
      }

      const reportData = ReportFormatter.formatForDatabase(aiResponse, templateId || 'unknown', user.id);
      // Save as simple object since saveChecklistResponse expects basic data
      await saveChecklistResponse(reportData.id, reportData);
      showToast('Report saved to database successfully!', 'success');
    } catch (error) {
      showToast('Failed to save report to database', 'error');
    }
  };

  const handleShare = async () => {
    try {
      setShareSuccess(null);
      const data = {
        templateId,
        title: template.title,
        responses,
        timestamp: new Date().toISOString()
      };

      // Create a shareable format - simplified for smaller size
      const shareableText = `${template.title} Checklist - ${new Date().toLocaleDateString()}`;
      const shareableUrl = window.location.href;
      
      // Try to use the native share API if available
      if (navigator.share) {
        try {
          await navigator.share({
            title: template.title,
            text: shareableText,
            url: shareableUrl
          });
          setShareSuccess(true);
        } catch (shareError: any) {
          // Many browsers throw permission denied errors in certain contexts
          // Fall back to clipboard if sharing fails
          if (shareError.name === 'NotAllowedError' || 
              shareError.name === 'AbortError' ||
              shareError.message.includes('Permission')) {
            await navigatorShareFallback();
          } else {
            throw shareError;
          }
        }
      } else {
        // Fallback for browsers that don't support navigator.share
        await navigatorShareFallback();
      }
    } catch (error) {
      
      setShareSuccess(false);
      showToast('Failed to share checklist. Data copied to clipboard instead.', 'warning');
    }
  };

  const navigatorShareFallback = async () => {
    // Create a simplified version for clipboard
    const shareableSummary = `
${template.title}
Date: ${new Date().toLocaleDateString()}
URL: ${window.location.href}
Progress: ${Math.round(calculateProgress())}% complete
    `;
    
    try {
      await navigator.clipboard.writeText(shareableSummary);
      setShareSuccess(true);
      showToast('Checklist data copied to clipboard!', 'success');
    } catch (clipboardError) {
      
      setShareSuccess(false);
      throw new Error('Could not share or copy to clipboard.');
    }
  };

  const handleTimeView = () => {
    setShowHistory(!showHistory);
    if (!showHistory) {
      // Load and sort history when opening
      const history = Object.keys(localStorage)
        .filter(key => key.startsWith(`checklist-${templateId}-`) && !key.endsWith('-responses'))
        .map(key => JSON.parse(localStorage.getItem(key) || '{}'))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setResponseHistory(history);
    }
  };

  const loadHistoricalData = (historicalResponses: any) => {
    setResponses(historicalResponses.responses);
    setShowHistory(false);
  };

  const handleBack = () => {
    if (fromSDS) {
      navigate('/sds', { state: { fromChecklist: true } });
    } else {
      navigate(-1);
    }
  };

  const handleCaptureImage = async (itemId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Create video element
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      // Wait for video to initialize
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Create canvas and capture image
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      
      // Get data URL
      const imageUrl = canvas.toDataURL('image/jpeg');
      
      // Add to images
      setResponses(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          images: [...(prev[itemId]?.images || []), imageUrl],
          timestamp: new Date().toISOString()
        }
      }));
      
      // Stop camera
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      
      showToast('Unable to access camera. Please check permissions.', 'error');
    }
  };

  const calculateProgress = () => {
    const totalItems = template.sections.reduce((acc, section) => acc + section.items.length, 0);
    const answeredItems = Object.keys(responses).length;
    return (answeredItems / totalItems) * 100;
  };

  // Helper functions for intelligent analysis display
  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'requires_attention':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'non_compliant':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'high': return 'text-orange-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <BackButton 
            disabled={isProcessing} 
            onDisabledClick={() => showToast('Please wait for analysis to complete', 'warning')}
          />
          
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                {template.title}
              </h2>
              <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
            <p className="text-sm text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleTimeView}
              className={`p-3 rounded-xl transition-all duration-300 ${
                showHistory 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' 
                  : 'bg-slate-700/50 text-gray-400 hover:text-white hover:bg-slate-600/50'
              }`}
              title="View History"
            >
              <Clock className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg"
              title="Save Checklist"
            >
              <Save className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleClear}
              className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 transition-all duration-300 shadow-lg"
              title="CLEAR All Data"
            >
              <RotateCcw className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handlePrint}
              className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white hover:from-indigo-600 hover:to-blue-600 transition-all duration-300 shadow-lg"
              title="Print Checklist"
            >
              <Printer className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className={`p-3 rounded-xl transition-all duration-300 shadow-lg ${
                shareSuccess === true ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                shareSuccess === false ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
              } text-white`}
              title="Share Checklist"
            >
              <Share2 className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-slate-700/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${calculateProgress()}%` }}
            className="absolute h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
            transition={{ duration: 0.8 }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
        </div>

        {/* History Section */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl bg-slate-800/60 backdrop-blur-sm border border-blue-500/20 p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Response History</h3>
              <div className="space-y-3">
                {responseHistory.length > 0 ? (
                  responseHistory.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700/70 transition-colors"
                    >
                      <span className="text-gray-300">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => loadHistoricalData(entry)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
                      >
                        Load
                      </motion.button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    No saved history found
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400 text-sm flex items-center space-x-2"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}

        {/* Analysis Complete Banner - NO REPORT DISPLAY */}
        {agentData && !updateComparison && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 backdrop-blur-sm border border-emerald-500/30 shadow-2xl"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Analysis Complete!</h2>
              <p className="text-slate-300 mb-6">
                Your safety analysis report has been generated successfully.
              </p>
              
              {/* View Report Button */}
              {currentAnalysisId && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate(`/reports/${currentAnalysisId}`)}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 flex items-center justify-center gap-2"
                    data-testid="button-view-report"
                  >
                    <FileText className="w-5 h-5" />
                    View Full Report
                  </button>
                  
                  {!showUpdateForm && (
                    <button
                      onClick={() => setShowUpdateForm(true)}
                      className="px-8 py-4 bg-slate-800 border border-blue-500/30 text-blue-300 font-semibold rounded-lg hover:border-blue-500/50 hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                      data-testid="button-create-daily-update"
                    >
                      <RotateCcw className="w-5 h-5" />
                      Create Daily Update
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
        
        {/* MULTI-AGENT REPORT DISPLAY - Render full SafetyAnalysisReport inline */}
        {agentData && !updateComparison && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <SafetyAnalysisReport
              agent1={agentData.agent1}
              agent2={agentData.agent2}
              agent3={agentData.agent3}
              agent4={agentData.agent4}
              metadata={agentData.metadata}
            />
          </motion.div>
        )}
        
        {/* JHA Update Form */}
        {showUpdateForm && currentAnalysisId && !updateComparison && (
          <JHAUpdateForm
            baselineAnalysisId={currentAnalysisId}
            onUpdateComplete={(result) => {
              setUpdateComparison(result);
              setShowUpdateForm(false);
            }}
            onCancel={() => setShowUpdateForm(false)}
          />
        )}
        
        {/* JHA Comparison View */}
        {updateComparison && currentAnalysisId && agentData && (
          <JHAComparisonView
            baseline={{
              id: currentAnalysisId,
              riskScore: agentData.agent2?.overallRiskScore || 60,
              query: template.title || 'JHA Analysis',
            }}
            comparison={updateComparison}
          />
        )}

        {/* AI Analysis Results - Error Fallback */}
        {!agentData && aiResponse && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-6 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 backdrop-blur-sm border border-emerald-500/20"
          >
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-6 h-6 text-emerald-400" />
              <h3 className="text-lg font-semibold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                AI Safety Analysis
              </h3>
            </div>
            <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap leading-relaxed">
              {aiResponse}
            </div>
          </motion.div>
        )}

        {/* Checklist Sections */}
        {template.sections.map((section, sectionIndex) => (
          <motion.div
            key={sectionIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
            className="rounded-xl bg-slate-800/60 backdrop-blur-sm border border-blue-500/20"
          >
            <button
              onClick={() => setExpandedSections(prev => ({ ...prev, [sectionIndex]: !prev[sectionIndex] }))}
              className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-700/30 transition-colors rounded-t-xl"
            >
              <h3 className="text-lg font-semibold text-white">{section.title}</h3>
              <motion.div
                animate={{ rotate: expandedSections[sectionIndex] ? 180 : 0 }}
                className="text-gray-400"
                transition={{ duration: 0.3 }}
              >
                ▼
              </motion.div>
            </button>

            <AnimatePresence>
              {expandedSections[sectionIndex] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-6 border-t border-blue-500/20 space-y-6"
                >
                  {/* Weather Input Module - Heads-Up Display for Environmental & Weather Conditions */}
                  {section.title === 'Environmental & Weather Conditions' && (
                    <div className="mb-6 p-6 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border border-cyan-500/30">
                      <div className="flex items-center gap-3 mb-4">
                        <MapPin className="w-6 h-6 text-cyan-400" />
                        <h4 className="text-lg font-semibold text-cyan-300">Current Weather Conditions</h4>
                        <span className="text-xs text-cyan-400/70 ml-auto">Paste data from Weather Module</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Temperature (°F)
                          </label>
                          <input
                            type="text"
                            value={weatherInputData.temperature}
                            onChange={(e) => setWeatherInputData(prev => ({ ...prev, temperature: e.target.value }))}
                            placeholder="e.g., 72°F"
                            className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                            data-testid="input-weather-temperature"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Wind Speed (mph)
                          </label>
                          <input
                            type="text"
                            value={weatherInputData.windSpeed}
                            onChange={(e) => setWeatherInputData(prev => ({ ...prev, windSpeed: e.target.value }))}
                            placeholder="e.g., 12 mph"
                            className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                            data-testid="input-weather-wind-speed"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-300">Conditions</label>
                          <input
                            type="text"
                            value={weatherInputData.conditions}
                            onChange={(e) => setWeatherInputData(prev => ({ ...prev, conditions: e.target.value }))}
                            placeholder="e.g., Partly Cloudy"
                            className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                            data-testid="input-weather-conditions"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-300">Precipitation</label>
                          <input
                            type="text"
                            value={weatherInputData.precipitation}
                            onChange={(e) => setWeatherInputData(prev => ({ ...prev, precipitation: e.target.value }))}
                            placeholder="e.g., 0% or None"
                            className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                            data-testid="input-weather-precipitation"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-300">Visibility</label>
                          <input
                            type="text"
                            value={weatherInputData.visibility}
                            onChange={(e) => setWeatherInputData(prev => ({ ...prev, visibility: e.target.value }))}
                            placeholder="e.g., 10 miles"
                            className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                            data-testid="input-weather-visibility"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-300">Humidity (%)</label>
                          <input
                            type="text"
                            value={weatherInputData.humidity}
                            onChange={(e) => setWeatherInputData(prev => ({ ...prev, humidity: e.target.value }))}
                            placeholder="e.g., 45%"
                            className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                            data-testid="input-weather-humidity"
                          />
                        </div>
                      </div>
                      
                      {/* Weather Summary Display */}
                      {(weatherInputData.temperature || weatherInputData.windSpeed || weatherInputData.conditions) && (
                        <div className="mt-4 p-4 bg-slate-800/40 rounded-lg border border-cyan-500/20">
                          <p className="text-sm text-slate-300" data-testid="text-weather-summary">
                            <span className="text-cyan-400 font-semibold">Current Conditions: </span>
                            {weatherInputData.temperature && `${weatherInputData.temperature}`}
                            {weatherInputData.conditions && `, ${weatherInputData.conditions}`}
                            {weatherInputData.windSpeed && ` • Wind: ${weatherInputData.windSpeed}`}
                            {weatherInputData.humidity && ` • Humidity: ${weatherInputData.humidity}`}
                            {weatherInputData.precipitation && ` • Precipitation: ${weatherInputData.precipitation}`}
                            {weatherInputData.visibility && ` • Visibility: ${weatherInputData.visibility}`}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {section.items.map((item) => (
                    <motion.div
                      key={item.id}
                      layoutId={item.id}
                      onClick={() => setActiveItem(activeItem === item.id ? null : item.id)}
                      className={`p-6 rounded-xl cursor-pointer transition-all duration-300 ${
                        activeItem === item.id
                          ? 'bg-slate-700/60 border-blue-400/60 shadow-lg'
                          : 'bg-slate-700/30 border-transparent hover:bg-slate-700/40'
                      } border`}
                    >
                      <div className="flex items-start space-x-4">
                        {item.critical && (
                          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-white font-medium leading-relaxed">{item.question}</p>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFlag(item.id);
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                responses[item.id]?.flagged
                                  ? 'text-red-400 bg-red-400/20'
                                  : 'text-gray-400 hover:text-gray-300 hover:bg-slate-600/50'
                              }`}
                            >
                              <Flag className="w-5 h-5" />
                            </motion.button>
                          </div>

                          {/* Enhanced Input System */}
                          <div className="mb-4">
                            {/* Structured Questions for sa-1 through sa-6 */}
                            {item.id === 'sa-1' ? (
                              <ProjectLocationQuestion 
                                data={projectLocationData} 
                                onChange={handleProjectLocationDataChange}
                              />
                            ) : item.id === 'sa-2' ? (
                              <GlassInstallationQuestion 
                                data={glassInstallationData} 
                                onChange={handleGlassInstallationDataChange}
                              />
                            ) : item.id === 'sa-3' ? (
                              <BuildingAccessQuestion 
                                data={buildingAccessData} 
                                onChange={handleBuildingAccessDataChange}
                              />
                            ) : item.id === 'sa-4' ? (
                              <PublicExposureQuestion 
                                data={publicExposureData} 
                                onChange={handlePublicExposureDataChange}
                              />
                            ) : item.id === 'sa-5' ? (
                              <WindConditionsQuestion 
                                data={windData} 
                                onChange={handleWindDataChange}
                              />
                            ) : item.id === 'sa-6' ? (
                              <TemperatureQuestion 
                                data={tempData} 
                                onChange={handleTempDataChange}
                              />
                            ) : item.id === 'sa-7' ? (
                              <PrecipitationQuestion 
                                data={precipitationData} 
                                onChange={handlePrecipitationDataChange}
                              />
                            ) : item.id === 'sa-8' ? (
                              <GlassHandlingQuestion 
                                data={glassHandlingData} 
                                onChange={handleGlassHandlingDataChange}
                              />
                            ) : item.id === 'sa-9' ? (
                              <FallProtectionQuestion 
                                data={fallProtectionData} 
                                onChange={handleFallProtectionDataChange}
                              />
                            ) : item.id === 'sa-10' ? (
                              <EquipmentCertificationQuestion 
                                data={equipmentCertificationData} 
                                onChange={handleEquipmentCertificationDataChange}
                              />
                            ) : item.id === 'sa-11' ? (
                              <GlassStorageQuestion 
                                data={glassStorageData} 
                                onChange={handleGlassStorageDataChange}
                              />
                            ) : item.id === 'sa-12' ? (
                              <TransportPathQuestion 
                                data={transportPathData} 
                                onChange={handleTransportPathDataChange}
                              />
                            ) : item.id === 'sa-13' ? (
                              <GlassPanelRiskQuestion 
                                data={glassPanelRiskData} 
                                onChange={handleGlassPanelRiskDataChange}
                              />
                            ) : item.id === 'sa-14' ? (
                              <CrewQualificationsQuestion 
                                data={crewQualificationsData} 
                                onChange={handleCrewQualificationsDataChange}
                              />
                            ) : item.id === 'sa-15' ? (
                              <PPEInspectionQuestion 
                                data={ppeInspectionData} 
                                onChange={handlePPEInspectionDataChange}
                              />
                            ) : item.id === 'sa-16' ? (
                              <CommunicationSystemsQuestion 
                                data={communicationSystemsData} 
                                onChange={handleCommunicationSystemsDataChange}
                              />
                            ) : item.id === 'sa-17' ? (
                              <EmergencyEquipmentQuestion 
                                data={emergencyEquipmentData} 
                                onChange={handleEmergencyEquipmentDataChange}
                              />
                            ) : item.id === 'sa-18' ? (
                              <EmergencyPlanQuestion 
                                data={emergencyPlanData} 
                                onChange={handleEmergencyPlanDataChange}
                              />
                            ) : item.id === 'sa-19' ? (
                              <GroundProtectionQuestion 
                                data={groundProtectionData} 
                                onChange={handleGroundProtectionDataChange}
                              />
                            ) : item.id === 'sa-20' ? (
                              <AdjacentPropertyQuestion 
                                data={adjacentPropertyData} 
                                onChange={handleAdjacentPropertyDataChange}
                              />
                            ) : item.inputType === 'select' && item.options.length > 0 ? (
                              // Dropdown select for multiple choice questions
                              <select
                                value={responses[item.id]?.value || ''}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleResponse(item.id, e.target.value);
                                }}
                                className="w-full p-4 rounded-xl bg-slate-700/50 border border-blue-500/20 text-white focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all"
                                required={item.required}
                              >
                                <option value="">Select an option...</option>
                                {item.options.map((option, optionIndex) => (
                                  <option key={optionIndex} value={option} className="bg-slate-800 text-white">
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : item.inputType === 'textarea' ? (
                              // Text area for detailed responses
                              <textarea
                                value={responses[item.id]?.value || ''}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleResponse(item.id, e.target.value);
                                }}
                                placeholder={item.placeholder || 'Enter detailed response...'}
                                className="w-full h-32 p-4 rounded-xl bg-slate-700/50 border border-blue-500/20 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all resize-none"
                                required={item.required}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : item.inputType === 'number' ? (
                              // Number input for measurements, quantities
                              <input
                                type="number"
                                value={responses[item.id]?.value || ''}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleResponse(item.id, e.target.value);
                                }}
                                placeholder={item.placeholder || 'Enter number...'}
                                className="w-full p-4 rounded-xl bg-slate-700/50 border border-blue-500/20 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all"
                                required={item.required}
                                onClick={(e) => e.stopPropagation()}
                                step="0.1"
                              />
                            ) : (
                              // Default text input
                              <input
                                type={item.inputType || 'text'}
                                value={responses[item.id]?.value || ''}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleResponse(item.id, e.target.value);
                                }}
                                placeholder={item.placeholder || 'Enter response...'}
                                className="w-full p-4 rounded-xl bg-slate-700/50 border border-blue-500/20 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all"
                                required={item.required}
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}
                            {item.required && !responses[item.id]?.value && (
                              <p className="text-red-400 text-sm mt-2 flex items-center">
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                This field is required
                              </p>
                            )}
                          </div>

                          <AnimatePresence>
                            {activeItem === item.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-4 pt-4 border-t border-blue-500/20"
                              >
                                {item.notes && (
                                  <div className="flex items-start space-x-3">
                                    <MessageSquare className="w-5 h-5 text-gray-400 mt-3" />
                                    <textarea
                                      value={responses[item.id]?.notes || ''}
                                      onChange={(e) => handleNotes(item.id, e.target.value)}
                                      placeholder="Add detailed notes here..."
                                      className="flex-1 h-32 p-4 rounded-xl bg-slate-700/50 border border-blue-500/20 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all resize-none"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                )}

                                {/* Enhanced File and Image Upload System */}
                                {(item.images || item.files) && (
                                  <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                      <Upload className="w-5 h-5 text-gray-400" />
                                      <span className="text-gray-400 font-medium">
                                        {item.files ? 'Files & Blueprints' : 'Images'}
                                      </span>
                                    </div>
                                    
                                    {/* Display uploaded files/images */}
                                    {responses[item.id]?.images && responses[item.id]?.images && responses[item.id]!.images!.length > 0 && (
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {responses[item.id]!.images!.map((image, index) => (
                                          <div key={index} className="relative group">
                                            <img
                                              src={image}
                                              alt={`Attachment ${index + 1}`}
                                              className="w-full h-20 object-cover rounded-lg border border-blue-500/20"
                                            />
                                            <motion.button
                                              whileTap={{ scale: 0.9 }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const newImages = responses[item.id]?.images?.filter((_, i) => i !== index) || [];
                                                setResponses(prev => ({
                                                  ...prev,
                                                  [item.id]: {
                                                    ...prev[item.id],
                                                    images: newImages
                                                  }
                                                }));
                                              }}
                                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                              <X className="w-4 h-4 text-white" />
                                            </motion.button>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Display uploaded blueprints */}
                                    {responses[item.id]?.blueprints && responses[item.id]!.blueprints!.length > 0 && (
                                      <div className="space-y-2 mb-4">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <Building className="w-5 h-5 text-blue-400" />
                                          <span className="text-blue-400 font-medium">Uploaded Blueprints</span>
                                        </div>
                                        {responses[item.id]?.blueprints?.map((blueprint, index) => (
                                          <div key={blueprint.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 border border-blue-500/20">
                                            <div className="flex items-center space-x-3">
                                              <FileImage className="w-5 h-5 text-blue-400" />
                                              <div>
                                                <p className="text-white text-sm font-medium">{blueprint.fileName}</p>
                                                <p className="text-gray-400 text-xs">
                                                  {(blueprint.fileSize / 1024 / 1024).toFixed(2)} MB
                                                  {blueprint.analysisStatus === 'completed' && (
                                                    <span className="ml-2 text-green-400">✓ AI Analyzed</span>
                                                  )}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                              <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  window.open(blueprint.fileUrl, '_blank');
                                                }}
                                                className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
                                                title="View Blueprint"
                                              >
                                                <Eye className="w-4 h-4" />
                                              </motion.button>
                                              <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                onClick={async (e) => {
                                                  e.stopPropagation();
                                                  await blueprintStorage.deleteBlueprint(blueprint.id, blueprint.fileName);
                                                  const newBlueprints = responses[item.id]?.blueprints?.filter(b => b.id !== blueprint.id) || [];
                                                  setResponses(prev => ({
                                                    ...prev,
                                                    [item.id]: {
                                                      ...prev[item.id],
                                                      blueprints: newBlueprints
                                                    }
                                                  }));
                                                }}
                                                className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                                                title="Delete Blueprint"
                                              >
                                                <X className="w-4 h-4" />
                                              </motion.button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Upload controls */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                      {/* Blueprint upload */}
                                      {item.files && (
                                        <>
                                          <input
                                            type="file"
                                            accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png,.svg"
                                            multiple
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              if (e.target.files) handleBlueprintUpload(item.id, e.target.files);
                                            }}
                                            className="hidden"
                                            id={`blueprint-${item.id}`}
                                          />
                                          <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              document.getElementById(`blueprint-${item.id}`)?.click();
                                            }}
                                            disabled={uploadingBlueprints[item.id]}
                                            className="h-12 flex items-center justify-center space-x-2 border-2 border-dashed border-cyan-500/30 rounded-lg hover:border-cyan-400/60 hover:bg-cyan-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            {uploadingBlueprints[item.id] ? (
                                              <Loader className="w-5 h-5 text-cyan-400 animate-spin" />
                                            ) : (
                                              <Building className="w-5 h-5 text-cyan-400" />
                                            )}
                                            <span className="text-cyan-400 text-sm font-medium">
                                              {uploadingBlueprints[item.id] ? 'Uploading...' : 'Blueprints'}
                                            </span>
                                          </motion.button>
                                        </>
                                      )}
                                      
                                      {/* Image upload */}
                                      {item.images && (
                                        <>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              if (e.target.files) handleImageUpload(item.id, e.target.files);
                                            }}
                                            className="hidden"
                                            id={`image-${item.id}`}
                                          />
                                          <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              document.getElementById(`image-${item.id}`)?.click();
                                            }}
                                            className="h-12 flex items-center justify-center space-x-2 border-2 border-dashed border-blue-500/30 rounded-lg hover:border-blue-400/60 hover:bg-blue-500/10 transition-all"
                                          >
                                            <Upload className="w-5 h-5 text-blue-400" />
                                            <span className="text-blue-400 text-sm font-medium">Upload Images</span>
                                          </motion.button>
                                          
                                          {/* Camera capture */}
                                          <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleCaptureImage(item.id);
                                            }}
                                            className="h-12 flex items-center justify-center space-x-2 border-2 border-dashed border-purple-500/30 rounded-lg hover:border-purple-400/60 hover:bg-purple-500/10 transition-all"
                                          >
                                            <Camera className="w-5 h-5 text-purple-400" />
                                            <span className="text-purple-400 text-sm font-medium">Take Photo</span>
                                          </motion.button>
                                        </>
                                      )}
                                    </div>
                                    
                                    {item.files && (
                                      <p className="text-gray-400 text-xs">
                                        Supported: PDF, DWG, Images, Documents (Max 10MB each)
                                      </p>
                                    )}
                                  </div>
                                )}

                                {item.deadline && (
                                  <div className="flex items-center space-x-3">
                                    <Clock className="w-5 h-5 text-gray-400" />
                                    <input
                                      type="datetime-local"
                                      value={responses[item.id]?.deadline || ''}
                                      onChange={(e) => handleDeadline(item.id, e.target.value)}
                                      className="bg-slate-700/50 border border-blue-500/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}


        {/* Submit Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={isProcessing}
          data-testid="button-submit-analysis"
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium flex items-center justify-center space-x-3 hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {isProcessing ? (
            <>
              <Loader className="w-6 h-6 animate-spin" />
              <div className="flex flex-col items-center">
                <span className="font-semibold">Processing Analysis...</span>
                {processingStatus && (
                  <span className="text-sm text-cyan-200 mt-1">{processingStatus}</span>
                )}
              </div>
            </>
          ) : (
            <>
              <Send className="w-6 h-6" />
              <span>Submit for AI Analysis</span>
              <Sparkles className="w-5 h-5 animate-pulse" />
            </>
          )}
        </motion.button>
        
        {/* Progress Status Display */}
        {isProcessing && processingStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <Loader className="w-5 h-5 animate-spin text-blue-400" />
              <div className="flex-1">
                <p className="text-sm text-blue-300 font-medium">{processingStatus}</p>
                <p className="text-xs text-gray-400 mt-1">
                  This may take 2-3 minutes. Please don't close this page.
                </p>
              </div>
            </div>
          </motion.div>
        )}



        {/* AI Analysis Response */}
        {aiResponse && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FileText className="w-6 h-6 text-cyan-400 mr-3" />
                <h3 className="text-xl font-bold text-white">Professional Safety Report</h3>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={shareReport}
                  className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors duration-200 flex items-center space-x-2 text-sm"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
                <button
                  onClick={emailReport}
                  className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors duration-200 flex items-center space-x-2 text-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Email</span>
                </button>
                <button
                  onClick={saveReportToDatabase}
                  className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors duration-200 flex items-center space-x-2 text-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
                {currentAnalysisId && (
                  <button
                    onClick={() => navigate(`/history/${currentAnalysisId}`)}
                    className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg transition-colors duration-200 flex items-center space-x-2 text-sm"
                    data-testid="button-view-agent-outputs"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Agent Outputs</span>
                  </button>
                )}
              </div>
            </div>
            <div className="prose prose-invert max-w-none">
              <div className="text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">{aiResponse}</div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ChecklistForm;