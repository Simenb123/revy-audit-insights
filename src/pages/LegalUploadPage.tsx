import React from 'react';
import { useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import StickyClientLayout from '@/components/Layout/StickyClientLayout';
import UniversalUploader from '@/components/Upload/UniversalUploader';
import { getUploadConfig } from '@/config/uploadTypes';
import { ProcessingResult } from '@/types/upload';
import { toast } from 'sonner';

const LegalUploadPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { data: client, isLoading } = useClientDetails(clientId || '');
  const { setSelectedClientId } = useFiscalYear();
  
  // Set fiscal year context when client loads  
  React.useEffect(() => {
    if (client?.id) {
      setSelectedClientId(client.id);
    }
  }, [client?.id, setSelectedClientId]);

  const config = getUploadConfig('legal-documents');

  const handleUploadComplete = (result: ProcessingResult) => {
    if (result.success) {
      toast.success('Juridiske dokumenter opplastet!');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!client || !config) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Feil</h1>
          <p className="text-muted-foreground">
            {!client ? `Kunne ikke finne klient med ID ${clientId}` : 'Upload-konfigurasjon ikke funnet'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <StickyClientLayout
      clientName={client.company_name || client.name}
      orgNumber={client.org_number}
      pageTitle="Juridiske dokumenter"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <UniversalUploader
              config={config}
              clientId={client.id}
              onComplete={handleUploadComplete}
            />
          </div>
        </div>
      </div>
    </StickyClientLayout>
  );
};

export default LegalUploadPage;