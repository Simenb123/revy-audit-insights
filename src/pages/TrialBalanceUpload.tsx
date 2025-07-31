import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import StickyClientLayout from '@/components/Layout/StickyClientLayout';
import ClientNavigation from '@/components/Clients/ClientDetails/ClientNavigation';
import TrialBalanceUploader from '@/components/Accounting/TrialBalanceUploader';
import { Skeleton } from '@/components/ui/skeleton';

const TrialBalanceUpload = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { data: client, isLoading, error } = useClientDetails(clientId || '');
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
            Kunne ikke finne klient med ID {clientId}
          </p>
        </div>
      </div>
    );
  }

  return (
    <StickyClientLayout
      clientName={client.company_name}
      orgNumber={client.org_number}
    >
      <ClientNavigation />
      
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold">Saldobalanse opplasting</h1>
        
        <TrialBalanceUploader 
          clientId={client.id}
          onUploadComplete={() => {
            // Could navigate back or show success message
          }}
        />
      </div>
    </StickyClientLayout>
  );
};

export default TrialBalanceUpload;