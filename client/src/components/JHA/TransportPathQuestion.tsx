import { MapPin, Users, AlertTriangle } from 'lucide-react';
import { StructuredCheckboxGroup, StructuredNumberField, StructuredTextField, PhotoHints, AgentNote, CriticalWarning } from './StructuredQuestionComponents';

export interface TransportPathData {
  transportMethod: string[];
  manualCarryCrewSize: string;
  horizontalDistance: string;
  verticalDistance: string;
  tripTime: string;
  pathHazards: string[];
  stairsCount: string;
  rampSlope: string;
  doorwayWidth: string;
  overheadClearance: string;
  unevenDescription: string;
  tripHazards: string[];
  hazardMitigation: string[];
  trafficConflicts: string[];
  trafficControl: string[];
}

interface TransportPathQuestionProps {
  data: TransportPathData;
  onChange: (data: TransportPathData) => void;
}

export function TransportPathQuestion({ data, onChange }: TransportPathQuestionProps) {
  const updateField = (field: keyof TransportPathData, value: string | string[]) => {
    onChange({ ...data, [field]: value });
  };

  const manualCarry = data.transportMethod.includes('manual-carry');
  const hasHazards = data.pathHazards.length > 1 || !data.pathHazards.includes('level-clear');
  const tripRisks = data.tripHazards.length > 1 || !data.tripHazards.includes('none');
  const noMitigation = data.hazardMitigation.includes('none');
  const noTrafficControl = data.trafficControl.includes('none');
  const sharedWithTraffic = data.trafficConflicts.includes('shared-trades') || 
                            data.trafficConflicts.includes('vehicle-traffic') ||
                            data.trafficConflicts.includes('pedestrian-traffic');

  const horizontalDist = parseFloat(data.horizontalDistance);
  const longDistance = !isNaN(horizontalDist) && horizontalDist > 50;

  // Critical combo: ANY trip hazards with no mitigation, regardless of distance
  const criticalCombo = tripRisks && noMitigation;
  const trafficRisk = sharedWithTraffic && noTrafficControl;

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center space-x-2 text-blue-400 font-semibold">
        <MapPin className="w-5 h-5" />
        <span>GLASS TRANSPORT ROUTE & HAZARDS</span>
      </div>

      <AgentNote>
        Manual carry = high fatigue + trip risk. Agent 3 predicts "dropped glass" incidents when transport distance &gt;50 ft with no rest points.
      </AgentNote>

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Transport Method</div>
        
        <StructuredCheckboxGroup
          label="How will glass be transported?"
          options={[
            { value: 'crane-lift', label: 'Crane lift (glass never manually carried)' },
            { value: 'manual-carry', label: 'Manual carry by crew' },
            { value: 'cart-dolly', label: 'Cart/dolly' },
            { value: 'combination', label: 'Combination' }
          ]}
          selectedValues={data.transportMethod}
          onChange={(value) => updateField('transportMethod', value)}
          required
        />

        {manualCarry && (
          <>
            <StructuredNumberField
              label="Number of People for Manual Carry"
              value={data.manualCarryCrewSize}
              onChange={(value) => updateField('manualCarryCrewSize', value)}
              unit="people"
              placeholder="Crew size"
              required
            />
            <div className="text-xs text-gray-400 flex items-start space-x-2">
              <Users className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Minimum 2 people recommended for safe glass handling</span>
            </div>
          </>
        )}

        {data.transportMethod.includes('combination') && (
          <StructuredTextField
            label="Describe Combination Method"
            value={data.unevenDescription}
            onChange={(value) => updateField('unevenDescription', value)}
            placeholder="e.g., Crane to ground level, then manual carry to final position"
          />
        )}
      </div>

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Transport Distance & Time</div>
        
        <div className="grid grid-cols-2 gap-4">
          <StructuredNumberField
            label="Horizontal Distance"
            value={data.horizontalDistance}
            onChange={(value) => updateField('horizontalDistance', value)}
            unit="feet"
            placeholder="Distance"
            required
          />
          <StructuredNumberField
            label="Vertical Distance"
            value={data.verticalDistance}
            onChange={(value) => updateField('verticalDistance', value)}
            unit="feet"
            placeholder="Stairs/ramps/lifts"
            hint="Includes stairs, ramps, lifts"
          />
        </div>

        <StructuredNumberField
          label="Total Time Per Trip"
          value={data.tripTime}
          onChange={(value) => updateField('tripTime', value)}
          unit="minutes"
          placeholder="Estimated time"
        />

        {longDistance && manualCarry && (
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-yellow-100">
              LONG MANUAL CARRY: {data.horizontalDistance} ft is high-fatigue distance. Consider rest points or mechanical assistance.
            </span>
          </div>
        )}
      </div>

      <StructuredCheckboxGroup
        label="Transport Path Hazards"
        options={[
          { value: 'level-clear', label: 'Level, clear path' },
          { value: 'stairs', label: 'Stairs/steps' },
          { value: 'ramps', label: 'Ramps' },
          { value: 'doorways', label: 'Doorways/narrow passages' },
          { value: 'overhead', label: 'Overhead obstacles' },
          { value: 'uneven', label: 'Uneven surface' }
        ]}
        selectedValues={data.pathHazards}
        onChange={(value) => updateField('pathHazards', value)}
        required
      />

      {data.pathHazards.includes('stairs') && (
        <StructuredNumberField
          label="Number of Stairs/Steps"
          value={data.stairsCount}
          onChange={(value) => updateField('stairsCount', value)}
          unit="steps"
          placeholder="Count"
          required
        />
      )}

      {data.pathHazards.includes('ramps') && (
        <StructuredNumberField
          label="Ramp Slope"
          value={data.rampSlope}
          onChange={(value) => updateField('rampSlope', value)}
          unit="degrees"
          placeholder="Angle"
          hint="OSHA max: 1:12 ratio (~4.8 degrees)"
          required
        />
      )}

      {data.pathHazards.includes('doorways') && (
        <StructuredNumberField
          label="Doorway/Passage Width"
          value={data.doorwayWidth}
          onChange={(value) => updateField('doorwayWidth', value)}
          unit="inches"
          placeholder="Width"
          required
        />
      )}

      {data.pathHazards.includes('overhead') && (
        <StructuredNumberField
          label="Overhead Clearance"
          value={data.overheadClearance}
          onChange={(value) => updateField('overheadClearance', value)}
          unit="feet"
          placeholder="Height"
          required
        />
      )}

      {data.pathHazards.includes('uneven') && (
        <StructuredTextField
          label="Describe Uneven Surface"
          value={data.unevenDescription}
          onChange={(value) => updateField('unevenDescription', value)}
          placeholder="e.g., Gravel, cracked concrete, dirt with ruts"
          required
        />
      )}

      <StructuredCheckboxGroup
        label="Trip/Slip Hazards on Path"
        options={[
          { value: 'none', label: 'None identified' },
          { value: 'cables-hoses', label: 'Cables/hoses crossing path' },
          { value: 'debris', label: 'Debris/materials on ground' },
          { value: 'wet-slippery', label: 'Wet/slippery areas' },
          { value: 'poor-lighting', label: 'Poor lighting' },
          { value: 'other', label: 'Other' }
        ]}
        selectedValues={data.tripHazards}
        onChange={(value) => updateField('tripHazards', value)}
        required
      />

      <StructuredCheckboxGroup
        label="Hazard Mitigation"
        options={[
          { value: 'path-cleared', label: 'Path cleared before each transport' },
          { value: 'cables-secured', label: 'Cables secured/marked' },
          { value: 'lighting-added', label: 'Lighting added' },
          { value: 'non-slip-mats', label: 'Non-slip mats placed' },
          { value: 'none', label: 'None' }
        ]}
        selectedValues={data.hazardMitigation}
        onChange={(value) => updateField('hazardMitigation', value)}
        required
      />

      {criticalCombo && (
        <CriticalWarning>
          CRITICAL: Trip hazards identified with NO MITIGATION = HIGH RISK for incidents. Clear and secure path before glass transport.
        </CriticalWarning>
      )}

      {manualCarry && longDistance && tripRisks && !noMitigation && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-yellow-100">
            HIGH FATIGUE RISK: Manual carry + long distance ({data.horizontalDistance} ft) + trip hazards. Monitor crew closely for fatigue.
          </span>
        </div>
      )}

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Traffic Conflicts & Control</div>
        
        <StructuredCheckboxGroup
          label="Traffic Conflicts"
          options={[
            { value: 'dedicated', label: 'Dedicated path (no other activity)' },
            { value: 'shared-trades', label: 'Shared with other trades' },
            { value: 'vehicle-traffic', label: 'Active vehicle traffic nearby' },
            { value: 'pedestrian-traffic', label: 'Public pedestrian traffic' }
          ]}
          selectedValues={data.trafficConflicts}
          onChange={(value) => updateField('trafficConflicts', value)}
          required
        />

        <StructuredCheckboxGroup
          label="Traffic Control Measures"
          options={[
            { value: 'spotter', label: 'Spotter/escort with crew' },
            { value: 'barriers', label: 'Barriers/cones marking path' },
            { value: 'radio', label: 'Radio communication with other trades' },
            { value: 'none', label: 'None' }
          ]}
          selectedValues={data.trafficControl}
          onChange={(value) => updateField('trafficControl', value)}
          required
        />

        {trafficRisk && (
          <CriticalWarning>
            COLLISION RISK: Shared path with traffic but NO TRAFFIC CONTROL. Add spotter or barriers.
          </CriticalWarning>
        )}
      </div>

      <PhotoHints hints={[
        "Transport path (full route)",
        "Any obstacles (stairs, doors, tight spots)",
        "Trip hazards identified",
        "Traffic areas (where other activity occurs)"
      ]} />
    </div>
  );
}
