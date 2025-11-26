
import React from 'react';
import AuditActionsManager from '@/components/AuditActions/AuditActionsManager';
import { AuditActionsProvider } from '@/contexts/AuditActionsContext';
import SeoHead from '@/components/SEO/SeoHead';

interface AuditActionsTabProps {
  clientId: string;
  phase?: string;
}

const AuditActionsTab = ({ clientId, phase }: AuditActionsTabProps) => {

  return (
    <AuditActionsProvider>
      <div className="space-y-6">
        <SeoHead title="Revisjonshandlinger" description="Administrer revisjonshandlinger for klient." />
        <h1 className="sr-only">Revisjonshandlinger</h1>
        
        <AuditActionsManager clientId={clientId} phase={phase} />
      </div>
    </AuditActionsProvider>
  );
};

export default AuditActionsTab;
