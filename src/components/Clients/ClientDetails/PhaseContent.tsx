
import React, { useState } from 'react';
import { Client } from '@/types/revio';
import AuditActionsManager from '@/components/AuditActions/AuditActionsManager';
import { PlanningContainer } from './Planning/PlanningContainer';
import Overview from './ClientDashboard/Overview';
import ClientDocumentManager from '@/components/ClientDocuments/ClientDocumentManager';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Phase = 'engagement' | 'planning' | 'execution' | 'completion' | 'reporting' | 'overview' | 'risk_assessment';

interface PhaseContentProps {
  phase: Phase;
  client: Client | null;
}

export const PhaseContent: React.FC<PhaseContentProps> = ({ phase, client }) => {
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  
  if (!client) {
    return <div>Laster klient...</div>;
  }

  const { documents } = useClientDocuments(client.id);

  const renderContent = () => {
    switch (phase) {
      case 'overview':
        return (
          <div className="p-8 space-y-6">
            <h2 className="text-2xl font-semibold mb-6">Klientoversikt</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Overview
                  documentCount={documents.length}
                  nextAuditDeadline="31. desember 2024"
                  lastAccountingFile={{
                    name: "Saldobalanse_2024.xlsx",
                    importDate: "15. november 2024"
                  }}
                  onUploadClick={() => setShowDocumentUpload(true)}
                />
              </div>
              
              <div className="lg:col-span-2">
                <ClientDocumentManager 
                  clientId={client.id}
                  clientName={client.company_name || client.name}
                />
              </div>
            </div>

            <Dialog open={showDocumentUpload} onOpenChange={setShowDocumentUpload}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Last opp regnskapsdata</DialogTitle>
                </DialogHeader>
                <ClientDocumentManager 
                  clientId={client.id}
                  clientName={client.company_name || client.name}
                />
              </DialogContent>
            </Dialog>
          </div>
        );
      case 'planning':
        return <PlanningContainer client={client} />;
      case 'execution':
        return <AuditActionsManager clientId={client.id} phase="execution" />;
      case 'completion':
        return <AuditActionsManager clientId={client.id} phase="completion" />;
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
