import { Home, AlertTriangle, Bell } from 'lucide-react';
import { StructuredCheckboxGroup, StructuredTextField, StructuredRadioGroup, PhotoHints, AgentNote } from './StructuredQuestionComponents';

export interface AdjacentPropertyData {
  adjacentProperties: string[];
  closestDistance: string;
  ownerNotification: string;
  notificationIncluded: string[];
  protectionMeasures: string[];
  vehicleProtection: string[];
  adjacentHazards: string[];
  coordination: string;
}

interface AdjacentPropertyQuestionProps {
  data: AdjacentPropertyData;
  onChange: (data: AdjacentPropertyData) => void;
}

export function AdjacentPropertyQuestion({ data, onChange }: AdjacentPropertyQuestionProps) {
  const updateField = (field: keyof AdjacentPropertyData, value: string | string[]) => {
    onChange({ ...data, [field]: value });
  };

  const noNotification = data.ownerNotification === 'no-notification';
  const noProtection = data.protectionMeasures.length === 0;
  const noVehicleProtection = data.vehicleProtection.length === 0;
  const uncoordinated = data.coordination === 'uncoordinated';
  
  const residential = data.adjacentProperties.includes('residential');
  const publicRightOfWay = data.adjacentProperties.includes('right-of-way');

  const distance = parseFloat(data.closestDistance);
  const veryClose = !isNaN(distance) && distance < 50;

  const communityRisk = residential && (noNotification || veryClose);
  const propertyDamageRisk = (noProtection || noVehicleProtection) && veryClose;

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center space-x-2 text-blue-400 font-semibold">
        <Home className="w-5 h-5" />
        <span>ADJACENT PROPERTY PROTECTION & NOTIFICATION</span>
      </div>

      <AgentNote>
        Residential property + inadequate notification = community complaints = work stoppage.
      </AgentNote>

      <StructuredCheckboxGroup
        label="Adjacent Properties (Within 100 Feet)"
        options={[
          { value: 'residential', label: 'Residential (occupied homes)' },
          { value: 'commercial', label: 'Commercial (operating businesses)' },
          { value: 'parking', label: 'Parking areas (vehicles present)' },
          { value: 'right-of-way', label: 'Public Right-of-Way (sidewalks, streets)' },
          { value: 'vacant', label: 'Vacant/Unoccupied' },
          { value: 'none', label: 'None (isolated site)' }
        ]}
        selectedValues={data.adjacentProperties}
        onChange={(value) => updateField('adjacentProperties', value)}
        required
      />

      <StructuredTextField
        label="Closest Property Distance"
        value={data.closestDistance}
        onChange={(value) => updateField('closestDistance', value)}
        placeholder="Feet from work area"
        required
      />

      {veryClose && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-yellow-100">
            VERY CLOSE PROXIMITY: Adjacent property &lt;50 ft from work. Requires extra protection measures and coordination.
          </span>
        </div>
      )}

      <StructuredRadioGroup
        label="Property Owner Notification"
        options={[
          { value: 'written', label: 'All adjacent owners notified in writing' },
          { value: 'verbal', label: 'Verbal notification only' },
          { value: 'no-notification', label: 'No notification' }
        ]}
        value={data.ownerNotification}
        onChange={(value) => updateField('ownerNotification', value)}
        required
      />

      {noNotification && residential && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
          <Bell className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-yellow-100">
            COMMUNITY RELATIONS RISK: Residential properties not notified. Unexpected noise/disruption = complaints = potential work stoppage. Notify property owners.
          </span>
        </div>
      )}

      <StructuredCheckboxGroup
        label="Notification Included"
        options={[
          { value: 'schedule', label: 'Work schedule (dates/times)' },
          { value: 'noise-warning', label: 'Noise/disruption warning' },
          { value: 'safety-measures', label: 'Safety measures in place' },
          { value: 'emergency-contact', label: 'Emergency contact info' }
        ]}
        selectedValues={data.notificationIncluded}
        onChange={(value) => updateField('notificationIncluded', value)}
      />

      <StructuredCheckboxGroup
        label="Protection Measures for Adjacent Property"
        options={[
          { value: 'extended-barricades', label: 'Extended barricades onto adjacent property (with permission)' },
          { value: 'safety-netting', label: 'Safety netting over adjacent property' },
          { value: 'plywood-tarps', label: 'Plywood/tarps protecting vehicles/structures' },
          { value: 'parking-restricted', label: 'Designated parking restricted during glass work' },
          { value: 'none', label: 'None' }
        ]}
        selectedValues={data.protectionMeasures}
        onChange={(value) => updateField('protectionMeasures', value)}
        required
      />

      {noProtection && veryClose && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-yellow-100">
            PROPERTY DAMAGE RISK: No protection measures for adjacent property &lt;50 ft away. Falling glass/tools could damage vehicles or structures.
          </span>
        </div>
      )}

      <StructuredCheckboxGroup
        label="Vehicle Protection"
        options={[
          { value: 'no-parking', label: 'No parking allowed in fall zone during work' },
          { value: 'moved', label: 'Vehicles moved to safe area' },
          { value: 'covered-protected', label: 'Covered parking structures protected' },
          { value: 'none', label: 'None' }
        ]}
        selectedValues={data.vehicleProtection}
        onChange={(value) => updateField('vehicleProtection', value)}
      />

      {noVehicleProtection && data.adjacentProperties.includes('parking') && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-yellow-100">
            VEHICLE DAMAGE RISK: Parking areas present but no vehicle protection. Falling objects could damage parked vehicles.
          </span>
        </div>
      )}

      <StructuredCheckboxGroup
        label="Adjacent Property Hazards TO Workers"
        options={[
          { value: 'power-lines', label: 'Power lines from adjacent building' },
          { value: 'trees', label: 'Overhanging trees/structures' },
          { value: 'hvac', label: 'HVAC exhaust/vents' },
          { value: 'none', label: 'None identified' }
        ]}
        selectedValues={data.adjacentHazards}
        onChange={(value) => updateField('adjacentHazards', value)}
      />

      <StructuredRadioGroup
        label="Coordination with Adjacent Activity"
        options={[
          { value: 'none-nearby', label: 'No other work happening nearby' },
          { value: 'coordinated', label: 'Coordinated with other contractors' },
          { value: 'uncoordinated', label: 'Uncoordinated' }
        ]}
        value={data.coordination}
        onChange={(value) => updateField('coordination', value)}
      />

      {uncoordinated && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-yellow-100">
            CONFLICT RISK: Other work happening nearby without coordination. Simultaneous operations = interference, safety conflicts.
          </span>
        </div>
      )}

      {communityRisk && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-100">
            <strong>COMMUNITY RELATIONS CONCERN:</strong> Residential properties nearby with inadequate notification or very close proximity. Consider improved communication and protection measures.
          </div>
        </div>
      )}

      {propertyDamageRisk && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-100">
            <strong>PROPERTY DAMAGE RISK:</strong> Close proximity without adequate protection measures. Implement barricades, netting, or vehicle restrictions.
          </div>
        </div>
      )}

      {publicRightOfWay && (
        <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-3 flex items-start space-x-2">
          <Bell className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-blue-100">
            PUBLIC RIGHT-OF-WAY: Sidewalks/streets present. Verify permits for public space use and ensure adequate barricades per municipal requirements.
          </span>
        </div>
      )}

      <PhotoHints hints={[
        "Adjacent properties (showing distance)",
        "Protection measures installed",
        "Notification letters (if available)",
        "Vehicle parking areas"
      ]} />
    </div>
  );
}
