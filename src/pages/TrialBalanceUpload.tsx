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
      <StickyClientLayout
        clientName="Laster..."
        orgNumber=""
        pageTitle="Saldobalanse opplasting"
      >
        <div className="p-6">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </StickyClientLayout>
    );
  }

  if (error || !client) {
    return (
      <StickyClientLayout
        clientName="Feil"
        orgNumber=""
        pageTitle="Saldobalanse opplasting"
      >
        <div className="p-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Klient ikke funnet</h1>
            <p className="text-muted-foreground">
              Kunne ikke finne klient med ID {clientId}
            </p>
            {error && (
              <p className="text-sm text-destructive mt-2">
                Feil: {error.message}
              </p>
            )}
          </div>
        </div>
      </StickyClientLayout>
    );
  }

  return (
    <StickyClientLayout
      clientName={client.company_name}
      orgNumber={client.org_number}
      pageTitle="Saldobalanse opplasting"
    >
      <div className="flex flex-col h-full">
        {/* Navigation handled by layout */}
        
        <div className="flex-1 overflow-auto">
          <div className="space-y-6 p-6">
            {client?.id ? (
              <TrialBalanceUploader 
                clientId={client.id}
                onUploadComplete={() => {
                  // Could navigate back or show success message
                }}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Ugyldig klient-ID. Kan ikke fortsette med opplasting.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </StickyClientLayout>
  );
};

export default TrialBalanceUpload;