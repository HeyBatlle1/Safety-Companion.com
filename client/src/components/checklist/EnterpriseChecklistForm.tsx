import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  Save, 
  Share2, 
  Printer, 
  CheckCircle,
  Clock,
  MapPin,
  Users,
  HardHat,
  Hammer,
  Shield,
  Zap,
  Droplets,
  Wind,
  Sun,
  CloudRain,
  Snowflake,
  ThermometerSun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SafetyCard } from '@/components/ui/safety-card';
import { SafetyToggle, type ToggleState } from '@/components/ui/safety-toggle';
import { HazardSelector } from '@/components/ui/hazard-selector';
import { SeveritySlider } from '@/components/ui/severity-slider';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { WorkerCounter } from '@/components/ui/worker-counter';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { showToast } from '@/components/common/ToastContainer';
import { safetyCompanionAPI } from '@/services/safetyCompanionAPI';
import BackButton from '@/components/navigation/BackButton';

// Professional hazard options with severity levels
const hazardOptions = [
  { value: "fall_risk", label: "Fall Risk", severity: "high" as const },
  { value: "chemical_exposure", label: "Chemical Exposure", severity: "critical" as const },
  { value: "electrical_hazard", label: "Electrical Hazard", severity: "high" as const },
  { value: "struck_by", label: "Struck-By Object", severity: "medium" as const },
  { value: "caught_between", label: "Caught In/Between", severity: "high" as const },
  { value: "heat_stress", label: "Heat Stress", severity: "medium" as const },
  { value: "noise_exposure", label: "Noise Exposure", severity: "low" as const },
  { value: "confined_space", label: "Confined Space", severity: "critical" as const },
  { value: "slip_trip", label: "Slip/Trip Hazard", severity: "medium" as const },
  { value: "overhead_work", label: "Overhead Work", severity: "medium" as const }
];

// Professional PPE items
const ppeItems = [
  { id: "hard_hat", label: "Hard Hats", icon: <HardHat className="w-5 h-5" /> },
  { id: "safety_vest", label: "Safety Vests", icon: <Shield className="w-5 h-5" /> },
  { id: "steel_toes", label: "Steel Toe Boots", icon: <Hammer className="w-5 h-5" /> },
  { id: "safety_glasses", label: "Safety Glasses", icon: <Shield className="w-5 h-5" /> },
  { id: "gloves", label: "Work Gloves", icon: <Shield className="w-5 h-5" /> },
  { id: "hearing_protection", label: "Hearing Protection", icon: <Shield className="w-5 h-5" /> }
];

// Weather condition icons
const weatherIcons = {
  clear: <Sun className="w-5 h-5 text-yellow-500" />,
  rain: <CloudRain className="w-5 h-5 text-blue-500" />,
  snow: <Snowflake className="w-5 h-5 text-blue-300" />,
  wind: <Wind className="w-5 h-5 text-gray-500" />,
  hot: <ThermometerSun className="w-5 h-5 text-red-500" />,
  cold: <Snowflake className="w-5 h-5 text-blue-500" />
};

interface ChecklistResponse {
  // Site Information
  siteLocation?: string;
  projectPhase?: string;
  weatherCondition?: string;
  temperature?: number;
  
  // Personnel
  workerCount?: number;
  supervisorName?: string;
  
  // Hazards
  identifiedHazards?: string[];
  overallRiskLevel?: number;
  
  // PPE Compliance
  ppeCompliance?: Record<string, ToggleState>;
  
  // Equipment
  equipmentInspected?: ToggleState;
  equipmentNotes?: string;
  
  // Photos
  hazardPhotos?: string[];
  sitePhotos?: string[];
  
  // Additional
  additionalNotes?: string;
  emergencyPlanReviewed?: ToggleState;
  toolboxTalkConducted?: ToggleState;
}

export default function EnterpriseChecklistForm() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  
  const [responses, setResponses] = useState<ChecklistResponse>({
    ppeCompliance: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("site-info");
  
  // Calculate completion percentage
  const calculateCompletion = () => {
    const fields = [
      responses.siteLocation,
      responses.projectPhase,
      responses.weatherCondition,
      responses.workerCount !== undefined,
      responses.supervisorName,
      responses.identifiedHazards?.length > 0,
      responses.overallRiskLevel !== undefined,
      Object.keys(responses.ppeCompliance || {}).length === ppeItems.length,
      responses.equipmentInspected,
      responses.emergencyPlanReviewed,
      responses.toolboxTalkConducted
    ];
    
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Save logic here
      showToast('Checklist saved successfully', 'success');
    } catch (error) {
      showToast('Failed to save checklist', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (calculateCompletion() < 100) {
      showToast('Please complete all required fields', 'warning');
      return;
    }
    
    setIsLoading(true);
    try {
      // Submit logic here
      showToast('Checklist submitted successfully', 'success');
      navigate('/checklists');
    } catch (error) {
      showToast('Failed to submit checklist', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Professional Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <BackButton />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Daily Safety Inspection
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <ProgressBar 
                value={calculateCompletion()} 
                className="w-32"
                showPercentage={true}
              />
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.print()}
                >
                  <Printer className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || calculateCompletion() < 100}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto">
            <TabsTrigger value="site-info">Site Info</TabsTrigger>
            <TabsTrigger value="hazards">Hazards</TabsTrigger>
            <TabsTrigger value="ppe">PPE & Safety</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
          </TabsList>

          {/* Site Information Tab */}
          <TabsContent value="site-info" className="space-y-6">
            <SafetyCard
              title="Site Information"
              description="Basic project and environmental details"
              status="in-progress"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Site Location
                  </label>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Enter site address or area"
                      value={responses.siteLocation || ''}
                      onChange={(e) => setResponses({...responses, siteLocation: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Project Phase
                  </label>
                  <Select
                    value={responses.projectPhase}
                    onValueChange={(value) => setResponses({...responses, projectPhase: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project phase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="site-prep">Site Preparation</SelectItem>
                      <SelectItem value="foundation">Foundation</SelectItem>
                      <SelectItem value="framing">Framing</SelectItem>
                      <SelectItem value="roofing">Roofing</SelectItem>
                      <SelectItem value="exterior">Exterior</SelectItem>
                      <SelectItem value="interior">Interior</SelectItem>
                      <SelectItem value="finishing">Finishing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Weather Conditions
                  </label>
                  <Select
                    value={responses.weatherCondition}
                    onValueChange={(value) => setResponses({...responses, weatherCondition: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select weather" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clear">
                        <div className="flex items-center space-x-2">
                          {weatherIcons.clear}
                          <span>Clear</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="rain">
                        <div className="flex items-center space-x-2">
                          {weatherIcons.rain}
                          <span>Rain</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="snow">
                        <div className="flex items-center space-x-2">
                          {weatherIcons.snow}
                          <span>Snow</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="wind">
                        <div className="flex items-center space-x-2">
                          {weatherIcons.wind}
                          <span>High Wind</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Temperature (°F)
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter temperature"
                    value={responses.temperature || ''}
                    onChange={(e) => setResponses({...responses, temperature: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <WorkerCounter
                value={responses.workerCount || 0}
                onChange={(value) => setResponses({...responses, workerCount: value})}
                label="Workers on Site"
                max={100}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Site Supervisor
                </label>
                <Input
                  placeholder="Enter supervisor name"
                  value={responses.supervisorName || ''}
                  onChange={(e) => setResponses({...responses, supervisorName: e.target.value})}
                />
              </div>
            </SafetyCard>
          </TabsContent>

          {/* Hazards Tab */}
          <TabsContent value="hazards" className="space-y-6">
            <SafetyCard
              title="Hazard Assessment"
              description="Identify and evaluate site hazards"
              status={responses.identifiedHazards?.length ? "in-progress" : "pending"}
              priority={responses.overallRiskLevel && responses.overallRiskLevel > 7 ? "critical" : "medium"}
            >
              <HazardSelector
                options={hazardOptions}
                value={responses.identifiedHazards || []}
                onChange={(value) => setResponses({...responses, identifiedHazards: value})}
                placeholder="Select all identified hazards"
              />

              <SeveritySlider
                value={responses.overallRiskLevel || 1}
                onChange={(value) => setResponses({...responses, overallRiskLevel: value})}
                label="Overall Site Risk Level"
              />

              <PhotoUpload
                value={responses.hazardPhotos || []}
                onChange={(value) => setResponses({...responses, hazardPhotos: value})}
                label="Hazard Evidence Photos"
                maxPhotos={5}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Additional Hazard Notes
                </label>
                <Textarea
                  placeholder="Describe any additional hazards or concerns..."
                  rows={4}
                  value={responses.additionalNotes || ''}
                  onChange={(e) => setResponses({...responses, additionalNotes: e.target.value})}
                />
              </div>
            </SafetyCard>
          </TabsContent>

          {/* PPE & Safety Tab */}
          <TabsContent value="ppe" className="space-y-6">
            <SafetyCard
              title="PPE Compliance"
              description="Verify personal protective equipment usage"
              status={Object.keys(responses.ppeCompliance || {}).length === ppeItems.length ? "completed" : "in-progress"}
            >
              <div className="space-y-3">
                {ppeItems.map((item) => (
                  <SafetyToggle
                    key={item.id}
                    label={item.label}
                    icon={item.icon}
                    value={responses.ppeCompliance?.[item.id] || "na"}
                    onChange={(value) => setResponses({
                      ...responses,
                      ppeCompliance: {
                        ...responses.ppeCompliance,
                        [item.id]: value
                      }
                    })}
                    required
                  />
                ))}
              </div>
            </SafetyCard>

            <SafetyCard
              title="Equipment & Safety Protocols"
              description="Equipment inspection and safety measures"
              status="pending"
            >
              <SafetyToggle
                label="All equipment inspected and tagged"
                icon={<Zap className="w-5 h-5" />}
                value={responses.equipmentInspected || "na"}
                onChange={(value) => setResponses({...responses, equipmentInspected: value})}
                required
              />

              <SafetyToggle
                label="Emergency action plan reviewed"
                icon={<AlertTriangle className="w-5 h-5" />}
                value={responses.emergencyPlanReviewed || "na"}
                onChange={(value) => setResponses({...responses, emergencyPlanReviewed: value})}
                required
              />

              <SafetyToggle
                label="Toolbox talk conducted"
                icon={<Users className="w-5 h-5" />}
                value={responses.toolboxTalkConducted || "na"}
                onChange={(value) => setResponses({...responses, toolboxTalkConducted: value})}
                required
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Equipment Notes
                </label>
                <Textarea
                  placeholder="Note any equipment issues or maintenance needs..."
                  rows={3}
                  value={responses.equipmentNotes || ''}
                  onChange={(e) => setResponses({...responses, equipmentNotes: e.target.value})}
                />
              </div>
            </SafetyCard>
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="documentation" className="space-y-6">
            <SafetyCard
              title="Site Documentation"
              description="Photos and additional documentation"
              status="pending"
            >
              <PhotoUpload
                value={responses.sitePhotos || []}
                onChange={(value) => setResponses({...responses, sitePhotos: value})}
                label="General Site Photos"
                maxPhotos={10}
              />

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  AI Safety Analysis Available
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Based on your inputs, our AI can provide personalized safety recommendations and risk mitigation strategies.
                </p>
                <Button variant="outline" size="sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Safety Report
                </Button>
              </div>
            </SafetyCard>
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Action Button for Mobile */}
      <motion.div
        className="fixed bottom-6 right-6 md:hidden"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring" }}
      >
        <Button
          size="lg"
          className="rounded-full shadow-lg"
          onClick={handleSubmit}
          disabled={isLoading || calculateCompletion() < 100}
        >
          <CheckCircle className="h-5 w-5" />
        </Button>
      </motion.div>
    </div>
  );
}