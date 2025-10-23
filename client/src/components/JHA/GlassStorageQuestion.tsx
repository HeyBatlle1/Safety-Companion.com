import { Package, AlertTriangle } from 'lucide-react';
import { StructuredCheckboxGroup, StructuredNumberField, StructuredRadioGroup, PhotoHints, AgentNote, CriticalWarning } from './StructuredQuestionComponents';

export interface GlassStorageData {
  distanceFromBuilding: string;
  distanceFromEdge: string;
  groundConditions: string[];
  fallProtection: string[];
  rackSystem: string[];
  rackCapacity: string;
  currentLoad: string;
  environmentalProtection: string[];
  securityAccess: string[];
  windProtected: string;
  maxWindBeforeMoving: string;
}

interface GlassStorageQuestionProps {
  data: GlassStorageData;
  onChange: (data: GlassStorageData) => void;
}

export function GlassStorageQuestion({ data, onChange }: GlassStorageQuestionProps) {
  const updateField = (field: keyof GlassStorageData, value: string | string[]) => {
    onChange({ ...data, [field]: value });
  };

  const edgeDistance = parseFloat(data.distanceFromEdge);
  const nearEdge = !isNaN(edgeDistance) && edgeDistance < 6;
  const noFallProtection = data.fallProtection.includes('none');
  const tippingRisk = data.rackSystem.includes('leaning-against');
  const noEnvironmentalProtection = data.environmentalProtection.includes('none');
  const publicAccess = data.securityAccess.includes('open-area');
  const notWindProtected = data.windProtected === 'no';
  
  const rackCapacity = parseFloat(data.rackCapacity);
  const currentLoad = parseFloat(data.currentLoad);
  const overloaded = !isNaN(rackCapacity) && !isNaN(currentLoad) && currentLoad > rackCapacity;

  const criticalCombo = tippingRisk && (data.rackSystem.length === 1 || !data.rackSystem.some(s => s !== 'leaning-against'));

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center space-x-2 text-blue-400 font-semibold">
        <Package className="w-5 h-5" />
        <span>GLASS STORAGE LOCATION & PROTECTION</span>
      </div>

      <AgentNote>
        Glass tipping from rack = struck-by incident. Agent 3 looks for "leaning" + "no securing" combination.
      </AgentNote>

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Storage Area Location</div>
        
        <StructuredNumberField
          label="Distance from Building"
          value={data.distanceFromBuilding}
          onChange={(value) => updateField('distanceFromBuilding', value)}
          unit="feet"
          placeholder="Distance in feet"
          required
        />

        <StructuredNumberField
          label="Distance from Edge/Excavation"
          value={data.distanceFromEdge}
          onChange={(value) => updateField('distanceFromEdge', value)}
          unit="feet"
          placeholder="Minimum 6 ft required"
          hint="OSHA requires minimum 6 ft from unprotected edges"
          required
        />

        {nearEdge && (
          <CriticalWarning>
            Storage area is {data.distanceFromEdge} ft from edge - LESS THAN 6 FT MINIMUM. Move storage or install guardrails.
          </CriticalWarning>
        )}

        <StructuredCheckboxGroup
          label="Ground Conditions"
          options={[
            { value: 'level-stable', label: 'Level/stable' },
            { value: 'sloped', label: 'Sloped' },
            { value: 'soft-unstable', label: 'Soft/unstable' }
          ]}
          selectedValues={data.groundConditions}
          onChange={(value) => updateField('groundConditions', value)}
          required
        />
      </div>

      <StructuredCheckboxGroup
        label="Fall Protection Around Storage"
        options={[
          { value: 'guardrails', label: 'Guardrails (if near edge >6 ft)' },
          { value: 'barricades', label: 'Barricades/caution tape' },
          { value: 'no-edge', label: 'No edge nearby (storage in safe area)' },
          { value: 'none', label: 'None' }
        ]}
        selectedValues={data.fallProtection}
        onChange={(value) => updateField('fallProtection', value)}
        required
      />

      {nearEdge && noFallProtection && (
        <CriticalWarning>
          Storage near edge ({data.distanceFromEdge} ft) with NO FALL PROTECTION = HIGH RISK. Install guardrails immediately.
        </CriticalWarning>
      )}

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Glass Rack/Support System</div>
        
        <StructuredCheckboxGroup
          label="Rack Type"
          options={[
            { value: 'a-frame', label: 'A-frame racks (angled, stable)' },
            { value: 'vertical', label: 'Vertical racks (secure)' },
            { value: 'laid-flat', label: 'Laid flat (on padding)' },
            { value: 'leaning-against', label: 'Leaning against structure' }
          ]}
          selectedValues={data.rackSystem}
          onChange={(value) => updateField('rackSystem', value)}
          required
        />

        {tippingRisk && (
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-yellow-100">
              TIPPING RISK: Glass leaning against structure without proper securing = high struck-by hazard
            </span>
          </div>
        )}

        {criticalCombo && (
          <CriticalWarning>
            CRITICAL: Leaning glass with no other rack system = IMMEDIATE TIPPING HAZARD. Use A-frame or vertical racks.
          </CriticalWarning>
        )}

        <div className="grid grid-cols-2 gap-4">
          <StructuredNumberField
            label="Rack Capacity"
            value={data.rackCapacity}
            onChange={(value) => updateField('rackCapacity', value)}
            unit="lbs"
            placeholder="Rated capacity"
            required
          />
          <StructuredNumberField
            label="Current Load"
            value={data.currentLoad}
            onChange={(value) => updateField('currentLoad', value)}
            unit="lbs"
            placeholder="Actual weight"
            required
          />
        </div>

        {overloaded && (
          <CriticalWarning>
            RACK OVERLOADED: Current load {currentLoad} lbs exceeds capacity {rackCapacity} lbs. Reduce load immediately.
          </CriticalWarning>
        )}
      </div>

      <StructuredCheckboxGroup
        label="Environmental Protection"
        options={[
          { value: 'covered-tarped', label: 'Covered/tarped (protects from rain)' },
          { value: 'shaded', label: 'Shaded (prevents thermal stress)' },
          { value: 'secured-wind', label: 'Secured against wind' },
          { value: 'none', label: 'None' }
        ]}
        selectedValues={data.environmentalProtection}
        onChange={(value) => updateField('environmentalProtection', value)}
        required
      />

      {noEnvironmentalProtection && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-yellow-100">
            DAMAGE RISK: No environmental protection. Glass exposed to rain/thermal stress/wind.
          </span>
        </div>
      )}

      <StructuredCheckboxGroup
        label="Security/Access Control"
        options={[
          { value: 'fenced', label: 'Fenced/restricted area' },
          { value: 'signage', label: 'Signage ("Authorized Personnel Only")' },
          { value: 'open-area', label: 'Open area' }
        ]}
        selectedValues={data.securityAccess}
        onChange={(value) => updateField('securityAccess', value)}
        required
      />

      {publicAccess && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-yellow-100">
            PUBLIC ACCESS RISK: Open area allows unauthorized access. Consider fencing or signage.
          </span>
        </div>
      )}

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Wind Protection</div>
        
        <StructuredRadioGroup
          label="Is storage area protected from wind?"
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' }
          ]}
          selectedValue={data.windProtected}
          onChange={(value) => updateField('windProtected', value)}
          required
        />

        {notWindProtected && (
          <StructuredNumberField
            label="Maximum wind before moving glass indoors"
            value={data.maxWindBeforeMoving}
            onChange={(value) => updateField('maxWindBeforeMoving', value)}
            unit="mph"
            placeholder="Wind speed threshold"
            hint="Typical threshold: 20-25 mph"
            required
          />
        )}
      </div>

      <PhotoHints hints={[
        "Storage area overview (full setup)",
        "Glass racks (A-frame or vertical)",
        "Distance from edge (if applicable)",
        "Environmental protection (tarps, covers)",
        "Security measures (fencing, signage)"
      ]} />
    </div>
  );
}
