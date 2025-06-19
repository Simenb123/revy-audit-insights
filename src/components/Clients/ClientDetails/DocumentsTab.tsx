
import React from 'react';
import { Client } from '@/types/revio';
import ClientDocumentManager from '@/components/ClientDocuments/ClientDocumentManager';

interface DocumentsTabProps {
  client: Client;
}

const DocumentsTab = ({ client }: DocumentsTabProps) => {
  return (
    <div className="space-y-6">
      <ClientDocumentManager 
        clientId={client.id}
        clientName={client.company_name || client.name}
      />
    </div>
  );
};

export default DocumentsTab;
