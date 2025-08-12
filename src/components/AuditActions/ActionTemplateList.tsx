
import React from 'react';
import { AuditActionTemplate } from '@/types/audit-actions';
import FlexibleActionTemplateList from './FlexibleActionTemplateList';

interface ActionTemplateListProps {
  templates: AuditActionTemplate[];
  selectedArea: string;
  phase?: string;
  onCopyToClient?: (templateIds: string[]) => void;
  onEditTemplate?: (template: AuditActionTemplate) => void;
}

const ActionTemplateList = ({ 
  templates, 
  selectedArea, 
  phase,
  onCopyToClient, 
  onEditTemplate
}: ActionTemplateListProps) => {
  return (
    <FlexibleActionTemplateList
      templates={templates}
      selectedArea={selectedArea}
      phase={phase}
      onCopyToClient={onCopyToClient}
      onEditTemplate={onEditTemplate}
    />
  );
};

export default ActionTemplateList;
