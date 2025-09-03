import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { checklistData } from '../components/checklist/checklistData';
import EnterpriseChecklistForm from '../components/checklist/EnterpriseChecklistForm';

const ChecklistView: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();

  // Validate templateId
  if (!templateId || !checklistData[templateId]) {
    
    return <Navigate to="/checklists" replace />;
  }

  const template = checklistData[templateId];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      <EnterpriseChecklistForm templateId={templateId} />
    </div>
  );
};

export default ChecklistView;