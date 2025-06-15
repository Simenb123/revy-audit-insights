
import React from 'react';
import AuditActionsManager from '@/components/AuditActions/AuditActionsManager';
import AIEnabledActionEditor from '@/components/AuditActions/AIEnabledActionEditor';
import { Separator } from '@/components/ui/separator';

interface AuditActionsTabProps {
  clientId: string;
  phase?: string;
}

const AuditActionsTab = ({ clientId, phase }: AuditActionsTabProps) => {
  return (
    <div className="space-y-6">
      <AIEnabledActionEditor clientId={clientId} />
      
      <Separator className="my-8" />

      <div className="text-center py-4">
        <h2 className="text-2xl font-bold text-gray-900">Revisjonshandlinger</h2>
        <p className="text-gray-600 mt-2">
          Administrer revisjonshandlinger etter fagområde
        </p>
      </div>
      
      <AuditActionsManager clientId={clientId} phase={phase} />
    </div>
  );
};

export default AuditActionsTab;
