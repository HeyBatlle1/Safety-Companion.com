import { Thermometer } from 'lucide-react';
import {
  StructuredNumberField,
  StructuredCheckboxGroup,
  PhotoHints,
  AgentNote,
  CriticalWarning
} from './StructuredQuestionComponents';
import { Label } from '@/components/ui/label';

export interface TemperatureData {
  currentTemp: string;
  humidity: string;
  heatIndex: string;
  windChill: string;
  thermalRisk: 'none' | 'heat' | 'cold';
  precautions: string[];
  fatigueIndicators: {
    waterBreakFrequency: string; // minutes
    restAreaTemp: string; // degrees F
    workerFatigueLevel: string; // 1-10 scale
  };
}

interface TemperatureQuestionProps {
  data: TemperatureData;
  onChange: (data: TemperatureData) => void;
}

export function TemperatureQuestion({ data, onChange }: TemperatureQuestionProps) {
  const updateField = (field: keyof TemperatureData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateFatigueField = (field: keyof TemperatureData['fatigueIndicators'], value: string) => {
    onChange({
      ...data,
      fatigueIndicators: { ...data.fatigueIndicators, [field]: value }
    });
  };

  const heatPrecautions = [
    { value: 'water_station', label: 'Water station accessible (< 5 min walk)' },
    { value: 'frequent_breaks', label: 'Enforced break schedule (every 15-30 min)' },
    { value: 'shade_available', label: 'Shaded rest area provided' },
    { value: 'work_rest_cycle', label: 'OSHA work/rest cycle implemented' },
    { value: 'cooling_vests', label: 'Cooling vests or wet towels available' },
    { value: 'buddy_system', label: 'Buddy system for heat monitoring' }
  ];

  const coldPrecautions = [
    { value: 'warming_area', label: 'Heated warming area accessible' },
    { value: 'layered_clothing', label: 'Layered clothing protocol enforced' },
    { value: 'hot_beverages', label: 'Hot beverages available' },
    { value: 'frequent_warmup', label: 'Scheduled warming breaks (every 30 min)' },
    { value: 'frostbite_training', label: 'Crew trained on frostbite/hypothermia signs' },
    { value: 'dry_clothes', label: 'Dry clothing changes available' }
  ];

  const activePrecautions = data.thermalRisk === 'heat' ? heatPrecautions : 
                           data.thermalRisk === 'cold' ? coldPrecautions : [];

  return (
    <div className="space-y-6 p-6 bg-slate-800/40 rounded-lg border border-blue-500/20">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-orange-500/20 rounded-lg">
          <Thermometer className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">🌡️ Temperature & Thermal Stress</h3>
          <p className="text-sm text-gray-400">Worker fatigue and performance impact</p>
        </div>
      </div>

      {/* Structured Sub-fields */}
      <div className="space-y-4">
        <StructuredNumberField
          label="Current Temperature"
          value={data.currentTemp}
          onChange={(value) => updateField('currentTemp', value)}
          unit="°F"
          placeholder="e.g., 85"
          min={-20}
          max={120}
          hint="Ambient temperature at work location"
          required
          testId="input-current-temp"
        />

        <StructuredNumberField
          label="Relative Humidity"
          value={data.humidity}
          onChange={(value) => updateField('humidity', value)}
          unit="%"
          placeholder="e.g., 65"
          min={0}
          max={100}
          hint="Used to calculate heat index"
          required
          testId="input-humidity"
        />

        {/* Heat Index or Wind Chill */}
        <div className="grid grid-cols-2 gap-4">
          <StructuredNumberField
            label="Heat Index (if hot)"
            value={data.heatIndex}
            onChange={(value) => updateField('heatIndex', value)}
            unit="°F"
            placeholder="e.g., 95"
            min={60}
            max={150}
            hint="Calculated or from weather app"
            testId="input-heat-index"
          />

          <StructuredNumberField
            label="Wind Chill (if cold)"
            value={data.windChill}
            onChange={(value) => updateField('windChill', value)}
            unit="°F"
            placeholder="e.g., 28"
            min={-60}
            max={50}
            hint="Includes wind effect"
            testId="input-wind-chill"
          />
        </div>

        {/* Thermal Stress Risk Level */}
        <div className="space-y-2">
          <Label className="text-white text-sm font-medium">
            Thermal Stress Risk <span className="text-red-400">*</span>
          </Label>
          <div className="space-y-2 pl-1">
            {[
              { value: 'none', label: 'None - Comfortable working conditions', color: 'green' },
              { value: 'heat', label: 'Heat Stress Risk - Temp >80°F or Heat Index >90°F', color: 'orange' },
              { value: 'cold', label: 'Cold Stress Risk - Temp <40°F or Wind Chill <32°F', color: 'blue' }
            ].map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`thermal-${option.value}`}
                  name="thermal-risk"
                  value={option.value}
                  checked={data.thermalRisk === option.value}
                  onChange={(e) => updateField('thermalRisk', e.target.value as any)}
                  className="w-4 h-4"
                  data-testid={`radio-thermal-${option.value}`}
                />
                <label
                  htmlFor={`thermal-${option.value}`}
                  className={`text-sm cursor-pointer ${
                    option.color === 'green' ? 'text-green-300' :
                    option.color === 'orange' ? 'text-orange-300' :
                    'text-blue-300'
                  }`}
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Precautions (conditional based on risk) */}
        {data.thermalRisk !== 'none' && (
          <StructuredCheckboxGroup
            label={`${data.thermalRisk === 'heat' ? 'Heat' : 'Cold'} Stress Precautions in Place`}
            options={activePrecautions}
            selectedValues={data.precautions}
            onChange={(values) => updateField('precautions', values)}
            hint="Select all safety measures currently implemented"
            required
          />
        )}

        {/* Fatigue Indicators */}
        <div className="space-y-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
          <h4 className="text-sm font-semibold text-white">Worker Fatigue Indicators</h4>
          
          <StructuredNumberField
            label="Water Break Frequency"
            value={data.fatigueIndicators.waterBreakFrequency}
            onChange={(value) => updateFatigueField('waterBreakFrequency', value)}
            unit="minutes"
            placeholder="e.g., 15"
            min={5}
            max={120}
            hint="How often are breaks taken?"
            testId="input-break-frequency"
          />

          <StructuredNumberField
            label="Rest Area Temperature"
            value={data.fatigueIndicators.restAreaTemp}
            onChange={(value) => updateFatigueField('restAreaTemp', value)}
            unit="°F"
            placeholder="e.g., 72"
            min={50}
            max={90}
            hint="Temperature in break/rest area"
            testId="input-rest-area-temp"
          />

          <StructuredNumberField
            label="Worker Fatigue Level (Supervisor Assessment)"
            value={data.fatigueIndicators.workerFatigueLevel}
            onChange={(value) => updateFatigueField('workerFatigueLevel', value)}
            unit="/ 10"
            placeholder="e.g., 3"
            min={1}
            max={10}
            hint="1 = Fresh, 5 = Moderate, 10 = Exhausted"
            testId="input-fatigue-level"
          />
        </div>
      </div>

      {/* Photo Hints */}
      <PhotoHints hints={[
        'Thermometer reading at work location (not office)',
        'Rest area with shade/heating visible',
        'Water station or warming area setup',
        'Worker clothing appropriate to conditions',
        'Weather app showing heat index or wind chill'
      ]} />

      {/* Agent Note */}
      <AgentNote>
        Temperature and humidity directly feed Agent 3's fatigue prediction model. Heat index &gt;103°F 
        or wind chill &lt;32°F trigger exponential increases in incident probability through the causal 
        chain: thermal stress → fatigue → reduced attention → higher error rate. Fatigue level scores 
        help validate physiological predictions.
      </AgentNote>

      {/* Critical Warning */}
      {(data.heatIndex && parseFloat(data.heatIndex) > 103) || 
       (data.windChill && parseFloat(data.windChill) < 32) ? (
        <CriticalWarning>
          {parseFloat(data.heatIndex || '0') > 103 ? (
            <>Heat Index &gt;103°F = EXTREME DANGER per OSHA Heat Stress guidelines. 
            Implement aggressive work/rest cycles (50% work time at 104°F+). 
            Consider work stoppage.</>
          ) : (
            <>Wind Chill &lt;32°F = INCREASED RISK of frostbite and hypothermia. 
            Monitor workers closely for shivering, confusion, or numbness. 
            Enforce 30-minute warming breaks.</>
          )}
        </CriticalWarning>
      ) : null}
    </div>
  );
}
