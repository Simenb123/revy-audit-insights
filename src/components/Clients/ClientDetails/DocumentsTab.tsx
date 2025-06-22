
import React from 'react';
import { Client } from '@/types/revio';
import ImprovedClientDocumentManager from '@/components/ClientDocuments/ImprovedClientDocumentManager';

interface DocumentsTabProps {
  client: Client;
}

const DocumentsTab = ({ client }: DocumentsTabProps) => {
  console.log('📋 [DOCUMENTS_TAB] Component rendered with client:', {
    id: client?.id,
    name: client?.company_name || client?.name,
    orgNumber: client?.org_number,
    hasValidId: !!(client?.id && client.id !== 'undefined' && client.id !== 'null')
  });
  
  // Enhanced validation for client ID
  if (!client || !client.id || client.id === 'undefined' || client.id === 'null') {
    console.error('❌ [DOCUMENTS_TAB] Invalid client data:', {
      hasClient: !!client,
      clientId: client?.id,
      clientIdType: typeof client?.id
    });
    
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-2">⚠️ Feil: Ugyldig klient-data</div>
        <p className="text-gray-600">
          Kunne ikke laste dokumenter. Klient-ID mangler eller er ugyldig.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Last siden på nytt eller kontakt support hvis problemet vedvarer.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          🤖 AI-Drevet Dokumenthåndtering
        </h3>
        <div className="text-blue-700 text-sm space-y-1">
          <p>• Dokumenter analyseres automatisk av avansert AI-teknologi</p>
          <p>• AI-Revi kan nå lese, forstå og analysere PDF-innhold i detalj</p>
          <p>• Få intelligente svar basert på dine dokumenter</p>
        </div>
      </div>
      
      <ImprovedClientDocumentManager 
        clientId={client.id}
        clientName={client.company_name || client.name}
      />
    </div>
  );
};

export default DocumentsTab;
