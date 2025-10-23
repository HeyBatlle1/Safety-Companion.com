import { Ambulance, AlertTriangle, Heart } from 'lucide-react';
import { StructuredCheckboxGroup, StructuredTextField, StructuredRadioGroup, PhotoHints, AgentNote, CriticalWarning } from './StructuredQuestionComponents';

export interface EmergencyEquipmentData {
  medicalEquipment: string[];
  firstAidLocation: string;
  aedLocation: string;
  rescueEquipmentLocation: string;
  equipmentInspection: string[];
  aedPadExpiration: string;
  fallRescueEquipment: string[];
  crewTraining: string[];
  fallRescueTime: string;
  emsArrival: string;
  helicopterAvailable: string;
  traumaCenter: string;
  traumaCenterTime: string;
}

interface EmergencyEquipmentQuestionProps {
  data: EmergencyEquipmentData;
  onChange: (data: EmergencyEquipmentData) => void;
}

export function EmergencyEquipmentQuestion({ data, onChange }: EmergencyEquipmentQuestionProps) {
  const updateField = (field: keyof EmergencyEquipmentData, value: string | string[]) => {
    onChange({ ...data, [field]: value });
  };

  const notInspected = data.equipmentInspection.includes('not-inspected');
  const noFallRescue = data.fallRescueEquipment.includes('none');
  const noTraining = data.crewTraining.includes('no-training');
  const noAED = !data.medicalEquipment.includes('aed');
  
  const fallRescueTime = parseFloat(data.fallRescueTime);
  const rescueTooSlow = !isNaN(fallRescueTime) && fallRescueTime > 6;

  const criticalReadinessFailure = (noFallRescue || noTraining || rescueTooSlow);

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center space-x-2 text-blue-400 font-semibold">
        <Ambulance className="w-5 h-5" />
        <span>EMERGENCY RESPONSE EQUIPMENT & READINESS</span>
      </div>

      <AgentNote>
        "No AED" + "electrical work nearby" = Agent 4 flags emergency readiness as FAILED → NO-GO decision.
      </AgentNote>

      <StructuredCheckboxGroup
        label="First Aid/Medical Equipment"
        options={[
          { value: 'first-aid', label: 'First Aid Kit (OSHA 1910.151 compliant)' },
          { value: 'aed', label: 'AED (Automated External Defibrillator)' },
          { value: 'trauma-kit', label: 'Trauma Kit (for serious injuries)' },
          { value: 'oxygen', label: 'Oxygen (if available)' },
          { value: 'eye-wash', label: 'Eye Wash Station (for chemical exposure)' }
        ]}
        selectedValues={data.medicalEquipment}
        onChange={(value) => updateField('medicalEquipment', value)}
        required
      />

      {noAED && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
          <Heart className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-yellow-100">
            NO AED AVAILABLE: For electrical work or cardiac risk environments, AED significantly improves survival rates. Consider obtaining one.
          </span>
        </div>
      )}

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Equipment Locations</div>
        
        <StructuredTextField
          label="First Aid Kit Location"
          value={data.firstAidLocation}
          onChange={(value) => updateField('firstAidLocation', value)}
          placeholder="e.g., Ground level, blue box near entrance"
          hint="Specific location visible to all crew"
          required
        />

        <StructuredTextField
          label="AED Location"
          value={data.aedLocation}
          onChange={(value) => updateField('aedLocation', value)}
          placeholder="e.g., Supervisor truck, main office"
          hint="Must be within 3-minute travel time"
        />

        <StructuredTextField
          label="Rescue Equipment Location"
          value={data.rescueEquipmentLocation}
          onChange={(value) => updateField('rescueEquipmentLocation', value)}
          placeholder="e.g., Ground level staging area"
        />
      </div>

      <StructuredCheckboxGroup
        label="Equipment Inspection Status"
        options={[
          { value: 'inspected', label: 'All equipment inspected before shift' },
          { value: 'fully-stocked', label: 'First aid kit fully stocked' },
          { value: 'aed-current', label: 'AED pads not expired' },
          { value: 'not-inspected', label: 'Not inspected' }
        ]}
        selectedValues={data.equipmentInspection}
        onChange={(value) => updateField('equipmentInspection', value)}
        required
      />

      {notInspected && (
        <CriticalWarning>
          READINESS CONCERN: Emergency equipment not inspected. Expired AED pads or depleted supplies = equipment failure during crisis. INSPECT NOW.
        </CriticalWarning>
      )}

      {data.medicalEquipment.includes('aed') && (
        <StructuredTextField
          label="AED Pad Expiration Date"
          value={data.aedPadExpiration}
          onChange={(value) => updateField('aedPadExpiration', value)}
          placeholder="MM/DD/YYYY"
          hint="Check expiration date on AED pad packaging"
        />
      )}

      <StructuredCheckboxGroup
        label="Fall Rescue Equipment (if working >6 ft)"
        options={[
          { value: 'descent-device', label: 'Descent Device (for lowering fallen worker)' },
          { value: 'retrieval-system', label: 'Retrieval System (mechanical advantage)' },
          { value: 'trauma-straps', label: 'Trauma Straps (suspension relief)' },
          { value: 'none', label: 'None' }
        ]}
        selectedValues={data.fallRescueEquipment}
        onChange={(value) => updateField('fallRescueEquipment', value)}
        required
      />

      {noFallRescue && (
        <CriticalWarning>
          OSHA VIOLATION: No fall rescue equipment for work above 6 ft. OSHA requires rescue within 6 minutes to prevent suspension trauma death. OBTAIN RESCUE EQUIPMENT IMMEDIATELY.
        </CriticalWarning>
      )}

      <StructuredCheckboxGroup
        label="Crew Training on Equipment"
        options={[
          { value: 'first-aid-cpr', label: 'All crew First Aid/CPR certified' },
          { value: 'aed-trained', label: 'Designated person trained on AED' },
          { value: 'rescue-trained', label: 'Rescue team trained on descent device' },
          { value: 'no-training', label: 'No training' }
        ]}
        selectedValues={data.crewTraining}
        onChange={(value) => updateField('crewTraining', value)}
        required
      />

      {noTraining && (
        <CriticalWarning>
          EQUIPMENT WON'T BE USED EFFECTIVELY: No crew training on emergency equipment. In crisis, untrained personnel cannot operate AED/rescue devices. TRAIN CREW BEFORE WORK.
        </CriticalWarning>
      )}

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Emergency Response Time Estimates</div>
        
        <StructuredTextField
          label="Fall Rescue Time (on-site team)"
          value={data.fallRescueTime}
          onChange={(value) => updateField('fallRescueTime', value)}
          placeholder="Minutes"
          hint="Maximum 6 minutes allowed per OSHA"
          required
        />

        {rescueTooSlow && (
          <CriticalWarning>
            RESCUE TIME EXCEEDS OSHA LIMIT: {data.fallRescueTime} minutes &gt; 6 minutes maximum. Suspension trauma causes death within 30 minutes. REDUCE RESCUE TIME OR DO NOT PROCEED.
          </CriticalWarning>
        )}

        <StructuredTextField
          label="EMS Arrival Time"
          value={data.emsArrival}
          onChange={(value) => updateField('emsArrival', value)}
          placeholder="Minutes"
          hint="Estimated time for ambulance arrival"
        />

        <StructuredRadioGroup
          label="Helicopter Medevac Available"
          options={[
            { value: 'yes', label: 'Available' },
            { value: 'no', label: 'Not available' }
          ]}
          selectedValue={data.helicopterAvailable}
          onChange={(value) => updateField('helicopterAvailable', value)}
        />

        <StructuredTextField
          label="Nearest Trauma Center"
          value={data.traumaCenter}
          onChange={(value) => updateField('traumaCenter', value)}
          placeholder="Hospital name and address"
          required
        />

        <StructuredTextField
          label="Trauma Center Drive Time"
          value={data.traumaCenterTime}
          onChange={(value) => updateField('traumaCenterTime', value)}
          placeholder="Minutes"
        />
      </div>

      <div className="bg-red-900/30 border border-red-600 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-100">
            <strong>CRITICAL:</strong> Fall arrest without rescue = suspension trauma → death in 30 minutes. OSHA requires rescue within 6 minutes.
          </div>
        </div>
      </div>

      {criticalReadinessFailure && (
        <CriticalWarning>
          EMERGENCY READINESS FAILURE: No fall rescue equipment, no training, or rescue time exceeds OSHA limits. IMMEDIATE CORRECTIVE ACTION REQUIRED.
        </CriticalWarning>
      )}

      <PhotoHints hints={[
        "First aid kit (open, showing contents)",
        "AED (with expiration date visible on pads)",
        "Rescue equipment staged nearby",
        "Equipment location signage"
      ]} />
    </div>
  );
}
