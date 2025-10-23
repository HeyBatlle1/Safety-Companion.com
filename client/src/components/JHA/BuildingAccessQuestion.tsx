import { Crane, Zap } from 'lucide-react';
import { StructuredCheckboxGroup, StructuredTextField, StructuredNumberField, StructuredRadioGroup, PhotoHints, AgentNote, CriticalWarning } from './StructuredQuestionComponents';

export interface BuildingAccessData {
  accessMethod: string[];
  equipmentType: string;
  loadCapacity: string;
  actualLoad: string;
  safetyFactor: string;
  operatorCertification: string[];
  groundConditions: string[];
  powerLinesNearby: string;
  powerLineDistance: string;
}

interface BuildingAccessQuestionProps {
  data: BuildingAccessData;
  onChange: (data: BuildingAccessData) => void;
}

export function BuildingAccessQuestion({ data, onChange }: BuildingAccessQuestionProps) {
  const updateField = (field: keyof BuildingAccessData, value: string | string[]) => {
    onChange({ ...data, [field]: value });
  };

  const safetyFactorNum = parseFloat(data.safetyFactor);
  const showSafetyFactorWarning = !isNaN(safetyFactorNum) && safetyFactorNum < 4;
  const showNoCertWarning = data.operatorCertification.includes('not-certified');

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center space-x-2 text-blue-400 font-semibold">
        <Crane className="w-5 h-5" />
        <span>BUILDING ACCESS & LIFTING EQUIPMENT</span>
      </div>

      <AgentNote>
        Overloaded crane or untrained operator = AUTOMATIC NO-GO
      </AgentNote>

      <StructuredCheckboxGroup
        label="Building Access Method"
        options={[
          { value: 'tower-crane', label: 'Tower Crane (external)' },
          { value: 'mobile-crane', label: 'Mobile Crane (ground-based)' },
          { value: 'boom-lift', label: 'Boom Lift / Aerial Lift' },
          { value: 'swing-stage', label: 'Swing Stage / Suspended Platform' },
          { value: 'scaffolding', label: 'Scaffolding + Manual Handling' },
          { value: 'interior', label: 'Interior Access (no external equipment)' }
        ]}
        selectedValues={data.accessMethod}
        onChange={(value) => updateField('accessMethod', value)}
        required
      />

      {!data.accessMethod.includes('interior') && !data.accessMethod.includes('scaffolding') && (
        <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
          <div className="text-sm font-medium text-gray-300">Crane/Equipment Details</div>
          
          <StructuredTextField
            label="Type/Model"
            value={data.equipmentType}
            onChange={(value) => updateField('equipmentType', value)}
            placeholder="e.g., Liebherr 630 EC-H"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <StructuredNumberField
              label="Load Capacity (rated)"
              value={data.loadCapacity}
              onChange={(value) => updateField('loadCapacity', value)}
              unit="lbs"
              placeholder="Rated capacity"
              required
            />
            <StructuredNumberField
              label="Actual Load"
              value={data.actualLoad}
              onChange={(value) => updateField('actualLoad', value)}
              unit="lbs"
              placeholder="Glass + rigging"
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
              Safety factor {safetyFactorNum.toFixed(1)}:1 is below minimum 4:1 requirement. DO NOT PROCEED until load is reduced or crane capacity is increased.
            </CriticalWarning>
          )}
        </div>
      )}

      {!data.accessMethod.includes('interior') && !data.accessMethod.includes('scaffolding') && (
        <>
          <StructuredCheckboxGroup
            label="Operator Certification"
            options={[
              { value: 'nccco', label: 'NCCCO Certified (attach cert photo)' },
              { value: 'manufacturer', label: 'Manufacturer Trained' },
              { value: 'not-certified', label: 'Not Certified' }
            ]}
            selectedValues={data.operatorCertification}
            onChange={(value) => updateField('operatorCertification', value)}
            required
          />

          {showNoCertWarning && (
            <CriticalWarning>
              Operator is not certified. STOP - do not proceed. OSHA 1926.1427 requires certified crane operators.
            </CriticalWarning>
          )}

          <StructuredCheckboxGroup
            label="Ground Conditions"
            options={[
              { value: 'concrete', label: 'Concrete (stable)' },
              { value: 'asphalt', label: 'Asphalt (stable)' },
              { value: 'gravel', label: 'Gravel/Compacted Soil (verify stability)' },
              { value: 'soft', label: 'Soft Ground (requires mats/stabilization)' }
            ]}
            selectedValues={data.groundConditions}
            onChange={(value) => updateField('groundConditions', value)}
            required
          />

          <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
            <div className="flex items-center space-x-2 text-yellow-400">
              <Zap className="w-4 h-4" />
              <div className="text-sm font-medium">Overhead Clearances</div>
            </div>
            
            <StructuredRadioGroup
              label="Power Lines within 50 feet?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={data.powerLinesNearby}
              onChange={(value) => updateField('powerLinesNearby', value)}
              required
            />

            {data.powerLinesNearby === 'yes' && (
              <>
                <StructuredNumberField
                  label="Distance to Power Lines"
                  value={data.powerLineDistance}
                  onChange={(value) => updateField('powerLineDistance', value)}
                  unit="feet"
                  placeholder="Minimum 10 ft required"
                  required
                />
                {parseFloat(data.powerLineDistance) < 10 && data.powerLineDistance && (
                  <CriticalWarning>
                    Power line clearance {data.powerLineDistance} ft is below OSHA minimum 10 ft. STOP - contact utility company for de-energization or increased clearance.
                  </CriticalWarning>
                )}
              </>
            )}
          </div>

          <PhotoHints hints={[
            "Crane setup (full view)",
            "Operator certification card",
            "Ground conditions under crane",
            "Overhead clearance (power lines if present)",
            "Load chart on crane"
          ]} />
        </>
      )}
    </div>
  );
}
