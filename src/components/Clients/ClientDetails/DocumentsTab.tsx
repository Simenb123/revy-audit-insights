
import React from 'react';
import { Client } from '@/types/revio';
import ImprovedClientDocumentManager from '@/components/ClientDocuments/ImprovedClientDocumentManager';
import EmbeddedContextChat from '@/components/Revy/EmbeddedContextChat';

interface DocumentsTabProps {
  client: Client;
}

const DocumentsTab = ({ client }: DocumentsTabProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <ImprovedClientDocumentManager 
            clientId={client.id}
            clientName={client.company_name || client.name}
          />
        </div>
        <div className="space-y-6">
          <EmbeddedContextChat
            clientId={client.id}
            clientData={client}
            context="client-detail"
            title="Klient AI-Revi"
            height="400px"
          />
          <EmbeddedContextChat
            clientId={client.id}
            clientData={client}
            context="audit-actions"
            title="Revisjonshandlinger"
            height="300px"
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentsTab;
