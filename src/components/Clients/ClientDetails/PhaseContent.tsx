
import React from 'react';
import { Client } from '@/types/revio';
import AuditActionsManager from '@/components/AuditActions/AuditActionsManager';
import { PlanningContainer } from './Planning/PlanningContainer';

type Phase = 'engagement' | 'planning' | 'execution' | 'completion' | 'reporting';

interface PhaseContentProps {
  phase: Phase;
  client: Client | null;
}

export const PhaseContent: React.FC<PhaseContentProps> = ({ phase, client }) => {
  if (!client) {
    // TODO: Add a proper loading skeleton here
    return <div>Laster klient...</div>;
  }

  const renderContent = () => {
    switch (phase) {
      case 'planning':
        return <PlanningContainer client={client} />;
      case 'execution':
        return <AuditActionsManager client={client} phase="execution" />;
      case 'completion':
        return <AuditActionsManager client={client} phase="completion" />;
      default:
        return (
          <div className="p-8">
            <h2 className="text-xl font-semibold">Fase: {phase}</h2>
            <p>Innhold for denne fasen er under utvikling.</p>
          </div>
        );
    }
  };

  return <div className="bg-gray-50 flex-1">{renderContent()}</div>;
};
