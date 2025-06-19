
import React from 'react';
import { Client } from '@/types/revio';
import ImprovedClientDocumentManager from '@/components/ClientDocuments/ImprovedClientDocumentManager';

interface DocumentsTabProps {
  client: Client;
}

const DocumentsTab = ({ client }: DocumentsTabProps) => {
  return (
    <div className="space-y-6">
      <ImprovedClientDocumentManager 
        clientId={client.id}
        clientName={client.company_name || client.name}
      />
    </div>
  );
};

export default DocumentsTab;
