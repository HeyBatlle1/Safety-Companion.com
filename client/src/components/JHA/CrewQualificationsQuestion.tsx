import { Users, GraduationCap, AlertTriangle } from 'lucide-react';
import { StructuredCheckboxGroup, StructuredNumberField, StructuredTextField, StructuredRadioGroup, PhotoHints, AgentNote, CriticalWarning } from './StructuredQuestionComponents';

export interface CrewQualificationsData {
  totalWorkers: string;
  installers: string;
  craneOperator: string;
  groundSupport: string;
  supervisor: string;
  competentPersonName: string;
  competentPersonRole: string[];
  competentPersonQualifications: string[];
  foremanYears: string;
  crewExperience: string;
  trainingRecords: string[];
  glassTraining: string[];
  previousExperience: string[];
  nearMissCount: string;
  correctiveActions: string;
  correctiveActionsTaken: string;
}

interface CrewQualificationsQuestionProps {
  data: CrewQualificationsData;
  onChange: (data: CrewQualificationsData) => void;
}

export function CrewQualificationsQuestion({ data, onChange }: CrewQualificationsQuestionProps) {
  const updateField = (field: keyof CrewQualificationsData, value: string | string[]) => {
    onChange({ ...data, [field]: value });
  };

  const noCompetentPerson = !data.competentPersonName || data.competentPersonName.trim() === '';
  const noFormalTraining = data.glassTraining.includes('no-formal');
  const firstTimeScale = data.previousExperience.includes('first-time');
  const highNearMiss = data.nearMissCount === '3-plus';
  const unknownNearMiss = data.nearMissCount === 'unknown';
  const noCorrectiveActions = data.correctiveActions === 'no';

  const criticalCompetencyGap = noFormalTraining && firstTimeScale;
  const criticalSafetyCulture = (highNearMiss || unknownNearMiss) || (data.nearMissCount !== 'none' && data.nearMissCount !== '' && noCorrectiveActions);

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center space-x-2 text-blue-400 font-semibold">
        <Users className="w-5 h-5" />
        <span>CREW QUALIFICATIONS & EXPERIENCE</span>
      </div>

      <AgentNote>
        "First time at this scale" + "no formal training" = Agent 3 predicts errors in judgment under pressure.
      </AgentNote>

      <CriticalWarning>
        OSHA 1926.502(k) requires competent person for fall protection. No identified competent person = compliance violation.
      </CriticalWarning>

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Crew Size Breakdown</div>
        
        <div className="grid grid-cols-2 gap-4">
          <StructuredNumberField
            label="Total Workers"
            value={data.totalWorkers}
            onChange={(value) => updateField('totalWorkers', value)}
            unit="people"
            placeholder="Total count"
            required
          />
          <StructuredNumberField
            label="Installers"
            value={data.installers}
            onChange={(value) => updateField('installers', value)}
            unit="people"
            placeholder="Count"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <StructuredNumberField
            label="Crane Operator"
            value={data.craneOperator}
            onChange={(value) => updateField('craneOperator', value)}
            unit="people"
            placeholder="0 or 1"
          />
          <StructuredNumberField
            label="Ground Support"
            value={data.groundSupport}
            onChange={(value) => updateField('groundSupport', value)}
            unit="people"
            placeholder="Count"
          />
          <StructuredNumberField
            label="Supervisor"
            value={data.supervisor}
            onChange={(value) => updateField('supervisor', value)}
            unit="people"
            placeholder="Count"
          />
        </div>
      </div>

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Competent Person (OSHA Required)</div>
        
        <StructuredTextField
          label="Competent Person Name"
          value={data.competentPersonName}
          onChange={(value) => updateField('competentPersonName', value)}
          placeholder="Full name"
          required
        />

        {noCompetentPerson && (
          <CriticalWarning>
            NO COMPETENT PERSON IDENTIFIED - OSHA 1926.502(k) VIOLATION. Must designate qualified competent person before work begins.
          </CriticalWarning>
        )}

        <StructuredCheckboxGroup
          label="Competent Person Role"
          options={[
            { value: 'foreman', label: 'Foreman' },
            { value: 'site-supervisor', label: 'Site Supervisor' },
            { value: 'safety-manager', label: 'Safety Manager' }
          ]}
          selectedValues={data.competentPersonRole}
          onChange={(value) => updateField('competentPersonRole', value)}
          required
        />

        <StructuredCheckboxGroup
          label="Competent Person Qualifications"
          options={[
            { value: 'osha-30', label: 'OSHA 30-hour' },
            { value: 'company-certified', label: 'Company-certified' },
            { value: '5-plus-years', label: '5+ years experience' }
          ]}
          selectedValues={data.competentPersonQualifications}
          onChange={(value) => updateField('competentPersonQualifications', value)}
          required
        />
      </div>

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Crew Experience Level</div>
        
        <StructuredNumberField
          label="Foreman/Lead Experience"
          value={data.foremanYears}
          onChange={(value) => updateField('foremanYears', value)}
          unit="years"
          placeholder="Years in glass installation"
          required
        />

        <StructuredRadioGroup
          label="Crew Average Experience"
          options={[
            { value: 'less-1', label: '<1 year' },
            { value: '1-3', label: '1-3 years' },
            { value: '3-5', label: '3-5 years' },
            { value: 'more-5', label: '>5 years' }
          ]}
          value={data.crewExperience}
          onChange={(value) => updateField('crewExperience', value)}
          required
        />
      </div>

      <StructuredCheckboxGroup
        label="Training Records (Required for Crew)"
        options={[
          { value: 'osha-10', label: 'OSHA 10-hour Construction (all crew)' },
          { value: 'osha-30', label: 'OSHA 30-hour (supervisor/competent person)' },
          { value: 'fall-protection', label: 'Fall Protection Training (within last year)' },
          { value: 'crane-signal', label: 'Crane Signal Person (if applicable)' },
          { value: 'first-aid', label: 'First Aid/CPR (at least one crew member)' }
        ]}
        selectedValues={data.trainingRecords}
        onChange={(value) => updateField('trainingRecords', value)}
        required
      />

      <StructuredCheckboxGroup
        label="Specific Glass Installation Training"
        options={[
          { value: 'manufacturer', label: 'Manufacturer training (glass handling systems)' },
          { value: 'on-job', label: 'On-the-job training (>6 months experience)' },
          { value: 'apprenticeship', label: 'Apprenticeship program' },
          { value: 'no-formal', label: 'No formal training' }
        ]}
        selectedValues={data.glassTraining}
        onChange={(value) => updateField('glassTraining', value)}
        required
      />

      {noFormalTraining && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-yellow-100">
            COMPETENCY CONCERN: No formal glass installation training. Ensure experienced supervision present at all times.
          </span>
        </div>
      )}

      <StructuredCheckboxGroup
        label="Previous Glass Installation Experience"
        options={[
          { value: 'same-type', label: 'Same building type, same height' },
          { value: 'similar', label: 'Similar projects (different height/type)' },
          { value: 'first-time', label: 'First time on project of this scale' }
        ]}
        selectedValues={data.previousExperience}
        onChange={(value) => updateField('previousExperience', value)}
        required
      />

      {firstTimeScale && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
          <GraduationCap className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-yellow-100">
            LEARNING CURVE RISK: First time at this project scale. Expect slower pace, more supervision, potential judgment errors under pressure.
          </span>
        </div>
      )}

      {criticalCompetencyGap && (
        <CriticalWarning>
          CRITICAL COMPETENCY GAP: First time at scale + no formal training = HIGH RISK for errors. Consider adding experienced supervisor or delaying until training completed.
        </CriticalWarning>
      )}

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Near-Miss History (Last 90 Days)</div>
        
        <StructuredRadioGroup
          label="Near-Miss Incidents"
          options={[
            { value: 'none', label: 'No near-misses or incidents' },
            { value: '1-2', label: '1-2 near-misses (documented and reviewed)' },
            { value: '3-plus', label: '3+ near-misses' },
            { value: 'unknown', label: 'Unknown/not tracked' }
          ]}
          value={data.nearMissCount}
          onChange={(value) => updateField('nearMissCount', value)}
          required
        />

        {highNearMiss && (
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-yellow-100">
              PATTERN CONCERN: 3+ near-misses in 90 days indicates systemic safety issues. Review root causes before proceeding.
            </span>
          </div>
        )}

        {unknownNearMiss && (
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-yellow-100">
              SAFETY CULTURE GAP: Near-misses not tracked. Implement near-miss reporting system immediately.
            </span>
          </div>
        )}

        {data.nearMissCount !== 'none' && data.nearMissCount !== 'unknown' && data.nearMissCount !== '' && (
          <>
            <StructuredRadioGroup
              label="Were Corrective Actions Taken?"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' }
              ]}
              value={data.correctiveActions}
              onChange={(value) => updateField('correctiveActions', value)}
              required
            />

            {data.correctiveActions === 'yes' && (
              <StructuredTextField
                label="Describe Corrective Actions"
                value={data.correctiveActionsTaken}
                onChange={(value) => updateField('correctiveActionsTaken', value)}
                placeholder="What was done to prevent recurrence?"
                required
              />
            )}

            {noCorrectiveActions && (
              <CriticalWarning>
                REPEAT INCIDENT RISK: Near-misses occurred but NO corrective actions taken. Same incident likely to recur.
              </CriticalWarning>
            )}
          </>
        )}

        {criticalSafetyCulture && (
          <CriticalWarning>
            CRITICAL SAFETY CULTURE ISSUE: Pattern of incidents without tracking or correction = HIGH LIKELIHOOD of serious injury.
          </CriticalWarning>
        )}
      </div>

      <PhotoHints hints={[
        "Training certificates (OSHA 10/30, fall protection)",
        "Crew team photo (for emergency identification)",
        "Competent person credentials"
      ]} />
    </div>
  );
}
