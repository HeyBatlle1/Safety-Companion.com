import { ClipboardList, AlertTriangle, MapPin } from 'lucide-react';
import { StructuredCheckboxGroup, StructuredTextField, StructuredRadioGroup, PhotoHints, AgentNote, CriticalWarning } from './StructuredQuestionComponents';

export interface EmergencyPlanData {
  eapStatus: string;
  eapComponents: string[];
  assemblyLocation: string;
  assemblyDistance: string;
  assemblySafeFromFalling: string;
  assemblyReachable: string;
  whoCalls911: string;
  whoNotifiesSupervisor: string;
  whoNotifiesSafety: string;
  crewAwareness: string;
  lastDrillDate: string;
  drillFrequency: string;
  hospitalName: string;
  hospitalAddress: string;
  hospitalDriveTime: string;
  hospitalTraumaCenter: string;
}

interface EmergencyPlanQuestionProps {
  data: EmergencyPlanData;
  onChange: (data: EmergencyPlanData) => void;
}

export function EmergencyPlanQuestion({ data, onChange }: EmergencyPlanQuestionProps) {
  const updateField = (field: keyof EmergencyPlanData, value: string | string[]) => {
    onChange({ ...data, [field]: value });
  };

  const noEAP = data.eapStatus === 'no-eap';
  const verbalOnly = data.eapStatus === 'verbal-only';
  const crewNotBriefed = data.crewAwareness === 'not-briefed';
  const drillStale = data.drillFrequency === 'over-90-days';
  const neverDrilled = data.drillFrequency === 'never';
  const assemblyUnsafe = data.assemblySafeFromFalling === 'no';
  const assemblyUnreachable = data.assemblyReachable === 'no';

  const criticalPlanFailure = noEAP || verbalOnly;
  const planWeakness = crewNotBriefed || neverDrilled || assemblyUnsafe;

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center space-x-2 text-blue-400 font-semibold">
        <ClipboardList className="w-5 h-5" />
        <span>EMERGENCY ACTION PLAN (EAP)</span>
      </div>

      <AgentNote>
        "No EAP" + "High-risk work" = Agent 4 automatic NO-GO decision.
      </AgentNote>

      <StructuredRadioGroup
        label="EAP Status"
        options={[
          { value: 'written-onsite', label: 'Written EAP available on-site' },
          { value: 'generic', label: 'Generic company EAP (not site-specific)' },
          { value: 'verbal-only', label: 'Verbal plan only' },
          { value: 'no-eap', label: 'No EAP' }
        ]}
        value={data.eapStatus}
        onChange={(value) => updateField('eapStatus', value)}
        required
      />

      {noEAP && (
        <CriticalWarning>
          AUTOMATIC NO-GO: No Emergency Action Plan. OSHA 1926.35 requires written EAP for sites with &gt;10 employees. CANNOT PROCEED WITHOUT EAP.
        </CriticalWarning>
      )}

      {verbalOnly && (
        <CriticalWarning>
          NOT COMPLIANT: OSHA requires WRITTEN Emergency Action Plan. Verbal-only plans are not acceptable. CREATE WRITTEN EAP BEFORE STARTING WORK.
        </CriticalWarning>
      )}

      <StructuredCheckboxGroup
        label="EAP Components Included"
        options={[
          { value: 'evacuation-routes', label: 'Evacuation routes marked' },
          { value: 'assembly-point', label: 'Assembly point designated' },
          { value: 'emergency-contacts', label: 'Emergency contact numbers posted' },
          { value: 'hospital-route', label: 'Hospital route map available' },
          { value: 'weather-plan', label: 'Weather evacuation plan (high winds, lightning)' },
          { value: 'rescue-procedures', label: 'Rescue procedures documented' }
        ]}
        selectedValues={data.eapComponents}
        onChange={(value) => updateField('eapComponents', value)}
        required
      />

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300 flex items-center space-x-2">
          <MapPin className="w-4 h-4" />
          <span>Assembly Point Details</span>
        </div>
        
        <StructuredTextField
          label="Assembly Point Location"
          value={data.assemblyLocation}
          onChange={(value) => updateField('assemblyLocation', value)}
          placeholder="e.g., North parking lot, near flagpole"
          required
        />

        <StructuredTextField
          label="Distance from Building"
          value={data.assemblyDistance}
          onChange={(value) => updateField('assemblyDistance', value)}
          placeholder="Feet"
          hint="Must be clear of falling objects and collapse zone"
        />

        <StructuredRadioGroup
          label="Safe from Falling Objects?"
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' }
          ]}
          value={data.assemblySafeFromFalling}
          onChange={(value) => updateField('assemblySafeFromFalling', value)}
          required
        />

        {assemblyUnsafe && (
          <CriticalWarning>
            UNSAFE ASSEMBLY POINT: Location is not safe from falling objects. Crew evacuating TO a hazard zone = secondary casualties. RELOCATE ASSEMBLY POINT.
          </CriticalWarning>
        )}

        <StructuredRadioGroup
          label="Can All Crew Reach in <2 Minutes?"
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' }
          ]}
          value={data.assemblyReachable}
          onChange={(value) => updateField('assemblyReachable', value)}
          required
        />

        {assemblyUnreachable && (
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-yellow-100">
              ASSEMBLY POINT TOO FAR: Crew cannot reach in &lt;2 minutes. During emergency, delayed assembly = headcount confusion. Consider closer location.
            </span>
          </div>
        )}
      </div>

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Emergency Communication Tree</div>
        
        <StructuredTextField
          label="Who Calls 911"
          value={data.whoCalls911}
          onChange={(value) => updateField('whoCalls911', value)}
          placeholder="Name and role"
          hint="Designate specific person, not 'anyone'"
          required
        />

        <StructuredTextField
          label="Who Notifies Site Supervisor"
          value={data.whoNotifiesSupervisor}
          onChange={(value) => updateField('whoNotifiesSupervisor', value)}
          placeholder="Name and role"
        />

        <StructuredTextField
          label="Who Notifies Safety Manager"
          value={data.whoNotifiesSafety}
          onChange={(value) => updateField('whoNotifiesSafety', value)}
          placeholder="Name and role"
        />
      </div>

      <StructuredRadioGroup
        label="Crew Awareness of EAP"
        options={[
          { value: 'today', label: 'All crew briefed on EAP today' },
          { value: 'this-week', label: 'Briefed this week' },
          { value: 'over-week', label: 'Briefed >1 week ago' },
          { value: 'not-briefed', label: 'Not briefed' }
        ]}
        value={data.crewAwareness}
        onChange={(value) => updateField('crewAwareness', value)}
        required
      />

      {crewNotBriefed && (
        <CriticalWarning>
          CREW DOESN'T KNOW PLAN: No EAP briefing = chaos during emergency. BRIEF ALL CREW ON EAP BEFORE STARTING WORK.
        </CriticalWarning>
      )}

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">EAP Drills</div>
        
        <StructuredTextField
          label="Last EAP Drill Conducted"
          value={data.lastDrillDate}
          onChange={(value) => updateField('lastDrillDate', value)}
          placeholder="MM/DD/YYYY"
        />

        <StructuredRadioGroup
          label="Drill Frequency"
          options={[
            { value: 'under-30', label: '<30 days ago (excellent)' },
            { value: '30-90', label: '30-90 days ago (acceptable)' },
            { value: 'over-90-days', label: '>90 days ago' },
            { value: 'never', label: 'Never conducted' }
          ]}
          value={data.drillFrequency}
          onChange={(value) => updateField('drillFrequency', value)}
          required
        />

        {drillStale && (
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-yellow-100">
              STALE DRILL: Last drill over 90 days ago. Crew muscle memory fades = slow/confused response during real emergency.
            </span>
          </div>
        )}

        {neverDrilled && (
          <CriticalWarning>
            UNTESTED PLAN: EAP never practiced. Paper plan ≠ effective response. CONDUCT DRILL TO VALIDATE EAP.
          </CriticalWarning>
        )}
      </div>

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Nearest Hospital Details</div>
        
        <StructuredTextField
          label="Hospital Name"
          value={data.hospitalName}
          onChange={(value) => updateField('hospitalName', value)}
          placeholder="Full hospital name"
          required
        />

        <StructuredTextField
          label="Hospital Address"
          value={data.hospitalAddress}
          onChange={(value) => updateField('hospitalAddress', value)}
          placeholder="Full address for GPS/EMS"
          required
        />

        <StructuredTextField
          label="Drive Time"
          value={data.hospitalDriveTime}
          onChange={(value) => updateField('hospitalDriveTime', value)}
          placeholder="Minutes"
        />

        <StructuredRadioGroup
          label="Trauma Center?"
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' }
          ]}
          value={data.hospitalTraumaCenter}
          onChange={(value) => updateField('hospitalTraumaCenter', value)}
        />
      </div>

      <div className="bg-red-900/30 border border-red-600 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-100">
            <strong>CRITICAL:</strong> OSHA 1926.35 requires written EAP for sites with &gt;10 employees. No written plan = compliance violation.
          </div>
        </div>
      </div>

      {criticalPlanFailure && (
        <CriticalWarning>
          CRITICAL COMPLIANCE FAILURE: No EAP or verbal-only plan. OSHA requires WRITTEN Emergency Action Plan. STOP WORK UNTIL EAP CREATED.
        </CriticalWarning>
      )}

      {planWeakness && !criticalPlanFailure && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-yellow-100">
            EAP READINESS CONCERNS: Crew not briefed, no drills, or unsafe assembly point. Address these issues to improve emergency response effectiveness.
          </span>
        </div>
      )}

      <PhotoHints hints={[
        "Written EAP document (first page)",
        "Assembly point location",
        "Evacuation route signage",
        "Emergency contact numbers posted",
        "Hospital route map"
      ]} />
    </div>
  );
}
