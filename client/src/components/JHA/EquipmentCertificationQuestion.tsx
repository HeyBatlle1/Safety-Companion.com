import { ClipboardCheck, AlertCircle } from 'lucide-react';
import { StructuredCheckboxGroup, StructuredTextField, StructuredRadioGroup, PhotoHints, AgentNote, CriticalWarning } from './StructuredQuestionComponents';

export interface EquipmentCertificationData {
  lastInspectionDate: string;
  inspectionType: string[];
  inspectorName: string;
  inspectorCredentials: string[];
  nextInspectionDue: string;
  craneSerial: string;
  boomSerial: string;
  riggingSerial: string;
  riggingInspectionFrequency: string[];
  riggingInspector: string;
  inspectionFindings: string[];
  defectDescription: string;
  lastLoadTestDate: string;
  testCapacity: string;
  testResult: string;
  harnessesCertified: string;
  lanyardsCertified: string;
  anchorageCertified: string;
}

interface EquipmentCertificationQuestionProps {
  data: EquipmentCertificationData;
  onChange: (data: EquipmentCertificationData) => void;
}

export function EquipmentCertificationQuestion({ data, onChange }: EquipmentCertificationQuestionProps) {
  const updateField = (field: keyof EquipmentCertificationData, value: string | string[]) => {
    onChange({ ...data, [field]: value });
  };

  const noRegularInspection = data.riggingInspectionFrequency.includes('no-regular');
  const notDocumented = data.inspectionFindings.includes('not-documented');
  const majorIssues = data.inspectionFindings.includes('major-issues');
  const testFailed = data.testResult === 'failed';
  const noHarnessCert = data.harnessesCertified === 'no';
  const noLanyardCert = data.lanyardsCertified === 'no';
  const noAnchorageCert = data.anchorageCertified === 'no';

  // Check if inspection is expired (compare dates only, not time)
  const isInspectionExpired = () => {
    if (!data.nextInspectionDue) return false;
    const dueDate = new Date(data.nextInspectionDue);
    const today = new Date();
    // Zero out time components to compare dates only
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  return (
    <div className="space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center space-x-2 text-blue-400 font-semibold">
        <ClipboardCheck className="w-5 h-5" />
        <span>EQUIPMENT CERTIFICATION & INSPECTION RECORDS</span>
      </div>

      <CriticalWarning>
        OSHA 1926.1412 requires annual crane inspection by qualified person. Expired certs = AUTOMATIC NO-GO decision.
      </CriticalWarning>

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Crane/Lift Equipment Certification</div>
        
        <StructuredTextField
          label="Last Inspection Date"
          value={data.lastInspectionDate}
          onChange={(value) => updateField('lastInspectionDate', value)}
          placeholder="MM/DD/YYYY"
          required
        />

        <StructuredCheckboxGroup
          label="Inspection Type"
          options={[
            { value: 'annual', label: 'Annual' },
            { value: 'quarterly', label: 'Quarterly' },
            { value: 'pre-use', label: 'Pre-use' }
          ]}
          selectedValues={data.inspectionType}
          onChange={(value) => updateField('inspectionType', value)}
          required
        />

        <StructuredTextField
          label="Inspector Name"
          value={data.inspectorName}
          onChange={(value) => updateField('inspectorName', value)}
          placeholder="Full name"
          required
        />

        <StructuredCheckboxGroup
          label="Inspector Credentials"
          options={[
            { value: 'nccco', label: 'NCCCO' },
            { value: 'manufacturer', label: 'Manufacturer' },
            { value: 'competent-person', label: 'Competent Person (company)' }
          ]}
          selectedValues={data.inspectorCredentials}
          onChange={(value) => updateField('inspectorCredentials', value)}
          required
        />

        <StructuredTextField
          label="Next Inspection Due"
          value={data.nextInspectionDue}
          onChange={(value) => updateField('nextInspectionDue', value)}
          placeholder="MM/DD/YYYY"
          required
        />

        {isInspectionExpired() && (
          <CriticalWarning>
            INSPECTION EXPIRED! Next inspection was due on {data.nextInspectionDue}. STOP - equipment must be re-inspected before use.
          </CriticalWarning>
        )}
      </div>

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Equipment Serial/ID Numbers</div>
        
        <StructuredTextField
          label="Crane ID"
          value={data.craneSerial}
          onChange={(value) => updateField('craneSerial', value)}
          placeholder="Serial or ID number"
          required
        />

        <StructuredTextField
          label="Boom/Lift ID"
          value={data.boomSerial}
          onChange={(value) => updateField('boomSerial', value)}
          placeholder="Serial or ID number"
        />

        <StructuredTextField
          label="Rigging ID"
          value={data.riggingSerial}
          onChange={(value) => updateField('riggingSerial', value)}
          placeholder="Serial or ID number"
        />
      </div>

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Rigging Inspection</div>
        
        <StructuredCheckboxGroup
          label="Rigging Inspection Frequency"
          options={[
            { value: 'before-each-use', label: 'Inspected before each use (OSHA required)' },
            { value: 'weekly', label: 'Inspected weekly' },
            { value: 'monthly', label: 'Inspected monthly' },
            { value: 'no-regular', label: 'No regular inspection' }
          ]}
          selectedValues={data.riggingInspectionFrequency}
          onChange={(value) => updateField('riggingInspectionFrequency', value)}
          required
        />

        {noRegularInspection && (
          <CriticalWarning>
            NO REGULAR INSPECTION = OSHA COMPLIANCE VIOLATION. Rigging must be inspected before each use per OSHA 1926.251.
          </CriticalWarning>
        )}

        <StructuredTextField
          label="Inspector for Rigging (Competent Person?)"
          value={data.riggingInspector}
          onChange={(value) => updateField('riggingInspector', value)}
          placeholder="Name + competent person status"
          hint="Must be designated Competent Person"
          required
        />
      </div>

      <StructuredCheckboxGroup
        label="Inspection Findings (Any defects?)"
        options={[
          { value: 'all-passed', label: 'All equipment passed inspection' },
          { value: 'minor-issues', label: 'Minor issues (corrected before use)' },
          { value: 'major-issues', label: 'Major issues found' },
          { value: 'not-documented', label: 'Not documented' }
        ]}
        selectedValues={data.inspectionFindings}
        onChange={(value) => updateField('inspectionFindings', value)}
        required
      />

      {majorIssues && (
        <StructuredTextField
          label="Major Issues Description"
          value={data.defectDescription}
          onChange={(value) => updateField('defectDescription', value)}
          placeholder="Describe the major issues found"
          required
        />
      )}

      {notDocumented && (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-yellow-100">
            "Up to date" without dates = Agent 1 flags as insufficient response. Documentation required.
          </span>
        </div>
      )}

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Load Testing (if applicable)</div>
        
        <StructuredTextField
          label="Last Load Test Date"
          value={data.lastLoadTestDate}
          onChange={(value) => updateField('lastLoadTestDate', value)}
          placeholder="MM/DD/YYYY or N/A"
        />

        <StructuredTextField
          label="Test Capacity"
          value={data.testCapacity}
          onChange={(value) => updateField('testCapacity', value)}
          placeholder="Test weight in lbs"
        />

        <StructuredRadioGroup
          label="Test Result"
          options={[
            { value: 'passed', label: 'Passed' },
            { value: 'failed', label: 'Failed' },
            { value: 'not-tested', label: 'Not tested' }
          ]}
          value={data.testResult}
          onChange={(value) => updateField('testResult', value)}
        />

        {testFailed && (
          <CriticalWarning>
            LOAD TEST FAILED - Equipment cannot be used until repaired and re-tested. AUTOMATIC NO-GO.
          </CriticalWarning>
        )}
      </div>

      <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
        <div className="text-sm font-medium text-gray-300">Fall Protection Equipment Certifications</div>
        
        <StructuredRadioGroup
          label="Harnesses Certified"
          options={[
            { value: 'yes', label: 'Yes (attach cert photo)' },
            { value: 'no', label: 'No' }
          ]}
          value={data.harnessesCertified}
          onChange={(value) => updateField('harnessesCertified', value)}
          required
        />

        <StructuredRadioGroup
          label="Lanyards Certified"
          options={[
            { value: 'yes', label: 'Yes (attach cert photo)' },
            { value: 'no', label: 'No' }
          ]}
          value={data.lanyardsCertified}
          onChange={(value) => updateField('lanyardsCertified', value)}
          required
        />

        <StructuredRadioGroup
          label="Anchorage Certified (by engineer)"
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' }
          ]}
          value={data.anchorageCertified}
          onChange={(value) => updateField('anchorageCertified', value)}
          required
        />

        {(noHarnessCert || noLanyardCert || noAnchorageCert) && (
          <CriticalWarning>
            UNCERTIFIED FALL PROTECTION EQUIPMENT - Cannot verify safety. Obtain certifications before use.
          </CriticalWarning>
        )}
      </div>

      <PhotoHints hints={[
        "Inspection tags on equipment (dates visible)",
        "Certification documents",
        "Crane nameplate (serial number)",
        "Load chart placard",
        "Inspector's credentials (if available)"
      ]} />
    </div>
  );
}
