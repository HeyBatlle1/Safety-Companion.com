import { MapPin, Building, Hospital } from 'lucide-react';
import { StructuredNumberField, StructuredTextField, PhotoHints, AgentNote } from './StructuredQuestionComponents';

export interface ProjectLocationData {
  location: string;
  buildingHeight: string;
  workHeight: string;
  fallDistance: string;
  nearestHospital: string;
}

interface ProjectLocationQuestionProps {
  data: ProjectLocationData;
  onChange: (data: ProjectLocationData) => void;
}

export function ProjectLocationQuestion({ data, onChange }: ProjectLocationQuestionProps) {
  const updateField = (field: keyof ProjectLocationData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center space-x-2 text-blue-400 font-semibold">
        <MapPin className="w-5 h-5" />
        <span>PROJECT LOCATION & BUILDING DETAILS</span>
      </div>

      <AgentNote>
        Specific measurements are critical for risk calculations
      </AgentNote>

      <StructuredTextField
        label="Location (City, State)"
        value={data.location}
        onChange={(value) => updateField('location', value)}
        placeholder="Indianapolis, IN"
        icon={<MapPin className="w-4 h-4" />}
        required
      />

      <StructuredNumberField
        label="Building Height"
        value={data.buildingHeight}
        onChange={(value) => updateField('buildingHeight', value)}
        unit="feet"
        placeholder="Total building height"
        required
      />

      <StructuredNumberField
        label="Work Height Today"
        value={data.workHeight}
        onChange={(value) => updateField('workHeight', value)}
        unit="feet"
        placeholder="Height where work will be performed"
        required
      />

      <StructuredNumberField
        label="Fall Distance"
        value={data.fallDistance}
        onChange={(value) => updateField('fallDistance', value)}
        unit="feet"
        placeholder="Straight drop to ground level"
        required
      />

      <StructuredTextField
        label="Nearest Hospital"
        value={data.nearestHospital}
        onChange={(value) => updateField('nearestHospital', value)}
        placeholder="IU Health Methodist - 2.3 miles"
        icon={<Hospital className="w-4 h-4" />}
        required
        hint="Name + distance for emergency response planning"
      />

      <PhotoHints hints={[
        "Building exterior showing full height",
        "Work area from ground level (shows scale)",
        "Site plan or blueprint",
        "Street view showing access routes"
      ]} />
    </div>
  );
}
