import { Wind } from 'lucide-react';
import { 
  StructuredNumberField, 
  StructuredSelectField, 
  StructuredCheckboxGroup,
  PhotoHints,
  AgentNote,
  CriticalWarning
} from './StructuredQuestionComponents';

export interface WindConditionsData {
  currentSpeed: string;
  forecastedGusts: string;
  source: string;
  stoppageThreshold: string;
  monitoringPlan: string[];
}

interface WindConditionsQuestionProps {
  data: WindConditionsData;
  onChange: (data: WindConditionsData) => void;
}

export function WindConditionsQuestion({ data, onChange }: WindConditionsQuestionProps) {
  const updateField = (field: keyof WindConditionsData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const sourceOptions = [
    { value: 'anemometer', label: 'On-site anemometer' },
    { value: 'weather_app', label: 'Weather app/service' },
    { value: 'visual', label: 'Visual estimate' },
    { value: 'meteorologist', label: 'On-site meteorologist' }
  ];

  const monitoringOptions = [
    { value: 'dedicated_person', label: 'Dedicated person checking every 15 minutes' },
    { value: 'realtime_alarm', label: 'Real-time anemometer with alarm system' },
    { value: 'periodic_checks', label: 'Periodic checks by supervisor' },
    { value: 'weather_alerts', label: 'Automated weather alert system' }
  ];

  return (
    <div className="space-y-6 p-6 bg-slate-800/40 rounded-lg border border-blue-500/20">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Wind className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">💨 Wind Conditions & Monitoring</h3>
          <p className="text-sm text-gray-400">Critical environmental factor for site safety</p>
        </div>
      </div>

      {/* Structured Sub-fields */}
      <div className="space-y-4">
        <StructuredNumberField
          label="Current Wind Speed"
          value={data.currentSpeed}
          onChange={(value) => updateField('currentSpeed', value)}
          unit="mph"
          placeholder="e.g., 18"
          min={0}
          max={100}
          hint="Measured at site level or from weather station"
          required
          testId="input-current-wind-speed"
        />

        <StructuredNumberField
          label="Forecasted Gusts (next 4 hours)"
          value={data.forecastedGusts}
          onChange={(value) => updateField('forecastedGusts', value)}
          unit="mph"
          placeholder="e.g., 25"
          min={0}
          max={100}
          hint="Maximum expected wind speed in near term"
          required
          testId="input-forecasted-gusts"
        />

        <StructuredSelectField
          label="Data Source"
          value={data.source}
          onChange={(value) => updateField('source', value)}
          options={sourceOptions}
          placeholder="Select measurement source..."
          hint="Agents weight data by source reliability"
          required
          testId="select-wind-source"
        />

        <StructuredNumberField
          label="Work Stoppage Threshold"
          value={data.stoppageThreshold}
          onChange={(value) => updateField('stoppageThreshold', value)}
          unit="mph"
          placeholder="e.g., 20"
          min={0}
          max={50}
          hint="ANSI/IWCA I-14.1 recommends 20 mph for glass at height"
          required
          testId="input-stoppage-threshold"
        />

        <StructuredCheckboxGroup
          label="Wind Monitoring Plan"
          options={monitoringOptions}
          selectedValues={data.monitoringPlan}
          onChange={(values) => updateField('monitoringPlan', values)}
          hint="Select all monitoring methods in place"
          required
        />
      </div>

      {/* Photo Hints */}
      <PhotoHints hints={[
        'Anemometer display showing current reading (if using)',
        'Weather app screenshot with 4-hour forecast',
        'Wind indicators on site (flags at full extension, tree movement)',
        'Sky conditions (cloud coverage, approaching storms)'
      ]} />

      {/* Agent Note */}
      <AgentNote>
        Wind speed &gt;20 mph is the #1 environmental factor in Agent 3's load swing predictions. 
        Forecast data enables timeline analysis of when conditions become unsafe. Numbers are 
        required - words like "windy" don't work for risk calculation.
      </AgentNote>

      {/* Critical Warning */}
      <CriticalWarning>
        Wind &gt;20 mph = STOP glass installation at height per ANSI/IWCA I-14.1. 
        Crane operations may require shutdown at 25 mph (check equipment specs). 
        Always err on the side of safety.
      </CriticalWarning>
    </div>
  );
}
