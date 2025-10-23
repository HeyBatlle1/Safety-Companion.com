import { Users, ShieldAlert } from 'lucide-react';
import { StructuredRadioGroup, StructuredNumberField, StructuredCheckboxGroup, PhotoHints, AgentNote, CriticalWarning } from './StructuredQuestionComponents';

export interface PublicExposureData {
  publicTraffic: string;
  barricadeDistance: string;
  protectionSystems: string[];
  barricadeStatus: string[];
  adjacentActivity: string[];
}

interface PublicExposureQuestionProps {
  data: PublicExposureData;
  onChange: (data: PublicExposureData) => void;
}

export function PublicExposureQuestion({ data, onChange }: PublicExposureQuestionProps) {
  const updateField = (field: keyof PublicExposureData, value: string | string[]) => {
    onChange({ ...data, [field]: value });
  };

  const showNoProtectionWarning = 
    data.publicTraffic !== 'none' && 
    data.protectionSystems.length === 0;
  
  const showBarricadeWarning = 
    data.barricadeStatus.includes('not-planned');

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center space-x-2 text-blue-400 font-semibold">
        <Users className="w-5 h-5" />
        <span>PUBLIC EXPOSURE & GROUND-LEVEL PROTECTION</span>
      </div>

      <AgentNote>
        This is the #1 gap from most JHAs. Agent 3 predicts struck-by incidents when this is inadequate.
      </AgentNote>

      <StructuredRadioGroup
        label="Public Traffic Below Work Area"
        options={[
          { value: 'high', label: 'High (sidewalk, main entrance, parking)' },
          { value: 'medium', label: 'Medium (occasional pedestrian traffic)' },
          { value: 'low', label: 'Low (restricted area, limited access)' },
          { value: 'none', label: 'None (isolated site, no public access)' }
        ]}
        value={data.publicTraffic}
        onChange={(value) => updateField('publicTraffic', value)}
        required
      />

      <StructuredNumberField
        label="Exclusion Zone - Barricade Distance"
        value={data.barricadeDistance}
        onChange={(value) => updateField('barricadeDistance', value)}
        unit="feet"
        placeholder="Distance from building"
        hint="Minimum: 1 foot per 10 feet of height (e.g., 60 ft high = 60 ft exclusion)"
        required
      />

      <StructuredCheckboxGroup
        label="Ground-Level Protection Systems"
        options={[
          { value: 'hard-barricades', label: 'Hard Barricades (fencing/concrete barriers)' },
          { value: 'soft-barricades', label: 'Caution Tape / Soft Barricades' },
          { value: 'safety-netting', label: 'Safety Netting (overhead protection)' },
          { value: 'spotter', label: 'Dedicated Spotter (person monitoring area)' },
          { value: 'none', label: 'None' }
        ]}
        selectedValues={data.protectionSystems}
        onChange={(value) => updateField('protectionSystems', value)}
        required
      />

      {showNoProtectionWarning && (
        <CriticalWarning>
          No ground-level protection with public exposure = AUTOMATIC NO-GO. Per OSHA 1926.760, falling object protection is REQUIRED when public exposure exists.
        </CriticalWarning>
      )}

      <StructuredCheckboxGroup
        label="Barricade Status"
        options={[
          { value: 'installed', label: 'Installed and secure' },
          { value: 'needs-installation', label: 'Needs installation (BEFORE work starts)' },
          { value: 'not-planned', label: 'Not planned' }
        ]}
        selectedValues={data.barricadeStatus}
        onChange={(value) => updateField('barricadeStatus', value)}
        required
      />

      {showBarricadeWarning && (
        <CriticalWarning>
          Barricade not planned. STOP - do not proceed. Install barricades BEFORE work begins.
        </CriticalWarning>
      )}

      <StructuredCheckboxGroup
        label="Adjacent Activity"
        options={[
          { value: 'construction', label: 'Active construction nearby' },
          { value: 'businesses', label: 'Operating businesses' },
          { value: 'residential', label: 'Residential area' },
          { value: 'unoccupied', label: 'Empty/unoccupied' }
        ]}
        selectedValues={data.adjacentActivity}
        onChange={(value) => updateField('adjacentActivity', value)}
      />

      <PhotoHints hints={[
        "Ground-level view showing public traffic",
        "Barricade setup (if installed)",
        "Fall zone perimeter",
        "Adjacent properties/activities",
        "Signage (warning signs, caution tape)"
      ]} />
    </div>
  );
}
