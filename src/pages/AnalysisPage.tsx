import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import StickyClientLayout from '@/components/Layout/StickyClientLayout';
import ClientNavigation from '@/components/Clients/ClientDetails/ClientNavigation';
import AccountingExplorer from '@/components/DataAnalysis/AccountingExplorer';
import { Skeleton } from '@/components/ui/skeleton';

const AnalysisPage = () => {
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const { data: client, isLoading, error } = useClientDetails(orgNumber || '');
  const { setSelectedClientId } = useFiscalYear();

  // Set the selected client ID when client data is loaded
  useEffect(() => {
    if (client?.id) {
      setSelectedClientId(client.id);
    }
  }, [client?.id, setSelectedClientId]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Klient ikke funnet</h1>
          <p className="text-muted-foreground">
            Kunne ikke finne klient med organisasjonsnummer {orgNumber}
          </p>
        </div>
      </div>
    );
  }

  return (
    <StickyClientLayout
      clientName={client.company_name || client.name}
      orgNumber={client.org_number}
      pageTitle="Dataanalyse"
    >
      <div className="flex flex-col h-full">
        <ClientNavigation />
        
        <div className="flex-1 overflow-auto">
          <div className="space-y-6 p-6">
            <div>
              <p className="text-muted-foreground">
                Utforsk hovedbok, saldobalanse og regnskapstransaksjoner for {client.name}
              </p>
            </div>
            
            <AccountingExplorer clientId={client.id} />
          </div>
        </div>
      </div>
    </StickyClientLayout>
  );
};

export default AnalysisPage;