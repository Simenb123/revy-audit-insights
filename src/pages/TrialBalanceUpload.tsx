import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import ResponsiveLayout from '@/components/Layout/ResponsiveLayout';
import StandardPageLayout from '@/components/Layout/StandardPageLayout';
import ClientBreadcrumb from '@/components/Clients/ClientDetails/ClientBreadcrumb';
import ClientNavigation from '@/components/Clients/ClientDetails/ClientNavigation';
import FiscalYearSelector from '@/components/Layout/FiscalYearSelector';
import TrialBalanceUploader from '@/components/Accounting/TrialBalanceUploader';
import { Skeleton } from '@/components/ui/skeleton';

const TrialBalanceUpload = () => {
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
              Kunne ikke finne klient med organisasjonsnummer {orgNumber}
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
          <div className="space-y-4">
            <ClientBreadcrumb client={client} />
            <ClientNavigation />
          </div>
        }
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Saldobalanse opplasting</h1>
            <FiscalYearSelector clientName={client.company_name} />
          </div>
          
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