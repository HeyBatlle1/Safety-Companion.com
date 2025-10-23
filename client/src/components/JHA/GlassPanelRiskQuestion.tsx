import { useEffect } from 'react';
import { Scale, AlertTriangle, Wind } from 'lucide-react';
import { StructuredRadioGroup, StructuredNumberField, PhotoHints, AgentNote, CriticalWarning } from './StructuredQuestionComponents';

export interface GlassPanelRiskData {
  weightCategory: string;
  actualWeight: string;
  crewSize: string;
  weightPerPerson: string;
  sizeShape: string;
  panelSurfaceArea: string;
  windForce: string;
  canResistWind: string;
  panelsToday: string;
  timePerPanel: string;
  totalHandlingTime: string;
  restBreakFrequency: string;
}

interface GlassPanelRiskQuestionProps {
  data: GlassPanelRiskData;
  onChange: (data: GlassPanelRiskData) => void;
}

export function GlassPanelRiskQuestion({ data, onChange }: GlassPanelRiskQuestionProps) {
  const updateField = (field: keyof GlassPanelRiskData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  // Calculate derived values
  const actualWeight = parseFloat(data.actualWeight);
  const crewSize = parseFloat(data.crewSize);
  const calculatedWeightPerPerson = !isNaN(actualWeight) && !isNaN(crewSize) && crewSize > 0
    ? (actualWeight / crewSize).toFixed(1)
    : '';

  const surfaceArea = parseFloat(data.panelSurfaceArea);
  const calculatedWindForce = !isNaN(surfaceArea)
    ? (surfaceArea * 1.3).toFixed(1)
    : '';

  const panelsToday = parseFloat(data.panelsToday);
  const timePerPanel = parseFloat(data.timePerPanel);
  const calculatedTotalTime = !isNaN(panelsToday) && !isNaN(timePerPanel)
    ? (panelsToday * timePerPanel).toFixed(0)
    : '';

  // Use calculated or existing values for risk assessments
  const weightPerPerson = parseFloat(calculatedWeightPerPerson || data.weightPerPerson);
  const highStrainRisk = !isNaN(weightPerPerson) && weightPerPerson > 50;
  const mediumStrainRisk = !isNaN(weightPerPerson) && weightPerPerson >= 30 && weightPerPerson <= 50;
  
  const windForce = parseFloat(calculatedWindForce || data.windForce);
  const highWindRisk = !isNaN(windForce) && windForce > 60;
  const cannotResistWind = data.canResistWind === 'no';

  const oversized = data.sizeShape === 'oversized';
  const irregular = data.sizeShape === 'irregular';
  const extraHeavy = data.weightCategory === 'extra-heavy';

  const totalTime = parseFloat(calculatedTotalTime || data.totalHandlingTime);
  const longShift = !isNaN(totalTime) && totalTime > 240; // >4 hours

  const criticalWindCombo = highWindRisk && cannotResistWind;

  // Auto-update all calculated fields in a single onChange call
  // Also clear fields when prerequisites are invalid/empty
  useEffect(() => {
    const needsUpdate = 
      calculatedWeightPerPerson !== data.weightPerPerson ||
      calculatedWindForce !== data.windForce ||
      calculatedTotalTime !== data.totalHandlingTime;

    if (needsUpdate) {
      const updatedData = {
        ...data,
        weightPerPerson: calculatedWeightPerPerson,
        windForce: calculatedWindForce,
        totalHandlingTime: calculatedTotalTime
      };
      onChange(updatedData);
    }
  }, [calculatedWeightPerPerson, calculatedWindForce, calculatedTotalTime, data, onChange]);

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center space-x-2 text-blue-400 font-semibold">
        <Scale className="w-5 h-5" />
        <span>GLASS HANDLING RISK FACTORS</span>
      </div>

      <AgentNote>
        Wind force on large panels is the #1 "loss of control" factor in Agent 3's causal chain. 60 sq ft panel in 20 mph wind = 78 lbs lateral force.
      </AgentNote>

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Panel Weight & Manual Handling Risk</div>
        
        <StructuredRadioGroup
          label="Panel Weight Category"
          options={[
            { value: 'light', label: 'Light (<50 lbs, 1-2 person carry)' },
            { value: 'medium', label: 'Medium (50-150 lbs, 2-3 person carry)' },
            { value: 'heavy', label: 'Heavy (150-300 lbs, 3-4 person + equipment)' },
            { value: 'extra-heavy', label: 'Extra Heavy (>300 lbs, mechanical lift REQUIRED)' }
          ]}
          selectedValue={data.weightCategory}
          onChange={(value) => updateField('weightCategory', value)}
          required
        />

        {extraHeavy && (
          <CriticalWarning>
            EXTRA HEAVY LOAD (&gt;300 lbs) - Mechanical lift REQUIRED. Manual handling prohibited per OSHA.
          </CriticalWarning>
        )}

        <div className="grid grid-cols-2 gap-4">
          <StructuredNumberField
            label="Actual Weight Per Panel"
            value={data.actualWeight}
            onChange={(value) => updateField('actualWeight', value)}
            unit="lbs"
            placeholder="Weight"
            required
          />
          <StructuredNumberField
            label="Number of Crew for Manual Handling"
            value={data.crewSize}
            onChange={(value) => updateField('crewSize', value)}
            unit="people"
            placeholder="Crew size"
            required
          />
        </div>

        <StructuredNumberField
          label="Weight Per Person"
          value={calculatedWeightPerPerson}
          onChange={(value) => updateField('weightPerPerson', value)}
          unit="lbs"
          placeholder="Auto-calculated: total ÷ crew"
          hint="Auto-calculated from weight and crew size"
          required
        />

        {highStrainRisk && (
          <CriticalWarning>
            HIGH STRAIN RISK: {calculatedWeightPerPerson} lbs per person EXCEEDS 50 lb SAFE LIMIT. Add more crew or use mechanical assistance.
          </CriticalWarning>
        )}

        {mediumStrainRisk && (
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-yellow-100">
              MEDIUM STRAIN: {calculatedWeightPerPerson} lbs per person. Monitor crew for fatigue, ensure proper lifting technique.
            </span>
          </div>
        )}
      </div>

      <StructuredRadioGroup
        label="Awkward Size/Shape Assessment"
        options={[
          { value: 'standard', label: 'Standard rectangular (easy to grip)' },
          { value: 'large-manageable', label: 'Large but manageable' },
          { value: 'oversized', label: 'Oversized (>6 ft in any dimension)' },
          { value: 'irregular', label: 'Irregular shape' }
        ]}
        selectedValue={data.sizeShape}
        onChange={(value) => updateField('sizeShape', value)}
        required
      />

      {oversized && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-yellow-100">
            CONTROL RISK: Oversized panel (&gt;6 ft) increases difficulty controlling movement, especially in wind.
          </span>
        </div>
      )}

      {irregular && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-yellow-100">
            BALANCE RISK: Irregular shape makes weight distribution unpredictable. Extra caution required.
          </span>
        </div>
      )}

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300 flex items-center space-x-2">
          <Wind className="w-4 h-4" />
          <span>Wind Exposure During Handling (CRITICAL)</span>
        </div>
        
        <StructuredNumberField
          label="Panel Surface Area"
          value={data.panelSurfaceArea}
          onChange={(value) => updateField('panelSurfaceArea', value)}
          unit="sq ft"
          placeholder="Width × Height"
          hint="Calculate: panel width (ft) × height (ft)"
          required
        />

        <StructuredNumberField
          label="Wind Force at 20 mph"
          value={calculatedWindForce}
          onChange={(value) => updateField('windForce', value)}
          unit="lbs"
          placeholder="Auto-calculated: area × 1.3"
          hint="Auto-calculated: surface area × 1.3 lbs/sq ft"
          required
        />

        <StructuredRadioGroup
          label="Can Crew Resist Wind Force?"
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' }
          ]}
          selectedValue={data.canResistWind}
          onChange={(value) => updateField('canResistWind', value)}
          required
        />

        {criticalWindCombo && (
          <CriticalWarning>
            CRITICAL LOSS OF CONTROL RISK: Wind force ({calculatedWindForce} lbs) exceeds crew capacity. STOP WORK until wind subsides or use mechanical restraints.
          </CriticalWarning>
        )}

        {highWindRisk && !cannotResistWind && (
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-yellow-100">
              HIGH WIND FORCE: {calculatedWindForce} lbs lateral force. Monitor wind conditions continuously during handling.
            </span>
          </div>
        )}
      </div>

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Crew Fatigue Factors</div>
        
        <div className="grid grid-cols-2 gap-4">
          <StructuredNumberField
            label="Number of Panels to Install Today"
            value={data.panelsToday}
            onChange={(value) => updateField('panelsToday', value)}
            unit="panels"
            placeholder="Count"
            required
          />
          <StructuredNumberField
            label="Estimated Time Per Panel"
            value={data.timePerPanel}
            onChange={(value) => updateField('timePerPanel', value)}
            unit="minutes"
            placeholder="Time"
            required
          />
        </div>

        <StructuredNumberField
          label="Total Handling Time"
          value={calculatedTotalTime}
          onChange={(value) => updateField('totalHandlingTime', value)}
          unit="minutes"
          placeholder="Auto-calculated: panels × time"
          hint="Auto-calculated from panels and time per panel"
          required
        />

        <StructuredNumberField
          label="Planned Rest Breaks Frequency"
          value={data.restBreakFrequency}
          onChange={(value) => updateField('restBreakFrequency', value)}
          unit="minutes"
          placeholder="e.g., every 60 minutes"
          hint="OSHA recommends breaks every 60-90 minutes for heavy work"
          required
        />

        {longShift && (
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-yellow-100">
              LONG SHIFT: {calculatedTotalTime} minutes ({(parseFloat(calculatedTotalTime) / 60).toFixed(1)} hours) of handling. Fatigue increases incident risk - schedule adequate breaks.
            </span>
          </div>
        )}
      </div>

      <PhotoHints hints={[
        "Panel size reference (person next to glass)",
        "Crew handling panel (grip points visible)",
        "Suction cup attachment points"
      ]} />
    </div>
  );
}
