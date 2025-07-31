import React from 'react';
import { useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import ResponsiveLayout from '@/components/Layout/ResponsiveLayout';
import StandardPageLayout from '@/components/Layout/StandardPageLayout';
import ClientNavigation from '@/components/Clients/ClientDetails/ClientNavigation';
import ClientPageHeader from '@/components/Layout/ClientPageHeader';
import GeneralLedgerUploader from '@/components/Accounting/GeneralLedgerUploader';
import DataReimportUtil from '@/components/Accounting/DataReimportUtil';
import { Skeleton } from '@/components/ui/skeleton';

const GeneralLedgerUpload = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { data: client, isLoading, error } = useClientDetails(clientId || '');

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
          <DataReimportUtil 
            clientId={client.id}
            clientName={client.company_name || 'Ukjent klient'}
          />
          
          <GeneralLedgerUploader 
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

export default GeneralLedgerUpload;