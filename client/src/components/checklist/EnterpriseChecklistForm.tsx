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
  ThermometerSun,
  Building2,
  Calendar,
  Camera,
  FileText,
  Cloud
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
      (responses.identifiedHazards?.length ?? 0) > 0,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-blue-900">
      {/* Professional Header with Enterprise Styling */}
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b border-gray-200/80 dark:border-gray-700/80 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <BackButton />
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                    Job Hazard Analysis (JHA)
                  </h1>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-xl border">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">COMPLETION</div>
                <ProgressBar 
                  value={calculateCompletion()} 
                  className="w-24"
                  showPercentage={true}
                />
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="shadow-sm"
                  onClick={() => window.print()}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="shadow-sm"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="shadow-sm"
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || calculateCompletion() < 100}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit JHA
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Enhanced Styling */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid grid-cols-4 w-full max-w-3xl mx-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-2 rounded-2xl">
              <TabsTrigger value="site-info" className="rounded-xl font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Site Info</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="hazards" className="rounded-xl font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Hazards</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="ppe" className="rounded-xl font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>PPE & Safety</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="documentation" className="rounded-xl font-medium transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Documentation</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Site Information Tab with Enhanced Design */}
          <TabsContent value="site-info" className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <SafetyCard
                title="Project & Site Details"
                description="Core project information and environmental conditions"
                status="in-progress"
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-blue-100 dark:border-blue-900/50 shadow-xl"
              >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span>Site Location</span>
                  </label>
                  <Input
                    placeholder="Enter complete site address or project area"
                    value={responses.siteLocation || ''}
                    onChange={(e) => setResponses({...responses, siteLocation: e.target.value})}
                    className="border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl shadow-sm transition-all duration-200"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-blue-500" />
                    <span>Project Phase</span>
                  </label>
                  <Select
                    value={responses.projectPhase}
                    onValueChange={(value) => setResponses({...responses, projectPhase: value})}
                  >
                    <SelectTrigger className="border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl shadow-sm transition-all duration-200">
                      <SelectValue placeholder="Select current construction phase" />
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

                {/* Weather Information Section */}
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                    <Cloud className="h-4 w-4 text-blue-500" />
                    <span>Weather Conditions</span>
                  </label>
                  
                  {/* Quick Weather Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Basic Weather Type</label>
                    <Select
                      value={responses.weatherCondition}
                      onValueChange={(value) => setResponses({...responses, weatherCondition: value})}
                    >
                      <SelectTrigger className="border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl">
                        <SelectValue placeholder="Select basic weather" />
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

                  {/* Detailed Weather Data Box */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      📊 Detailed Weather Data (Copy from Weather Center)
                    </label>
                    <div className="relative">
                      <Textarea
                        placeholder="PASTE WEATHER DATA HERE → Go to Weather Center, copy the weather report, and paste it here for AI analysis&#10;&#10;Example:&#10;Temperature: 78°F&#10;Humidity: 35%&#10;Wind: 14 mph (gusts 22 mph)&#10;Pressure: 1008 hPa&#10;Conditions: Clear skies"
                        value={responses.detailedWeather || ''}
                        onChange={(e) => setResponses({...responses, detailedWeather: e.target.value})}
                        className="min-h-[120px] text-sm border-2 border-blue-200 dark:border-blue-800 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl bg-blue-50/30 dark:bg-blue-950/30 resize-none"
                        rows={6}
                      />
                      <div className="absolute top-2 right-2">
                        <div className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md font-medium">
                          Weather Center → Copy → Paste Here
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                        ⚡ Pro Tip: Navigate to Weather Center → Copy the complete weather report → Paste above for detailed AI safety analysis
                      </p>
                    </div>
                  </div>
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
            </motion.div>
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
                  Additional Hazard Notes & Weather Data
                </label>
                <Textarea
                  placeholder="Describe any additional hazards or concerns...&#10;&#10;💡 WEATHER DATA: Copy weather report from Weather Center and paste here for AI analysis&#10;Example: Temperature: 78°F, Humidity: 35%, Wind: 14 mph (gusts 22 mph), Pressure: 1008 hPa"
                  rows={6}
                  value={responses.additionalNotes || ''}
                  onChange={(e) => setResponses({...responses, additionalNotes: e.target.value})}
                />
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  ⚡ Pro Tip: Navigate to Weather Center → Copy complete weather report → Paste above for detailed safety analysis
                </p>
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