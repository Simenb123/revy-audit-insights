import { logger } from '@/utils/logger';

import React from 'react';
import { useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { Skeleton } from '@/components/ui/skeleton';
import AccountingDataUploader from '@/components/Accounting/AccountingDataUploader';
import ClientBreadcrumb from '@/components/Clients/ClientDetails/ClientBreadcrumb';

const AccountingData = () => {
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const { data: client, isLoading, error } = useClientDetails(orgNumber || '');

  logger.log('AccountingData - orgNumber:', orgNumber);
  logger.log('AccountingData - client:', client);
  logger.log('AccountingData - isLoading:', isLoading);
  logger.log('AccountingData - error:', error);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    logger.error('Error loading client:', error);
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Feil ved lasting av klient</h1>
        <p className="text-gray-600">
          Det oppstod en feil: {error.message}
        </p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Klient ikke funnet</h1>
        <p className="text-gray-600">
          Kunne ikke finne klient med organisasjonsnummer {orgNumber}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ClientBreadcrumb client={client} />
      
      <AccountingDataUploader 
        clientId={client.id}
        clientName={client.name}
      />
    </div>
  );
};

export default AccountingData;
