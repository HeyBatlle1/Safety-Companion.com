import { Shield, Heart, AlertTriangle } from 'lucide-react';
import { StructuredCheckboxGroup, StructuredNumberField, StructuredTextField, StructuredRadioGroup, PhotoHints, AgentNote, CriticalWarning } from './StructuredQuestionComponents';

export interface FallProtectionData {
  primaryProtection: string[];
  harnessType: string;
  dRingLocation: string;
  lanyardType: string[];
  anchorageCapacity: string;
  harnessInspected: string;
  inspectionFindings: string;
  damageDescription: string;
  inspectorName: string;
  freeFallDistance: string;
  lanyardDeceleration: string;
  safetyMargin: string;
  totalClearance: string;
  availableClearance: string;
  clearanceAdequate: string;
  rescuePlan: string[];
  rescueETA: string;
  rescueEquipment: string[];
}

interface FallProtectionQuestionProps {
  data: FallProtectionData;
  onChange: (data: FallProtectionData) => void;
}

export function FallProtectionQuestion({ data, onChange }: FallProtectionQuestionProps) {
  const updateField = (field: keyof FallProtectionData, value: string | string[]) => {
    onChange({ ...data, [field]: value });
  };

  const noPrimaryProtection = data.primaryProtection.includes('none');
  const usingPFAS = data.primaryProtection.includes('pfas');
  const incorrectHarness = data.harnessType === 'other';
  const incorrectDRing = data.dRingLocation === 'chest';
  const lowAnchorage = parseFloat(data.anchorageCapacity) < 5000;
  const noRescuePlan = data.rescuePlan.includes('no-plan');
  const noRescueEquipment = data.rescueEquipment.includes('none');
  const clearanceInadequate = data.clearanceAdequate === 'no';

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center space-x-2 text-blue-400 font-semibold">
        <Shield className="w-5 h-5" />
        <span>FALL PROTECTION SYSTEMS & RESCUE PLAN</span>
      </div>

      <CriticalWarning>
        Fall from 60 ft = likely fatal. Fall protection prevents this. But improper harness use = fall protection FAILS when needed.
      </CriticalWarning>

      <AgentNote>
        OSHA 1926.502(d): Fall protection required for work {'>'}6 ft
      </AgentNote>

      <StructuredCheckboxGroup
        label="Primary Fall Protection"
        options={[
          { value: 'pfas', label: 'Personal Fall Arrest System (PFAS) - harness + lanyard + anchor' },
          { value: 'guardrails', label: 'Guardrails (3-rail system, 42" high)' },
          { value: 'safety-net', label: 'Safety Net (below work area)' },
          { value: 'travel-restraint', label: 'Travel Restraint (prevents reaching edge)' },
          { value: 'none', label: 'None' }
        ]}
        selectedValues={data.primaryProtection}
        onChange={(value) => updateField('primaryProtection', value)}
        required
      />

      {noPrimaryProtection && (
        <CriticalWarning>
          NO FALL PROTECTION = AUTOMATIC NO-GO if work is {'>'}6 ft height. OSHA 1926.502 violation.
        </CriticalWarning>
      )}

      {usingPFAS && (
        <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
          <div className="text-sm font-medium text-gray-300">PFAS Details</div>
          
          <StructuredRadioGroup
            label="Harness Type"
            options={[
              { value: 'full-body', label: 'Full body (correct)' },
              { value: 'other', label: 'Other (belt/chest)' }
            ]}
            value={data.harnessType}
            onChange={(value) => updateField('harnessType', value)}
            required
          />

          {incorrectHarness && (
            <CriticalWarning>
              Only full-body harnesses are allowed for fall arrest. Belt/chest harnesses are PROHIBITED.
            </CriticalWarning>
          )}

          <StructuredRadioGroup
            label="D-ring Location"
            options={[
              { value: 'back', label: 'Back (correct)' },
              { value: 'chest', label: 'Chest (incorrect for fall arrest)' }
            ]}
            value={data.dRingLocation}
            onChange={(value) => updateField('dRingLocation', value)}
            required
          />

          {incorrectDRing && (
            <CriticalWarning>
              D-ring must be on BACK for fall arrest. Chest D-rings are for ladder climbing/rescue only.
            </CriticalWarning>
          )}

          <StructuredCheckboxGroup
            label="Lanyard Type"
            options={[
              { value: 'shock-absorbing', label: 'Shock-absorbing' },
              { value: 'self-retracting', label: 'Self-retracting' },
              { value: 'standard', label: 'Standard' }
            ]}
            selectedValues={data.lanyardType}
            onChange={(value) => updateField('lanyardType', value)}
            required
          />

          <StructuredNumberField
            label="Anchorage Point Capacity"
            value={data.anchorageCapacity}
            onChange={(value) => updateField('anchorageCapacity', value)}
            unit="lbs"
            placeholder="Minimum 5,000 lbs per person"
            hint="OSHA requires minimum 5,000 lbs capacity per worker"
            required
          />

          {lowAnchorage && data.anchorageCapacity && (
            <CriticalWarning>
              Anchorage capacity {data.anchorageCapacity} lbs is below OSHA minimum 5,000 lbs. DO NOT USE this anchor point.
            </CriticalWarning>
          )}
        </div>
      )}

      {usingPFAS && (
        <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
          <div className="text-sm font-medium text-gray-300">Inspection Status</div>
          
          <AgentNote>
            OSHA 1926.502(d)(15): Competent person must inspect equipment before each use
          </AgentNote>

          <StructuredRadioGroup
            label="Harnesses Inspected"
            options={[
              { value: 'before-each-use', label: 'Before each use (correct)' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'unknown', label: 'Unknown' }
            ]}
            value={data.harnessInspected}
            onChange={(value) => updateField('harnessInspected', value)}
            required
          />

          <StructuredRadioGroup
            label="Inspection Findings"
            options={[
              { value: 'no-defects', label: 'No defects' },
              { value: 'minor-wear', label: 'Minor wear' },
              { value: 'damage', label: 'Damage found' }
            ]}
            value={data.inspectionFindings}
            onChange={(value) => updateField('inspectionFindings', value)}
            required
          />

          {data.inspectionFindings === 'damage' && (
            <StructuredTextField
              label="Damage Description"
              value={data.damageDescription}
              onChange={(value) => updateField('damageDescription', value)}
              placeholder="Describe the damage"
              required
            />
          )}

          <StructuredTextField
            label="Inspector Name (Competent Person?)"
            value={data.inspectorName}
            onChange={(value) => updateField('inspectorName', value)}
            placeholder="Name + certification status"
            hint="Must be a designated Competent Person"
            required
          />
        </div>
      )}

      {usingPFAS && (
        <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
          <div className="text-sm font-medium text-gray-300">Fall Clearance Calculation</div>
          
          <div className="grid grid-cols-2 gap-4">
            <StructuredNumberField
              label="Free Fall Distance"
              value={data.freeFallDistance}
              onChange={(value) => updateField('freeFallDistance', value)}
              unit="feet"
              placeholder="Distance before arrest"
              required
            />
            <StructuredNumberField
              label="Lanyard Deceleration"
              value={data.lanyardDeceleration}
              onChange={(value) => updateField('lanyardDeceleration', value)}
              unit="feet"
              placeholder="Shock absorber deployment"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StructuredNumberField
              label="Safety Margin"
              value={data.safetyMargin}
              onChange={(value) => updateField('safetyMargin', value)}
              unit="feet"
              placeholder="Minimum 3 ft"
              hint="OSHA requires minimum 3 ft safety margin"
              required
            />
            <StructuredNumberField
              label="Total Clearance Needed"
              value={data.totalClearance}
              onChange={(value) => updateField('totalClearance', value)}
              unit="feet"
              placeholder="Sum of above"
              required
            />
          </div>

          <StructuredNumberField
            label="Available Clearance"
            value={data.availableClearance}
            onChange={(value) => updateField('availableClearance', value)}
            unit="feet"
            placeholder="Actual distance to ground/obstacle"
            required
          />

          <StructuredRadioGroup
            label="Is clearance adequate?"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ]}
            value={data.clearanceAdequate}
            onChange={(value) => updateField('clearanceAdequate', value)}
            required
          />

          {clearanceInadequate && (
            <CriticalWarning>
              INADEQUATE CLEARANCE = COLLISION RISK during fall arrest. Worker will strike ground/obstacle. Adjust anchor point or use shorter lanyard.
            </CriticalWarning>
          )}
        </div>
      )}

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="flex items-center space-x-2 text-red-400">
          <Heart className="w-5 h-5" />
          <span className="text-sm font-medium">Rescue Plan (OSHA requires rescue within 6 minutes)</span>
        </div>
        
        <AgentNote>
          OSHA 1926.502(d)(20): Rescue plan required within 6 minutes. "No rescue plan" was the emergency readiness gap in example analysis - GO/NO-GO factor for Agent 4.
        </AgentNote>

        <StructuredCheckboxGroup
          label="Rescue Plan"
          options={[
            { value: 'rescue-team-onsite', label: 'Rescue team on-site with descent equipment' },
            { value: 'fire-dept', label: 'Fire department notified' },
            { value: 'self-rescue', label: 'Self-rescue equipment available' },
            { value: 'no-plan', label: 'No rescue plan' }
          ]}
          selectedValues={data.rescuePlan}
          onChange={(value) => updateField('rescuePlan', value)}
          required
        />

        {data.rescuePlan.includes('fire-dept') && (
          <StructuredNumberField
            label="Fire Department ETA"
            value={data.rescueETA}
            onChange={(value) => updateField('rescueETA', value)}
            unit="minutes"
            placeholder="Expected arrival time"
            hint="Must be ≤6 minutes per OSHA"
            required
          />
        )}

        {noRescuePlan && (
          <CriticalWarning>
            NO RESCUE PLAN = SUSPENSION TRAUMA RISK (POTENTIALLY FATAL). OSHA violation. Establish rescue plan before work begins.
          </CriticalWarning>
        )}
      </div>

      <StructuredCheckboxGroup
        label="Rescue Equipment On-Site"
        options={[
          { value: 'descent-device', label: 'Descent/retrieval device' },
          { value: 'trauma-straps', label: 'Trauma straps (for suspension relief)' },
          { value: 'aed', label: 'AED (for cardiac arrest post-fall)' },
          { value: 'first-aid', label: 'First aid kit' },
          { value: 'none', label: 'None' }
        ]}
        selectedValues={data.rescueEquipment}
        onChange={(value) => updateField('rescueEquipment', value)}
        required
      />

      {noRescueEquipment && (
        <CriticalWarning>
          NO RESCUE EQUIPMENT = EMERGENCY READINESS FAILED. Cannot perform timely rescue if fall occurs.
        </CriticalWarning>
      )}

      <PhotoHints hints={[
        "Worker wearing harness (D-ring visible on back)",
        "Anchorage point (structural connection)",
        "Lanyard attached correctly",
        "Rescue equipment staged nearby",
        "Inspection tag on harness (date visible)"
      ]} />
    </div>
  );
}
