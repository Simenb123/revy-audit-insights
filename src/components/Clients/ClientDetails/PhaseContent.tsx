
import React, { useState } from 'react';
import { Client } from '@/types/revio';
import AuditActionsManager from '@/components/AuditActions/AuditActionsManager';
import { PlanningContainer } from './Planning/PlanningContainer';
import Overview from './ClientDashboard/Overview';
import ImprovedClientDocumentManager from '@/components/ClientDocuments/ImprovedClientDocumentManager';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

type Phase = 'engagement' | 'planning' | 'execution' | 'completion' | 'reporting' | 'overview' | 'risk_assessment';

interface PhaseContentProps {
  phase: Phase;
  client: Client | null;
}

export const PhaseContent: React.FC<PhaseContentProps> = ({ phase, client }) => {
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  
  console.log('🔍 [PHASE_CONTENT] Rendered with:', {
    phase,
    client: client ? {
      id: client.id,
      name: client.name,
      company_name: client.company_name,
      org_number: client.org_number,
      idType: typeof client.id,
      idLength: client.id?.length,
      isValidId: !!(client.id && client.id.trim() !== '' && client.id !== 'undefined' && client.id !== 'null')
    } : null
  });

  if (!client) {
    console.log('⚠️ [PHASE_CONTENT] No client provided - showing skeleton');
    return (
      <div className="p-8 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  // Enhanced validation that we have a proper client ID
  if (!client.id || client.id.trim() === '' || client.id === 'undefined' || client.id === 'null') {
    console.error('❌ [PHASE_CONTENT] Client ID is missing, empty, or invalid:', {
      clientId: client.id,
      clientIdType: typeof client.id,
      orgNumber: client.org_number,
      name: client.name,
      company_name: client.company_name
    });
    
    return (
      <div className="p-8">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Klient-ID mangler eller er ugyldig. ID: "{client.id}" (type: {typeof client.id}). 
            Prøv å oppdatere siden eller gå tilbake til klientoversikten.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Use the client documents hook with enhanced logging
  const { documents, isLoading: documentsLoading } = useClientDocuments(client.id);

  console.log('📄 [PHASE_CONTENT] Documents loaded with validated client ID:', {
    clientId: client.id,
    clientIdValid: true,
    documentsCount: documents.length,
    isLoading: documentsLoading
  });

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
                {documentsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-48 w-full" />
                  </div>
                ) : (
                  <ImprovedClientDocumentManager 
                    clientId={client.id}
                    clientName={client.company_name || client.name}
                  />
                )}
              </div>
            </div>

            <Dialog open={showDocumentUpload} onOpenChange={setShowDocumentUpload}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Last opp regnskapsdata</DialogTitle>
                </DialogHeader>
                <ImprovedClientDocumentManager 
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
