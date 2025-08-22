import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight, FileText, Scale, Book, Loader2 } from 'lucide-react';
import type { LegalDocument, DocumentNodeType } from '@/types/legal-knowledge';
import { useLegalDocuments, useLegalDocumentTypes } from '@/hooks/knowledge/useLegalDocuments';

interface SelectorsProps {
  sourceDocType: DocumentNodeType;
  targetDocType: DocumentNodeType;
  selectedDocuments: {
    source?: LegalDocument;
    target?: LegalDocument;
  };
  demoMode: boolean;
  onDocTypeChange: (type: 'source' | 'target', docType: DocumentNodeType) => void;
  onDocumentSelect: (type: 'source' | 'target', document: LegalDocument) => void;
  onSwapDirection: () => void;
}

// Mock data for demo mode (fallback)
const MOCK_DOCUMENTS: Record<DocumentNodeType, LegalDocument[]> = {
  lov: [
    {
      id: 'rskl-1998',
      title: 'Lov om årsregnskap m.v. (regnskapsloven)',
      document_type_id: 'lov',
      document_number: 'LOV-1998-07-17-56',
      content: 'Regnskapslovens innhold...',
      document_status: 'active',
      is_primary_source: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
  ],
  forskrift: [],
  dom: [],
  rundskriv: [],
  forarbeid: [],
  ukjent: [],
};

const DOC_TYPE_OPTIONS: Array<{ 
  value: DocumentNodeType; 
  label: string; 
  icon: React.ReactNode;
  color: string;
}> = [
  { value: 'lov', label: 'Lov', icon: <Scale className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
  { value: 'forskrift', label: 'Forskrift', icon: <FileText className="h-4 w-4" />, color: 'bg-green-100 text-green-800' },
  { value: 'dom', label: 'Dom', icon: <Book className="h-4 w-4" />, color: 'bg-purple-100 text-purple-800' },
  { value: 'rundskriv', label: 'Rundskriv', icon: <FileText className="h-4 w-4" />, color: 'bg-orange-100 text-orange-800' },
  { value: 'forarbeid', label: 'Forarbeid', icon: <FileText className="h-4 w-4" />, color: 'bg-gray-100 text-gray-800' },
];

const getDocTypeConfig = (docType: DocumentNodeType) => {
  return DOC_TYPE_OPTIONS.find(opt => opt.value === docType) || DOC_TYPE_OPTIONS[0];
};

const DocumentSelector: React.FC<{
  type: 'source' | 'target';
  docType: DocumentNodeType;
  selectedDocument?: LegalDocument;
  demoMode: boolean;
  onDocTypeChange: (docType: DocumentNodeType) => void;
  onDocumentSelect: (document: LegalDocument) => void;
}> = ({ type, docType, selectedDocument, demoMode, onDocTypeChange, onDocumentSelect }) => {
  const docTypeConfig = getDocTypeConfig(docType);
  
  // Fetch real documents when not in demo mode
  const { data: documents = [], isLoading, error } = useLegalDocuments({
    documentType: docType !== 'ukjent' ? docType : undefined,
    limit: 100,
    enabled: !demoMode
  });
  
  const availableDocuments = demoMode ? MOCK_DOCUMENTS[docType] : documents;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          {docTypeConfig.icon}
          {type === 'source' ? 'Kildedokument' : 'Måldokument'}
          <Badge variant="secondary" className={docTypeConfig.color}>
            {docTypeConfig.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Document Type Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Dokumenttype</label>
          <Select value={docType} onValueChange={onDocTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Velg dokumenttype" />
            </SelectTrigger>
            <SelectContent>
              {DOC_TYPE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.icon}
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Document Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Velg dokument 
            {!demoMode && !isLoading && (
              <span className="text-muted-foreground">({availableDocuments.length} tilgjengelig)</span>
            )}
          </label>
          
          {/* Loading state */}
          {!demoMode && isLoading && (
            <div className="flex items-center gap-2 p-4 border border-dashed rounded-md">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Laster dokumenter...</span>
            </div>
          )}
          
          {/* Error state */}
          {!demoMode && error && (
            <div className="text-sm text-red-600 p-4 border border-red-200 bg-red-50 rounded-md">
              Feil ved lasting av dokumenter: {error.message}
            </div>
          )}
          
          {/* Document selector */}
          {!isLoading && !error && availableDocuments.length > 0 ? (
            <Select 
              value={selectedDocument?.id || ''} 
              onValueChange={(documentId) => {
                const document = availableDocuments.find(doc => doc.id === documentId);
                if (document) onDocumentSelect(document);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg dokument" />
              </SelectTrigger>
              <SelectContent>
                {availableDocuments.map(document => (
                  <SelectItem key={document.id} value={document.id}>
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-medium">{document.title}</span>
                      {document.document_number && (
                        <span className="text-xs text-muted-foreground">
                          {document.document_number}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : !isLoading && !error && (
            <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-md text-center">
              {demoMode 
                ? `Ingen ${docTypeConfig.label.toLowerCase()} tilgjengelig i demo-modus`
                : `Ingen ${docTypeConfig.label.toLowerCase()} funnet`
              }
            </div>
          )}
        </div>

        {/* Selected Document Info */}
        {selectedDocument && (
          <div className="p-3 bg-muted/50 rounded-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Valgt:</span>
              <Badge variant="outline">{selectedDocument.document_number}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedDocument.title}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Selectors: React.FC<SelectorsProps> = ({
  sourceDocType,
  targetDocType,
  selectedDocuments,
  demoMode,
  onDocTypeChange,
  onDocumentSelect,
  onSwapDirection,
}) => {
  const bothSelected = selectedDocuments.source && selectedDocuments.target;

  return (
    <div className="space-y-6">
      {/* Demo Mode Notice */}
      {demoMode && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-sm text-amber-800">
            <strong>Demo-modus:</strong> Bruker mock-data for testing av funksjonalitet
          </p>
        </div>
      )}

      {/* Document Selectors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DocumentSelector
          type="source"
          docType={sourceDocType}
          selectedDocument={selectedDocuments.source}
          demoMode={demoMode}
          onDocTypeChange={(docType) => onDocTypeChange('source', docType)}
          onDocumentSelect={(document) => onDocumentSelect('source', document)}
        />

        {/* Swap Direction Button */}
        <div className="flex items-center justify-center">
          <Button
            variant="outline"
            size="icon"
            onClick={onSwapDirection}
            className="h-12 w-12 rounded-full"
            disabled={!bothSelected}
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
        </div>

        <DocumentSelector
          type="target"
          docType={targetDocType}
          selectedDocument={selectedDocuments.target}
          demoMode={demoMode}
          onDocTypeChange={(docType) => onDocTypeChange('target', docType)}
          onDocumentSelect={(document) => onDocumentSelect('target', document)}
        />
      </div>

      {/* Selection Summary */}
      {bothSelected && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <h4 className="font-medium text-green-800 mb-2">Valgte dokumenter:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Kilde:</span> {selectedDocuments.source.title}
            </div>
            <div>
              <span className="font-medium">Mål:</span> {selectedDocuments.target.title}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Selectors;