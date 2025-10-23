import { Shield, AlertTriangle } from 'lucide-react';
import { StructuredCheckboxGroup, StructuredRadioGroup, PhotoHints, AgentNote, CriticalWarning } from './StructuredQuestionComponents';

export interface PPEInspectionData {
  requiredPPE: string[];
  fallProtectionPPE: string[];
  inspectionStatus: string[];
  dRingCorrect: string;
  hardHatCorrect: string;
  glovesAppropriate: string;
  glassesWorn: string;
  spareAvailable: string;
}

interface PPEInspectionQuestionProps {
  data: PPEInspectionData;
  onChange: (data: PPEInspectionData) => void;
}

export function PPEInspectionQuestion({ data, onChange }: PPEInspectionQuestionProps) {
  const updateField = (field: keyof PPEInspectionData, value: string | string[]) => {
    onChange({ ...data, [field]: value });
  };

  const notInspected = data.inspectionStatus.includes('not-inspected');
  const damageFound = data.inspectionStatus.includes('damage-found');
  
  const dRingWrong = data.dRingCorrect === 'no';
  const hardHatWrong = data.hardHatCorrect === 'no';
  const wrongGloves = data.glovesAppropriate === 'no';
  const glassesNotWorn = data.glassesWorn === 'no';
  const noSpares = data.spareAvailable === 'no';

  const criticalPPEIssues = dRingWrong || hardHatWrong || wrongGloves;
  const workAtHeight = data.fallProtectionPPE.length > 0;

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center space-x-2 text-blue-400 font-semibold">
        <Shield className="w-5 h-5" />
        <span>PERSONAL PROTECTIVE EQUIPMENT (PPE)</span>
      </div>

      <AgentNote>
        Agent 3 looks for "no cut-resistant gloves" + "glass handling" = laceration incident prediction.
      </AgentNote>

      <StructuredCheckboxGroup
        label="Required PPE for This Task"
        options={[
          { value: 'hard-hat', label: 'Hard Hat (Type I or II)' },
          { value: 'safety-glasses', label: 'Safety Glasses (ANSI Z87.1)' },
          { value: 'cut-resistant', label: 'Cut-Resistant Gloves (ANSI A3 or higher for glass)' },
          { value: 'work-gloves', label: 'Work Gloves (general handling)' },
          { value: 'safety-boots', label: 'Safety Boots (steel/composite toe)' },
          { value: 'hi-vis', label: 'High-Visibility Vest (Class 2 or 3)' },
          { value: 'hearing', label: 'Hearing Protection (if loud equipment)' }
        ]}
        selectedValues={data.requiredPPE}
        onChange={(value) => updateField('requiredPPE', value)}
        required
      />

      {workAtHeight && (
        <StructuredCheckboxGroup
          label="Fall Protection PPE (if work >6 ft)"
          options={[
            { value: 'harness', label: 'Full-Body Harness (ANSI A10.32)' },
            { value: 'lanyard-srl', label: 'Shock-Absorbing Lanyard or SRL' },
            { value: 'chin-strap', label: 'Hard Hat with Chin Strap (for overhead work)' }
          ]}
          selectedValues={data.fallProtectionPPE}
          onChange={(value) => updateField('fallProtectionPPE', value)}
          required
        />
      )}

      <StructuredCheckboxGroup
        label="PPE Inspection Status"
        options={[
          { value: 'inspected', label: 'All PPE inspected before shift' },
          { value: 'no-defects', label: 'No defects found' },
          { value: 'minor-wear', label: 'Minor wear (still serviceable)' },
          { value: 'damage-found', label: 'Damage found (replaced before work)' },
          { value: 'not-inspected', label: 'Not inspected' }
        ]}
        selectedValues={data.inspectionStatus}
        onChange={(value) => updateField('inspectionStatus', value)}
        required
      />

      {notInspected && (
        <CriticalWarning>
          EQUIPMENT FAILURE RISK: PPE not inspected before use. Defective equipment may fail during critical moment. STOP and inspect all PPE now.
        </CriticalWarning>
      )}

      {damageFound && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-yellow-100">
            Damage found and replaced - Good catch! Verify replacement equipment is properly rated and inspected.
          </span>
        </div>
      )}

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Common PPE Issues to Check</div>
        
        <StructuredRadioGroup
          label="Harness D-ring on BACK (not chest)?"
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'n/a', label: 'N/A (no harness work)' }
          ]}
          value={data.dRingCorrect}
          onChange={(value) => updateField('dRingCorrect', value)}
          required
        />

        {dRingWrong && (
          <CriticalWarning>
            CRITICAL PPE ERROR: D-ring on FRONT/CHEST is INCORRECT for fall arrest. Must be on BACK between shoulder blades per OSHA 1926.502(d)(3).
          </CriticalWarning>
        )}

        <StructuredRadioGroup
          label="Hard hat worn correctly (not backward)?"
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' }
          ]}
          value={data.hardHatCorrect}
          onChange={(value) => updateField('hardHatCorrect', value)}
          required
        />

        {hardHatWrong && (
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-yellow-100">
              IMPROPER WEAR: Hard hat worn backward reduces protection. Correct immediately.
            </span>
          </div>
        )}

        <StructuredRadioGroup
          label="Gloves appropriate for glass (cut-resistant)?"
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' }
          ]}
          value={data.glovesAppropriate}
          onChange={(value) => updateField('glovesAppropriate', value)}
          required
        />

        {wrongGloves && (
          <CriticalWarning>
            LACERATION RISK: Non-cut-resistant gloves for glass handling = HIGH RISK for severe cuts. Use ANSI A3+ rated gloves minimum.
          </CriticalWarning>
        )}

        <StructuredRadioGroup
          label="Safety glasses worn (not on head)?"
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' }
          ]}
          value={data.glassesWorn}
          onChange={(value) => updateField('glassesWorn', value)}
          required
        />

        {glassesNotWorn && (
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-yellow-100">
              EYE PROTECTION: Safety glasses on head provide ZERO protection. Must be worn over eyes at all times.
            </span>
          </div>
        )}
      </div>

      <StructuredRadioGroup
        label="PPE Availability (Spares)"
        options={[
          { value: 'yes', label: 'Extra PPE available on-site (if damaged)' },
          { value: 'no', label: 'No spare PPE' }
        ]}
        value={data.spareAvailable}
        onChange={(value) => updateField('spareAvailable', value)}
        required
      />

      {noSpares && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-yellow-100">
            NO SPARES: If PPE damaged during work, operations will stop. Consider having backup equipment on-site.
          </span>
        </div>
      )}

      {criticalPPEIssues && (
        <CriticalWarning>
          MULTIPLE PPE ISSUES DETECTED: Incorrect D-ring placement, wrong gloves, or improper hard hat use = IMMEDIATE SAFETY HAZARD. Correct all issues before starting work.
        </CriticalWarning>
      )}

      <PhotoHints hints={[
        "Crew wearing full PPE (head-to-toe visible)",
        "Harness D-ring location (verify on back)",
        "Cut-resistant gloves close-up",
        "Hard hat with chin strap (if elevated work)"
      ]} />
    </div>
  );
}
