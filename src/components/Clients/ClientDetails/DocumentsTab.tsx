
import React from 'react';
import { Client } from '@/types/revio';
import ImprovedClientDocumentManager from '@/components/ClientDocuments/ImprovedClientDocumentManager';

interface DocumentsTabProps {
  client: Client;
}

const DocumentsTab = ({ client }: DocumentsTabProps) => {
  console.log('📋 [DOCUMENTS_TAB] Client data:', {
    id: client.id,
    name: client.company_name || client.name,
    orgNumber: client.org_number
  });
  
  // Ensure we have a valid client ID
  if (!client.id) {
    console.error('❌ [DOCUMENTS_TAB] No client ID available');
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-2">Feil: Mangler klient-ID</div>
        <p className="text-gray-600">Kunne ikke laste dokumenter uten gyldig klient-ID.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">📄 Dokumenthåndtering</h3>
        <p className="text-blue-700 text-sm">
          Dokumenter lastet opp her vil automatisk bli analysert av AI-Revi for bedre assistanse.
          AI kan nå lese og forstå innholdet i PDF-er og andre dokumenter.
        </p>
      </div>
      
      <ImprovedClientDocumentManager 
        clientId={client.id}
        clientName={client.company_name || client.name}
      />
    </div>
  );
};

export default DocumentsTab;
