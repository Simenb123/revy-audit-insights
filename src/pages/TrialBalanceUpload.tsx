import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import ResponsiveLayout from '@/components/Layout/ResponsiveLayout';
import StandardPageLayout from '@/components/Layout/StandardPageLayout';
import ClientNavigation from '@/components/Clients/ClientDetails/ClientNavigation';
import ClientPageHeader from '@/components/Layout/ClientPageHeader';
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
      <ResponsiveLayout>
        <StandardPageLayout>
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        </StandardPageLayout>
      </ResponsiveLayout>
    );
  }

  if (error || !client) {
    return (
      <ResponsiveLayout>
        <StandardPageLayout>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Klient ikke funnet</h1>
            <p className="text-muted-foreground">
              Kunne ikke finne klient med ID {clientId}
            </p>
          </div>
        </StandardPageLayout>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <StandardPageLayout 
        header={
          <div className="space-y-0">
            <ClientPageHeader 
              clientName={client.company_name} 
              orgNumber={client.org_number}
            />
            <ClientNavigation />
          </div>
        }
      >
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Saldobalanse opplasting</h1>
          
          <TrialBalanceUploader 
            clientId={client.id}
            onUploadComplete={() => {
              // Could navigate back or show success message
            }}
          />
        </div>
      </StandardPageLayout>
    </ResponsiveLayout>
  );
};

export default TrialBalanceUpload;