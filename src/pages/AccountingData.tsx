
import { logger } from '@/utils/logger';

import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { Skeleton } from '@/components/ui/skeleton';
import StickyClientLayout from '@/components/Layout/StickyClientLayout';
import ClientNavigation from '@/components/Clients/ClientDetails/ClientNavigation';
import RegnskapsDataManager from '@/components/Accounting/RegnskapsDataManager';

const AccountingData = () => {
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const { data: client, isLoading, error } = useClientDetails(orgNumber || '');
  const { setSelectedClientId } = useFiscalYear();

  // Set the selected client ID when client data is loaded
  useEffect(() => {
    if (client?.id) {
      setSelectedClientId(client.id);
    }
  }, [client?.id, setSelectedClientId]);

  logger.log('AccountingData - orgNumber:', orgNumber);
  logger.log('AccountingData - client:', client);
  logger.log('AccountingData - isLoading:', isLoading);
  logger.log('AccountingData - error:', error);

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

  if (error) {
    logger.error('Error loading client:', error);
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Feil ved lasting av klient</h1>
          <p className="text-muted-foreground">
            Det oppstod en feil: {error.message}
          </p>
        </div>
      </div>
    );
  }

  if (!client) {
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
      pageTitle="Regnskapsdata"
    >
      <ClientNavigation />
      
      <div className="space-y-6 p-6">
        <RegnskapsDataManager
          clientId={client.id}
          clientName={client.name}
        />
      </div>
    </StickyClientLayout>
  );
};

export default AccountingData;
