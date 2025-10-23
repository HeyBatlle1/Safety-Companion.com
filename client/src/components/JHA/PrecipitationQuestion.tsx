import { Cloud, Eye, AlertTriangle } from 'lucide-react';
import { StructuredCheckboxGroup, StructuredRadioGroup, PhotoHints, AgentNote, CriticalWarning } from './StructuredQuestionComponents';

export interface PrecipitationData {
  currentPrecipitation: string[];
  forecastHour1: string;
  forecastHour2: string;
  forecastHour3: string;
  forecastHour4: string;
  currentVisibility: string;
  groundVisibility: string;
  surfaceConditions: string[];
  slipFallPrecautions: string[];
  workInRainPolicy: string;
}

interface PrecipitationQuestionProps {
  data: PrecipitationData;
  onChange: (data: PrecipitationData) => void;
}

export function PrecipitationQuestion({ data, onChange }: PrecipitationQuestionProps) {
  const updateField = (field: keyof PrecipitationData, value: string | string[]) => {
    onChange({ ...data, [field]: value });
  };

  const hasWetSurface = data.surfaceConditions.some(c => 
    c === 'wet-slippery' || c === 'ice-frozen' || c === 'wet-non-slip'
  );
  const noPrecautions = data.slipFallPrecautions.includes('none');
  const showSlipWarning = hasWetSurface && noPrecautions;
  
  const hasRainForecast = [data.forecastHour1, data.forecastHour2, data.forecastHour3, data.forecastHour4]
    .some(h => h === 'rain' || h === 'snow');
  const noRainPolicy = data.workInRainPolicy === 'no-policy';
  const showRainPolicyWarning = hasRainForecast && noRainPolicy;

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center space-x-2 text-blue-400 font-semibold">
        <Cloud className="w-5 h-5" />
        <span>PRECIPITATION, VISIBILITY & SURFACE CONDITIONS</span>
      </div>

      <CriticalWarning>
        Rain + elevated glass work = high slip risk + reduced grip. ANSI recommends NO elevated work during precipitation.
      </CriticalWarning>

      <StructuredCheckboxGroup
        label="Current Precipitation"
        options={[
          { value: 'none-dry', label: 'None / Dry' },
          { value: 'light-rain', label: 'Light Rain / Drizzle' },
          { value: 'heavy-rain', label: 'Heavy Rain' },
          { value: 'snow-ice', label: 'Snow / Ice' },
          { value: 'recent-rain', label: 'Recent Rain (surfaces still wet)' }
        ]}
        selectedValues={data.currentPrecipitation}
        onChange={(value) => updateField('currentPrecipitation', value)}
        required
      />

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Precipitation Forecast (Next 4 Hours)</div>
        <AgentNote>
          Agent 3 predicts fall incidents when rain forecast ignored
        </AgentNote>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Hour 1</label>
            <StructuredRadioGroup
              options={[
                { value: 'dry', label: 'Dry' },
                { value: 'rain', label: 'Rain' },
                { value: 'snow', label: 'Snow' }
              ]}
              selectedValue={data.forecastHour1}
              onChange={(value) => updateField('forecastHour1', value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Hour 2</label>
            <StructuredRadioGroup
              options={[
                { value: 'dry', label: 'Dry' },
                { value: 'rain', label: 'Rain' },
                { value: 'snow', label: 'Snow' }
              ]}
              selectedValue={data.forecastHour2}
              onChange={(value) => updateField('forecastHour2', value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Hour 3</label>
            <StructuredRadioGroup
              options={[
                { value: 'dry', label: 'Dry' },
                { value: 'rain', label: 'Rain' },
                { value: 'snow', label: 'Snow' }
              ]}
              selectedValue={data.forecastHour3}
              onChange={(value) => updateField('forecastHour3', value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Hour 4</label>
            <StructuredRadioGroup
              options={[
                { value: 'dry', label: 'Dry' },
                { value: 'rain', label: 'Rain' },
                { value: 'snow', label: 'Snow' }
              ]}
              selectedValue={data.forecastHour4}
              onChange={(value) => updateField('forecastHour4', value)}
              required
            />
          </div>
        </div>
      </div>

      {showRainPolicyWarning && (
        <CriticalWarning>
          Rain forecasted but no work-in-rain policy defined. Establish clear stop-work criteria before proceeding.
        </CriticalWarning>
      )}

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="flex items-center space-x-2 text-gray-300">
          <Eye className="w-4 h-4" />
          <span className="text-sm font-medium">Visibility</span>
        </div>
        
        <StructuredRadioGroup
          label="Current Visibility"
          options={[
            { value: 'clear', label: 'Clear (>1 mile)' },
            { value: 'reduced', label: 'Reduced (fog/rain)' },
            { value: 'poor', label: 'Poor (<100 ft)' }
          ]}
          selectedValue={data.currentVisibility}
          onChange={(value) => updateField('currentVisibility', value)}
          required
        />

        <StructuredRadioGroup
          label="Can workers see ground level clearly?"
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' }
          ]}
          selectedValue={data.groundVisibility}
          onChange={(value) => updateField('groundVisibility', value)}
          required
        />

        <AgentNote>
          Visibility affects crane operator's ability to see signals and obstacles
        </AgentNote>
      </div>

      <StructuredCheckboxGroup
        label="Walking Surface Conditions"
        options={[
          { value: 'dry-clear', label: 'Dry and clear' },
          { value: 'wet-non-slip', label: 'Wet but non-slip surface' },
          { value: 'wet-slippery', label: 'Wet and slippery' },
          { value: 'ice-frozen', label: 'Ice / frozen' },
          { value: 'debris', label: 'Debris on walking paths' }
        ]}
        selectedValues={data.surfaceConditions}
        onChange={(value) => updateField('surfaceConditions', value)}
        required
      />

      <StructuredCheckboxGroup
        label="Slip/Fall Precautions"
        options={[
          { value: 'non-slip-tape', label: 'Non-slip tape on platforms' },
          { value: 'squeegee-broom', label: 'Squeegee/broom for water removal' },
          { value: 'sand-salt', label: 'Sand/salt for ice' },
          { value: 'marked-paths', label: 'Designated walking paths marked' },
          { value: 'none', label: 'None' }
        ]}
        selectedValues={data.slipFallPrecautions}
        onChange={(value) => updateField('slipFallPrecautions', value)}
        required
      />

      {showSlipWarning && (
        <CriticalWarning>
          Wet/icy surfaces with no slip prevention measures = HIGH FALL RISK. Implement precautions before work begins.
        </CriticalWarning>
      )}

      <StructuredRadioGroup
        label="Work in Rain Policy"
        options={[
          { value: 'stop-any-rain', label: 'Stop work in any rain' },
          { value: 'continue-unless-heavy', label: 'Continue unless heavy' },
          { value: 'no-policy', label: 'No specific policy' }
        ]}
        selectedValue={data.workInRainPolicy}
        onChange={(value) => updateField('workInRainPolicy', value)}
        required
      />

      <PhotoHints hints={[
        "Sky conditions (clouds, visibility)",
        "Ground surface conditions (wet/dry/ice)",
        "Walking surfaces on swing stage/platform",
        "Visibility from work height (can you see ground?)"
      ]} />
    </div>
  );
}
