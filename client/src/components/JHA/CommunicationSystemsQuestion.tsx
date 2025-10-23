import { Radio, Phone, AlertTriangle } from 'lucide-react';
import { StructuredCheckboxGroup, StructuredTextField, StructuredRadioGroup, PhotoHints, AgentNote, CriticalWarning } from './StructuredQuestionComponents';

export interface CommunicationSystemsData {
  primaryMethod: string[];
  radioChannel: string;
  communicationChecks: string[];
  groundToHeightClear: string;
  craneSignalsVisible: string;
  backgroundNoise: string;
  noiseDescription: string;
  emergencyStopSignal: string;
  manDownSignal: string;
  evacuateSignal: string;
  crewBriefed: string;
  emergencyNumbers: string[];
  supervisorPhone: string;
  safetyManagerPhone: string;
  hospitalPhone: string;
  backupMethod: string;
}

interface CommunicationSystemsQuestionProps {
  data: CommunicationSystemsData;
  onChange: (data: CommunicationSystemsData) => void;
}

export function CommunicationSystemsQuestion({ data, onChange }: CommunicationSystemsQuestionProps) {
  const updateField = (field: keyof CommunicationSystemsData, value: string | string[]) => {
    onChange({ ...data, [field]: value });
  };

  const verbalOnly = data.primaryMethod.includes('verbal') && data.primaryMethod.length === 1;
  const notTested = data.communicationChecks.includes('not-tested');
  const noCommunication = !data.groundToHeightClear || data.groundToHeightClear === 'no';
  const signalsNotVisible = data.craneSignalsVisible === 'no';
  const backgroundNoise = data.backgroundNoise === 'yes';
  const crewNotBriefed = data.crewBriefed === 'no';
  const noBackup = !data.backupMethod || data.backupMethod.toLowerCase().includes('no backup');

  const criticalCommFailure = (verbalOnly && noCommunication) || (data.primaryMethod.includes('hand-signals') && signalsNotVisible);
  const singlePointFailure = notTested || (noBackup && !verbalOnly);

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center space-x-2 text-blue-400 font-semibold">
        <Radio className="w-5 h-5" />
        <span>COMMUNICATION SYSTEMS & PROTOCOLS</span>
      </div>

      <AgentNote>
        "Verbal only" + "60 ft height" = Agent 3 predicts miscommunication in causal chain (Unsafe Act → Loss of Control).
      </AgentNote>

      <StructuredCheckboxGroup
        label="Primary Communication Method"
        options={[
          { value: 'two-way-radios', label: 'Two-Way Radios' },
          { value: 'hand-signals', label: 'Hand Signals (crane operations)' },
          { value: 'cell-phones', label: 'Cell Phones' },
          { value: 'verbal', label: 'Verbal (shouting)' },
          { value: 'combination', label: 'Combination' }
        ]}
        selectedValues={data.primaryMethod}
        onChange={(value) => updateField('primaryMethod', value)}
        required
      />

      {data.primaryMethod.includes('two-way-radios') && (
        <StructuredTextField
          label="Radio Channel"
          value={data.radioChannel}
          onChange={(value) => updateField('radioChannel', value)}
          placeholder="Channel number"
          hint="Dedicated channel for this crew"
          required
        />
      )}

      {verbalOnly && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-yellow-100">
            VERBAL ONLY COMMUNICATION: Limited effectiveness at height or distance. Consider adding radios or hand signals.
          </span>
        </div>
      )}

      <StructuredCheckboxGroup
        label="Radio/Communication Checks"
        options={[
          { value: 'tested', label: 'Tested before work started (all working)' },
          { value: 'spare-batteries', label: 'Spare batteries available' },
          { value: 'backup-radios', label: 'Backup radios on-site' },
          { value: 'not-tested', label: 'Not tested' }
        ]}
        selectedValues={data.communicationChecks}
        onChange={(value) => updateField('communicationChecks', value)}
        required
      />

      {notTested && (
        <CriticalWarning>
          COORDINATION RISK: Communication equipment not tested. Radio failure during critical lift = loss of coordination. TEST ALL EQUIPMENT NOW.
        </CriticalWarning>
      )}

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Communication Clarity Verification</div>
        
        <StructuredRadioGroup
          label="Can ground crew hear workers at height clearly?"
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' }
          ]}
          value={data.groundToHeightClear}
          onChange={(value) => updateField('groundToHeightClear', value)}
          required
        />

        {data.primaryMethod.includes('hand-signals') && (
          <StructuredRadioGroup
            label="Can crane operator see hand signals from all angles?"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' }
            ]}
            value={data.craneSignalsVisible}
            onChange={(value) => updateField('craneSignalsVisible', value)}
            required
          />
        )}

        <StructuredRadioGroup
          label="Is there background noise interference?"
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' }
          ]}
          value={data.backgroundNoise}
          onChange={(value) => updateField('backgroundNoise', value)}
          required
        />

        {backgroundNoise && (
          <StructuredTextField
            label="Describe Noise Source"
            value={data.noiseDescription}
            onChange={(value) => updateField('noiseDescription', value)}
            placeholder="e.g., Traffic, construction equipment, machinery"
            required
          />
        )}
      </div>

      {signalsNotVisible && (
        <CriticalWarning>
          CRANE SIGNAL FAILURE: Operator cannot see hand signals from all positions. STOP crane operations until line-of-sight established or switch to radio communication.
        </CriticalWarning>
      )}

      {criticalCommFailure && (
        <CriticalWarning>
          CRITICAL COMMUNICATION FAILURE: Primary communication method ineffective (verbal at height or signals not visible). IMMEDIATE CHANGE REQUIRED before work begins.
        </CriticalWarning>
      )}

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Emergency Communication Signals</div>
        
        <StructuredTextField
          label="Emergency Stop Signal"
          value={data.emergencyStopSignal}
          onChange={(value) => updateField('emergencyStopSignal', value)}
          placeholder="e.g., Two short blasts, Arms crossed overhead"
          hint="Must be distinct and universally understood"
          required
        />

        <StructuredTextField
          label="'Man Down' Signal"
          value={data.manDownSignal}
          onChange={(value) => updateField('manDownSignal', value)}
          placeholder="e.g., Three long blasts, Continuous horn"
          required
        />

        <StructuredTextField
          label="'Evacuate' Signal"
          value={data.evacuateSignal}
          onChange={(value) => updateField('evacuateSignal', value)}
          placeholder="e.g., Continuous siren, Repeated whistle"
          required
        />

        <StructuredRadioGroup
          label="All crew members briefed on emergency signals?"
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' }
          ]}
          value={data.crewBriefed}
          onChange={(value) => updateField('crewBriefed', value)}
          required
        />

        {crewNotBriefed && (
          <CriticalWarning>
            EMERGENCY RESPONSE GAP: Crew not briefed on emergency signals. In crisis, confusion delays response. BRIEF CREW IMMEDIATELY.
          </CriticalWarning>
        )}
      </div>

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300 flex items-center space-x-2">
          <Phone className="w-4 h-4" />
          <span>Emergency Contact Numbers (Posted On-Site)</span>
        </div>
        
        <StructuredCheckboxGroup
          label="Contact Numbers Posted"
          options={[
            { value: '911', label: '911 - Posted' },
            { value: 'supervisor', label: 'Site Supervisor - Posted' },
            { value: 'safety', label: 'Safety Manager - Posted' },
            { value: 'hospital', label: 'Nearest Hospital - Posted' }
          ]}
          selectedValues={data.emergencyNumbers}
          onChange={(value) => updateField('emergencyNumbers', value)}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <StructuredTextField
            label="Site Supervisor Phone"
            value={data.supervisorPhone}
            onChange={(value) => updateField('supervisorPhone', value)}
            placeholder="Phone number"
          />
          <StructuredTextField
            label="Safety Manager Phone"
            value={data.safetyManagerPhone}
            onChange={(value) => updateField('safetyManagerPhone', value)}
            placeholder="Phone number"
          />
        </div>

        <StructuredTextField
          label="Nearest Hospital Contact"
          value={data.hospitalPhone}
          onChange={(value) => updateField('hospitalPhone', value)}
          placeholder="Hospital name and phone"
          hint="Include address for EMS directions"
        />
      </div>

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Backup Communication Plan</div>
        
        <StructuredTextField
          label="If radios fail, backup method:"
          value={data.backupMethod}
          onChange={(value) => updateField('backupMethod', value)}
          placeholder="e.g., Hand signals + cell phones, Runner between positions"
          hint="Critical: Never rely on single communication method"
          required
        />

        {noBackup && (
          <CriticalWarning>
            SINGLE POINT FAILURE: No backup communication plan. Radio/phone failure = complete coordination loss. Establish backup method NOW.
          </CriticalWarning>
        )}
      </div>

      {singlePointFailure && (
        <CriticalWarning>
          CRITICAL SYSTEM VULNERABILITY: Untested equipment OR no backup plan = HIGH RISK of communication failure during operation.
        </CriticalWarning>
      )}

      <PhotoHints hints={[
        "Radio check (crew with radios)",
        "Emergency contact numbers posted",
        "Hand signal chart (if using crane)"
      ]} />
    </div>
  );
}
