
import React from 'react';
import { AuditActionTemplate } from '@/types/audit-actions';
import FlexibleActionTemplateList from './FlexibleActionTemplateList';

interface ActionTemplateListProps {
  templates: AuditActionTemplate[];
  phase?: string;
  onCopyToClient?: (templateIds: string[]) => void;
  onEditTemplate?: (template: AuditActionTemplate) => void;
}

const ActionTemplateList = ({ 
  templates, 
  phase,
  onCopyToClient, 
  onEditTemplate
}: ActionTemplateListProps) => {
  return (
    <FlexibleActionTemplateList
      templates={templates}
      phase={phase}
      onCopyToClient={onCopyToClient}
      onEditTemplate={onEditTemplate}
    />
  );
};

export default ActionTemplateList;
