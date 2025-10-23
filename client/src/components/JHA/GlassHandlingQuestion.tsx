import { Wrench, AlertCircle } from 'lucide-react';
import { StructuredCheckboxGroup, StructuredNumberField, StructuredTextField, StructuredRadioGroup, PhotoHints, AgentNote, CriticalWarning } from './StructuredQuestionComponents';

export interface GlassHandlingData {
  liftingMethod: string[];
  numberOfCups: string;
  capacityPerCup: string;
  totalCapacity: string;
  actualLoad: string;
  safetyFactor: string;
  backupSystems: string[];
  cupsInspected: string;
  riggingInspected: string;
  vacuumPumpTested: string;
  inspectionFindings: string[];
  damageDescription: string;
  loadDistribution: string;
}

interface GlassHandlingQuestionProps {
  data: GlassHandlingData;
  onChange: (data: GlassHandlingData) => void;
}

export function GlassHandlingQuestion({ data, onChange }: GlassHandlingQuestionProps) {
  const updateField = (field: keyof GlassHandlingData, value: string | string[]) => {
    onChange({ ...data, [field]: value });
  };

  const usingSuctionCups = data.liftingMethod.includes('suction-cups');
  const noBackup = data.backupSystems.includes('no-backup');
  const notInspected = data.inspectionFindings.includes('not-inspected');
  const showSinglePointFailure = noBackup;
  const showInspectionViolation = notInspected;
  
  const safetyFactorNum = parseFloat(data.safetyFactor);
  const showSafetyFactorWarning = !isNaN(safetyFactorNum) && safetyFactorNum < 4;
  
  const poorInspection = data.cupsInspected === 'over-week' || data.riggingInspected === 'over-week' || data.vacuumPumpTested === 'over-week' || data.cupsInspected === 'unknown' || data.riggingInspected === 'unknown' || data.vacuumPumpTested === 'unknown';
  const showCriticalCombo = noBackup && poorInspection;

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center space-x-2 text-blue-400 font-semibold">
        <Wrench className="w-5 h-5" />
        <span>GLASS HANDLING TOOLS & RIGGING</span>
      </div>

      <CriticalWarning>
        Equipment failure is the #2 cause of glass drop incidents
      </CriticalWarning>

      <StructuredCheckboxGroup
        label="Primary Lifting Method"
        options={[
          { value: 'suction-cups', label: 'Suction Cups / Vacuum Lifters' },
          { value: 'clamps', label: 'Clamps / Mechanical Grips' },
          { value: 'slings', label: 'Slings / Soft Rigging' },
          { value: 'spreader-bar', label: 'Custom Spreader Bar / Frame' }
        ]}
        selectedValues={data.liftingMethod}
        onChange={(value) => updateField('liftingMethod', value)}
        required
      />

      {usingSuctionCups && (
        <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
          <div className="text-sm font-medium text-gray-300">Suction Cup Details</div>
          
          <div className="grid grid-cols-2 gap-4">
            <StructuredNumberField
              label="Number of Cups"
              value={data.numberOfCups}
              onChange={(value) => updateField('numberOfCups', value)}
              placeholder="e.g., 4"
              required
            />
            <StructuredNumberField
              label="Rated Capacity Per Cup"
              value={data.capacityPerCup}
              onChange={(value) => updateField('capacityPerCup', value)}
              unit="lbs"
              placeholder="Per cup capacity"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StructuredNumberField
              label="Total Capacity"
              value={data.totalCapacity}
              onChange={(value) => updateField('totalCapacity', value)}
              unit="lbs"
              placeholder="All cups combined"
              required
            />
            <StructuredNumberField
              label="Actual Load"
              value={data.actualLoad}
              onChange={(value) => updateField('actualLoad', value)}
              unit="lbs"
              placeholder="Glass weight"
              required
            />
          </div>

          <StructuredNumberField
            label="Safety Factor"
            value={data.safetyFactor}
            onChange={(value) => updateField('safetyFactor', value)}
            placeholder="Capacity ÷ Load (should be ≥ 4:1)"
            hint="Minimum 4:1 safety factor required"
            required
          />

          {showSafetyFactorWarning && (
            <CriticalWarning>
              Safety factor {safetyFactorNum.toFixed(1)}:1 is below minimum 4:1 requirement. DO NOT PROCEED until capacity is increased or load is reduced.
            </CriticalWarning>
          )}
        </div>
      )}

      <StructuredCheckboxGroup
        label="Backup Systems"
        options={[
          { value: 'redundant-cups', label: 'Redundant suction cups (if one fails, others hold)' },
          { value: 'secondary-restraint', label: 'Secondary restraint line' },
          { value: 'safety-netting', label: 'Safety netting below load' },
          { value: 'no-backup', label: 'No backup system' }
        ]}
        selectedValues={data.backupSystems}
        onChange={(value) => updateField('backupSystems', value)}
        required
      />

      {showSinglePointFailure && (
        <CriticalWarning>
          NO BACKUP SYSTEM = SINGLE POINT FAILURE RISK. Equipment failure will result in dropped load.
        </CriticalWarning>
      )}

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Equipment Inspection Status</div>
        
        <StructuredRadioGroup
          label="Suction Cups Inspected"
          options={[
            { value: 'today', label: 'Today' },
            { value: 'this-week', label: 'This week' },
            { value: 'over-week', label: '>1 week ago' },
            { value: 'unknown', label: 'Unknown' }
          ]}
          selectedValue={data.cupsInspected}
          onChange={(value) => updateField('cupsInspected', value)}
          required
        />

        <StructuredRadioGroup
          label="Rigging Inspected"
          options={[
            { value: 'today', label: 'Today' },
            { value: 'this-week', label: 'This week' },
            { value: 'over-week', label: '>1 week ago' },
            { value: 'unknown', label: 'Unknown' }
          ]}
          selectedValue={data.riggingInspected}
          onChange={(value) => updateField('riggingInspected', value)}
          required
        />

        <StructuredRadioGroup
          label="Vacuum Pump Tested"
          options={[
            { value: 'today', label: 'Today' },
            { value: 'this-week', label: 'This week' },
            { value: 'over-week', label: '>1 week ago' },
            { value: 'unknown', label: 'Unknown' }
          ]}
          selectedValue={data.vacuumPumpTested}
          onChange={(value) => updateField('vacuumPumpTested', value)}
          required
        />

        {(data.cupsInspected === 'unknown' || data.riggingInspected === 'unknown' || data.vacuumPumpTested === 'unknown') && (
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-yellow-100">
              "Unknown" inspection status = Agent 1 data quality drops to 3/10
            </span>
          </div>
        )}
      </div>

      <StructuredCheckboxGroup
        label="Inspection Findings"
        options={[
          { value: 'good-condition', label: 'All equipment in good condition' },
          { value: 'minor-wear', label: 'Minor wear (still safe)' },
          { value: 'damage-found', label: 'Damage found' },
          { value: 'not-inspected', label: 'Not inspected' }
        ]}
        selectedValues={data.inspectionFindings}
        onChange={(value) => updateField('inspectionFindings', value)}
        required
      />

      {data.inspectionFindings.includes('damage-found') && (
        <StructuredTextField
          label="Damage Description"
          value={data.damageDescription}
          onChange={(value) => updateField('damageDescription', value)}
          placeholder="Describe the damage found"
          required
        />
      )}

      {showInspectionViolation && (
        <CriticalWarning>
          NOT INSPECTED = OSHA COMPLIANCE VIOLATION. Equipment must be inspected before each use.
        </CriticalWarning>
      )}

      {showCriticalCombo && (
        <CriticalWarning>
          CRITICAL COMBINATION: No backup system + poor inspection = Agent 3 flags as HIGH DROP RISK
        </CriticalWarning>
      )}

      <StructuredRadioGroup
        label="Load Distribution"
        options={[
          { value: 'even', label: 'Evenly distributed across rigging points' },
          { value: 'slightly-off', label: 'Slightly off-center but within limits' },
          { value: 'poor', label: 'Poor distribution' }
        ]}
        selectedValue={data.loadDistribution}
        onChange={(value) => updateField('loadDistribution', value)}
        required
      />

      {data.loadDistribution === 'poor' && (
        <CriticalWarning>
          POOR LOAD DISTRIBUTION = LOAD SHIFT RISK. Reposition rigging before lift.
        </CriticalWarning>
      )}

      <PhotoHints hints={[
        "Suction cups attached to glass (close-up)",
        "Rigging configuration (full setup)",
        "Inspection tag on equipment (date visible)",
        "Vacuum gauge reading",
        "Load distribution (even vs uneven)"
      ]} />
    </div>
  );
}
