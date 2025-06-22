
import React from 'react';
import { AuditActionTemplate } from '@/types/audit-actions';
import FlexibleActionTemplateList from './FlexibleActionTemplateList';

interface ActionTemplateListProps {
  templates: AuditActionTemplate[];
  selectedArea: string;
  onCopyToClient?: (templateIds: string[]) => void;
  onEditTemplate?: (template: AuditActionTemplate) => void;
}

const ActionTemplateList = ({ 
  templates, 
  selectedArea, 
  onCopyToClient, 
  onEditTemplate
}: ActionTemplateListProps) => {
  return (
    <FlexibleActionTemplateList
      templates={templates}
      selectedArea={selectedArea}
      onCopyToClient={onCopyToClient}
      onEditTemplate={onEditTemplate}
    />
  );
};

export default ActionTemplateList;
