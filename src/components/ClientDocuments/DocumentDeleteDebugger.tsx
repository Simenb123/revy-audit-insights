
import React, { useEffect } from 'react';
import { useClientDocuments } from '@/hooks/useClientDocuments';

interface DocumentDeleteDebuggerProps {
  clientId: string;
}

const DocumentDeleteDebugger = ({ clientId }: DocumentDeleteDebuggerProps) => {
  const { documents, deleteDocument } = useClientDocuments(clientId);

  useEffect(() => {
    console.log('=== DOCUMENT DELETE DEBUGGER ===');
    console.log('Current documents:', documents);
    console.log('Delete function available:', !!deleteDocument);
    console.log('Client ID:', clientId);
  }, [documents, deleteDocument, clientId]);

  const handleTestDelete = (documentId: string) => {
    console.log('=== ATTEMPTING DOCUMENT DELETE ===');
    console.log('Document ID:', documentId);
    console.log('Delete mutation pending:', deleteDocument.isPending);
    
    try {
      deleteDocument.mutate(documentId);
    } catch (error) {
      console.error('Delete error caught:', error);
    }
  };

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h4 className="font-medium text-yellow-900 mb-2">Debug Info</h4>
      <div className="text-sm text-yellow-800 space-y-1">
        <p>Dokumenter funnet: {documents.length}</p>
        <p>Delete funksjon: {deleteDocument ? 'Tilgjengelig' : 'Ikke tilgjengelig'}</p>
        <p>Client ID: {clientId}</p>
        {deleteDocument.error && (
          <p className="text-red-600">
            Delete error: {deleteDocument.error.message}
          </p>
        )}
      </div>
    </div>
  );
};

export default DocumentDeleteDebugger;
