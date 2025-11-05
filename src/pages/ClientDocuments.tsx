import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import ClientDocumentManager from '@/components/ClientDocuments/ClientDocumentManager';
import { logger } from '@/utils/logger';
import PageLayout from '@/components/Layout/PageLayout';
import { usePageTitle } from '@/components/Layout/PageTitleContext';

const ClientDocuments = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { data: client, isLoading, error } = useClientDetails(clientId || '');
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    if (client) {
      setPageTitle(`Dokumenter: ${client.company_name || client.name}`);
    } else {
      setPageTitle('Dokumenter');
    }
  }, [client, setPageTitle]);

  logger.log('📄 [CLIENT_DOCUMENTS] Page rendered', {
    clientId,
    hasClient: !!client,
    isLoading,
    error: error?.message
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laster klientdata...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center text-red-600">
          <p className="text-lg font-medium mb-2">Kunne ikke laste klient</p>
          <p className="text-sm text-muted-foreground">
            {error?.message || 'Klient ikke funnet'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageLayout width="wide" spacing="normal">
      <ClientDocumentManager
        clientId={client.id}
        clientName={client.company_name || client.name}
        enableAI
      />
    </PageLayout>
  );
};

export default ClientDocuments;