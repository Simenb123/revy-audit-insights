import React from 'react';
import { useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import GlobalLayoutContainer from '@/components/Layout/GlobalLayoutContainer';
import ClientBreadcrumb from '@/components/Clients/ClientDetails/ClientBreadcrumb';
import ImprovedAccountingDataUploader from '@/components/Accounting/ImprovedAccountingDataUploader';
import { Skeleton } from '@/components/ui/skeleton';

const AccountingDataUpload = () => {
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const { data: client, isLoading, error } = useClientDetails(orgNumber || '');

  if (isLoading) {
    return (
      <GlobalLayoutContainer maxWidth="full">
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </GlobalLayoutContainer>
    );
  }

  if (error || !client) {
    return (
      <GlobalLayoutContainer maxWidth="full">
        <div className="p-6 text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Klient ikke funnet</h1>
          <p className="text-gray-600">
            Kunne ikke finne klient med organisasjonsnummer {orgNumber}
          </p>
        </div>
      </GlobalLayoutContainer>
    );
  }

  return (
    <GlobalLayoutContainer maxWidth="full">
      <div className="p-6 space-y-6">
        <ClientBreadcrumb client={client} />
        
        <ImprovedAccountingDataUploader 
          clientId={client.id}
          clientName={client.name}
        />
      </div>
    </GlobalLayoutContainer>
  );
};

export default AccountingDataUpload;