import React from 'react';
import { useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import ResponsiveLayout from '@/components/Layout/ResponsiveLayout';
import StandardPageLayout from '@/components/Layout/StandardPageLayout';
import ClientBreadcrumb from '@/components/Clients/ClientDetails/ClientBreadcrumb';
import ClientNavigation from '@/components/Clients/ClientDetails/ClientNavigation';
import GeneralLedgerUploader from '@/components/Accounting/GeneralLedgerUploader';
import DataReimportUtil from '@/components/Accounting/DataReimportUtil';
import { Skeleton } from '@/components/ui/skeleton';

const GeneralLedgerUpload = () => {
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const { data: client, isLoading, error } = useClientDetails(orgNumber || '');

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