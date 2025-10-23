import { Square, Weight } from 'lucide-react';
import { StructuredNumberField, StructuredCheckboxGroup, PhotoHints, AgentNote } from './StructuredQuestionComponents';

export interface GlassInstallationData {
  installationMethod: string[];
  panelWidth: string;
  panelHeight: string;
  panelThickness: string;
  panelWeight: string;
  glassType: string[];
  specialFeatures: string[];
}

interface GlassInstallationQuestionProps {
  data: GlassInstallationData;
  onChange: (data: GlassInstallationData) => void;
}

export function GlassInstallationQuestion({ data, onChange }: GlassInstallationQuestionProps) {
  const updateField = (field: keyof GlassInstallationData, value: string | string[]) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center space-x-2 text-blue-400 font-semibold">
        <Square className="w-5 h-5" />
        <span>GLASS INSTALLATION TYPE & SPECIFICATIONS</span>
      </div>

      <AgentNote>
        Weight + size determine rigging requirements and struck-by risk
      </AgentNote>

      <StructuredCheckboxGroup
        label="Installation Method"
        options={[
          { value: 'curtain-wall', label: 'Curtain Wall (exterior, multi-story)' },
          { value: 'storefront', label: 'Storefront (ground level, framed)' },
          { value: 'window-replacement', label: 'Window Replacement (in-place)' },
          { value: 'skylight', label: 'Skylight/Roof Glass' },
          { value: 'other', label: 'Other' }
        ]}
        selectedValues={data.installationMethod}
        onChange={(value) => updateField('installationMethod', value)}
        required
      />

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Panel Dimensions</div>
        <div className="grid grid-cols-3 gap-4">
          <StructuredNumberField
            label="Width"
            value={data.panelWidth}
            onChange={(value) => updateField('panelWidth', value)}
            unit="inches"
            placeholder="Width"
            required
          />
          <StructuredNumberField
            label="Height"
            value={data.panelHeight}
            onChange={(value) => updateField('panelHeight', value)}
            unit="inches"
            placeholder="Height"
            required
          />
          <StructuredNumberField
            label="Thickness"
            value={data.panelThickness}
            onChange={(value) => updateField('panelThickness', value)}
            unit="inches"
            placeholder="Thickness"
            required
          />
        </div>
      </div>

      <StructuredNumberField
        label="Panel Weight"
        value={data.panelWeight}
        onChange={(value) => updateField('panelWeight', value)}
        unit="lbs"
        placeholder="Weight per panel"
        required
      />

      <StructuredCheckboxGroup
        label="Glass Type"
        options={[
          { value: 'igu', label: 'Insulated Glass Unit (IGU)' },
          { value: 'laminated', label: 'Laminated Safety Glass' },
          { value: 'tempered', label: 'Tempered Glass' },
          { value: 'annealed', label: 'Annealed (standard)' },
          { value: 'spandrel', label: 'Spandrel (opaque)' }
        ]}
        selectedValues={data.glassType}
        onChange={(value) => updateField('glassType', value)}
        required
      />

      <StructuredCheckboxGroup
        label="Special Features"
        options={[
          { value: 'argon-filled', label: 'Argon-filled' },
          { value: 'low-e', label: 'Low-E coating' },
          { value: 'tinted', label: 'Tinted/reflective' },
          { value: 'none', label: 'None' }
        ]}
        selectedValues={data.specialFeatures}
        onChange={(value) => updateField('specialFeatures', value)}
      />

      <PhotoHints hints={[
        "Glass panel close-up showing thickness",
        "Shop drawing or spec sheet",
        "Packaging label (shows weight/specs)",
        "Rigging setup for these panels"
      ]} />
    </div>
  );
}
