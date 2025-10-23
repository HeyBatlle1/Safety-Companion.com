import { Construction, AlertTriangle, Users } from 'lucide-react';
import { StructuredCheckboxGroup, StructuredTextField, StructuredRadioGroup, PhotoHints, AgentNote, CriticalWarning } from './StructuredQuestionComponents';

export interface GroundProtectionData {
  workHeight: string;
  requiredExclusionZone: string;
  actualExclusionZone: string;
  exclusionAdequate: string;
  barricadeSystem: string[];
  barricadeStatus: string;
  overheadProtection: string[];
  spotterAssigned: string;
  spotterName: string;
  spotterPosition: string;
  spotterEquipment: string[];
  publicTrafficVolume: string;
  signage: string[];
  enforcement: string[];
  breachResponse: string[];
}

interface GroundProtectionQuestionProps {
  data: GroundProtectionData;
  onChange: (data: GroundProtectionData) => void;
}

export function GroundProtectionQuestion({ data, onChange }: GroundProtectionQuestionProps) {
  const updateField = (field: keyof GroundProtectionData, value: string | string[]) => {
    onChange({ ...data, [field]: value });
  };

  const noBarricades = data.barricadeSystem.includes('none');
  const barricadeNotInstalled = data.barricadeStatus === 'needs-installation' || data.barricadeStatus === 'not-planned';
  const noSpotter = data.spotterAssigned === 'no';
  const noSignage = data.signage.length === 0;
  const noEnforcement = data.enforcement.length === 0;
  const noBreachPlan = data.breachResponse.length === 0;
  
  const workHeight = parseFloat(data.workHeight);
  const requiredZone = parseFloat(data.requiredExclusionZone);
  const actualZone = parseFloat(data.actualExclusionZone);
  const zoneInadequate = !isNaN(requiredZone) && !isNaN(actualZone) && actualZone < requiredZone;
  
  const highTraffic = data.publicTrafficVolume === 'high';

  const criticalOSHAViolation = noBarricades || barricadeNotInstalled;
  const severeRisk = criticalOSHAViolation || (zoneInadequate && highTraffic) || (noSpotter && highTraffic);

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center space-x-2 text-red-400 font-semibold">
        <Construction className="w-5 h-5" />
        <span>GROUND-LEVEL PROTECTION SYSTEMS (CRITICAL!)</span>
      </div>

      <div className="bg-red-900/30 border border-red-600 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-100">
            <strong>THIS IS THE #1 MISSING CONTROL FROM JHAS!</strong> OSHA 1926.760(a) requires barriers to prevent entrance to fall zone. Missing ground-level protection = most pressing concern, constitutes severe OSHA violation.
          </div>
        </div>
      </div>

      <AgentNote>
        If this field says "Same" or "TBD" or "None", Agent 4 issues AUTOMATIC NO-GO decision. Agent 3 predicts: "Glass panel strikes ground-level worker" when this section is inadequate.
      </AgentNote>

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Public Fall Zone Assessment</div>
        
        <StructuredTextField
          label="Building/Work Height"
          value={data.workHeight}
          onChange={(value) => updateField('workHeight', value)}
          placeholder="Feet"
          required
        />

        <StructuredTextField
          label="Required Exclusion Zone"
          value={data.requiredExclusionZone}
          onChange={(value) => updateField('requiredExclusionZone', value)}
          placeholder="Feet"
          hint="Minimum: 1 ft per 10 ft height"
          required
        />

        <StructuredTextField
          label="Actual Exclusion Zone"
          value={data.actualExclusionZone}
          onChange={(value) => updateField('actualExclusionZone', value)}
          placeholder="Feet"
          required
        />

        <StructuredRadioGroup
          label="Is Exclusion Zone Adequate?"
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' }
          ]}
          value={data.exclusionAdequate}
          onChange={(value) => updateField('exclusionAdequate', value)}
          required
        />

        {(zoneInadequate || data.exclusionAdequate === 'no') && (
          <CriticalWarning>
            PUBLIC EXPOSURE RISK: Exclusion zone inadequate ({data.actualExclusionZone} ft &lt; {data.requiredExclusionZone} ft required). EXPAND FALL ZONE IMMEDIATELY.
          </CriticalWarning>
        )}
      </div>

      <StructuredCheckboxGroup
        label="Barricade System Installed"
        options={[
          { value: 'hard-barricades', label: 'Hard Barricades (concrete barriers, fencing)' },
          { value: 'caution-tape', label: 'Caution Tape (3-strand minimum)' },
          { value: 'cones-chains', label: 'Traffic Cones with chains' },
          { value: 'safety-netting', label: 'Safety Netting (overhead protection)' },
          { value: 'none', label: 'None' }
        ]}
        selectedValues={data.barricadeSystem}
        onChange={(value) => updateField('barricadeSystem', value)}
        required
      />

      {noBarricades && (
        <CriticalWarning>
          AUTOMATIC NO-GO - CRITICAL VIOLATION: No barricade system installed. OSHA 1926.760 MANDATES barriers to prevent fall zone entry. CANNOT PROCEED WITHOUT BARRICADES.
        </CriticalWarning>
      )}

      <StructuredRadioGroup
        label="Barricade Installation Status"
        options={[
          { value: 'installed', label: 'Installed and secure (before work starts)' },
          { value: 'needs-installation', label: 'Needs installation (work cannot start)' },
          { value: 'not-planned', label: 'Not planned' }
        ]}
        value={data.barricadeStatus}
        onChange={(value) => updateField('barricadeStatus', value)}
        required
      />

      {barricadeNotInstalled && (
        <CriticalWarning>
          STOP - BARRICADES REQUIRED: Work cannot start until barricades installed per OSHA 1926.760. Install barricades NOW before any overhead work begins.
        </CriticalWarning>
      )}

      <StructuredCheckboxGroup
        label="Overhead Protection Systems"
        options={[
          { value: 'safety-netting', label: 'Safety Netting installed' },
          { value: 'catch-platform', label: 'Catch Platform' },
          { value: 'canopy', label: 'Canopy/Awning' },
          { value: 'none', label: 'None (barricades must be larger)' }
        ]}
        selectedValues={data.overheadProtection}
        onChange={(value) => updateField('overheadProtection', value)}
      />

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300 flex items-center space-x-2">
          <Users className="w-4 h-4" />
          <span>Ground-Level Monitoring (Spotter)</span>
        </div>
        
        <StructuredRadioGroup
          label="Dedicated Spotter Assigned?"
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' }
          ]}
          value={data.spotterAssigned}
          onChange={(value) => updateField('spotterAssigned', value)}
          required
        />

        {noSpotter && (
          <CriticalWarning>
            NO ACTIVE DEFENSE: No dedicated spotter monitoring fall zone. Barricade breach will go unnoticed until struck-by incident occurs. ASSIGN SPOTTER.
          </CriticalWarning>
        )}

        {data.spotterAssigned === 'yes' && (
          <>
            <StructuredTextField
              label="Spotter Name"
              value={data.spotterName}
              onChange={(value) => updateField('spotterName', value)}
              placeholder="Full name"
              required
            />

            <StructuredTextField
              label="Spotter Position"
              value={data.spotterPosition}
              onChange={(value) => updateField('spotterPosition', value)}
              placeholder="e.g., Southeast corner, ground level"
              required
            />

            <StructuredCheckboxGroup
              label="Spotter Equipment"
              options={[
                { value: 'air-horn', label: 'Air horn' },
                { value: 'radio', label: 'Two-way radio' },
                { value: 'hi-vis', label: 'High-vis vest' }
              ]}
              selectedValues={data.spotterEquipment}
              onChange={(value) => updateField('spotterEquipment', value)}
            />
          </>
        )}
      </div>

      <StructuredRadioGroup
        label="Public Traffic Volume"
        options={[
          { value: 'high', label: 'High (sidewalk, main entrance, parking lot)' },
          { value: 'medium', label: 'Medium (occasional pedestrian traffic)' },
          { value: 'low', label: 'Low (restricted area, limited access)' },
          { value: 'none', label: 'None (isolated site, no public nearby)' }
        ]}
        value={data.publicTrafficVolume}
        onChange={(value) => updateField('publicTrafficVolume', value)}
        required
      />

      <StructuredCheckboxGroup
        label="Warning Signage Posted"
        options={[
          { value: 'overhead-work', label: '"DANGER - OVERHEAD WORK" signs posted' },
          { value: 'hard-hat', label: '"HARD HAT AREA" signs' },
          { value: 'authorized-only', label: '"AUTHORIZED PERSONNEL ONLY"' },
          { value: 'none', label: 'No signage' }
        ]}
        selectedValues={data.signage}
        onChange={(value) => updateField('signage', value)}
        required
      />

      {noSignage && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-yellow-100">
            PUBLIC UNAWARE OF HAZARD: No warning signage posted. Public entering fall zone unaware of overhead danger = liability.
          </span>
        </div>
      )}

      <StructuredCheckboxGroup
        label="Barricade Enforcement"
        options={[
          { value: 'security-guard', label: 'Security guard on-site' },
          { value: 'supervisor-monitoring', label: 'Supervisor actively monitoring' },
          { value: 'none', label: 'No enforcement' }
        ]}
        selectedValues={data.enforcement}
        onChange={(value) => updateField('enforcement', value)}
      />

      {noEnforcement && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-yellow-100">
            BARRICADE BREACH RISK: No active enforcement. Caution tape alone = frequently ignored by public.
          </span>
        </div>
      )}

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Breach Response Plan (If Someone Enters Fall Zone)</div>
        
        <StructuredCheckboxGroup
          label="Response Protocol"
          options={[
            { value: 'spotter-alarm', label: 'Spotter sounds alarm (air horn)' },
            { value: 'stop-work', label: 'All overhead work STOPS immediately' },
            { value: 'escort-out', label: 'Person is escorted out' },
            { value: 'no-plan', label: 'No plan' }
          ]}
          selectedValues={data.breachResponse}
          onChange={(value) => updateField('breachResponse', value)}
          required
        />

        {noBreachPlan && (
          <CriticalWarning>
            STRUCK-BY INCIDENT LIKELY: No breach response plan. When someone enters fall zone, crew won't know to stop work = active overhead hazard during breach.
          </CriticalWarning>
        )}
      </div>

      {severeRisk && (
        <CriticalWarning>
          SEVERE SAFETY VIOLATION: Multiple ground protection failures detected. This is the #1 missing control from JHAs and constitutes OSHA 1926.760 violation. ADDRESS ALL ISSUES BEFORE PROCEEDING.
        </CriticalWarning>
      )}

      <PhotoHints hints={[
        "Full perimeter barricade (aerial/ground view) - REQUIRED",
        "Barricade at each side of building - REQUIRED",
        "Fall zone marked on ground - REQUIRED",
        "Signage at entry points - REQUIRED",
        "Spotter position (where they stand) - REQUIRED",
        "Overhead netting (if installed)"
      ]} />
    </div>
  );
}
