import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight, FileText } from 'lucide-react';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import type { LegalDocument, DocumentNodeType } from '@/types/legal-knowledge';

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

// Mock data for demo mode
const MOCK_DOCUMENTS: Record<DocumentNodeType, LegalDocument[]> = {
  lov: [
    {
      id: '1',
      title: 'Lov om årsregnskap m.v. (regnskapsloven)',
      document_number: 'LOV-1998-07-17-56',
      document_type_id: 'lov',
      content: '',
      document_status: 'active',
      is_primary_source: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source_url: 'https://lovdata.no/dokument/NL/lov/1998-07-17-56'
    },
    {
      id: '2',
      title: 'Lov om revisor og revisjon (revisorloven)',
      document_number: 'LOV-1999-01-15-2',
      document_type_id: 'lov',
      content: '',
      document_status: 'active',
      is_primary_source: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source_url: 'https://lovdata.no/dokument/NL/lov/1999-01-15-2'
    }
  ],
  forskrift: [
    {
      id: '3',
      title: 'Forskrift om årsregnskap m.m.',
      document_number: 'FOR-1999-12-11-1319',
      document_type_id: 'forskrift',
      content: '',
      document_status: 'active',
      is_primary_source: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source_url: 'https://lovdata.no/dokument/SF/forskrift/1999-12-11-1319'
    }
  ],
  dom: [
    {
      id: '4',
      title: 'Rt. 2020 s. 1234 - Regnskapslovens anvendelse',
      document_number: 'HR-2020-1234-A',
      document_type_id: 'dom',
      content: '',
      document_status: 'active',
      is_primary_source: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source_url: 'https://lovdata.no/dokument/HRSIV/hrsiv-2020-1234'
    }
  ],
  rundskriv: [
    {
      id: '5',
      title: 'Rundskriv om regnskapslovens bestemmelser',
      document_number: 'RS-2020-001',
      document_type_id: 'rundskriv',
      content: '',
      document_status: 'active',
      is_primary_source: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source_url: 'https://regjeringen.no/rs-2020-001'
    }
  ],
  forarbeid: [
    {
      id: '6',
      title: 'Ot.prp. nr. 42 (1997-98) Om lov om årsregnskap m.v.',
      document_number: 'OTPRP-1997-98-42',
      document_type_id: 'forarbeid',
      content: '',
      document_status: 'active',
      is_primary_source: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source_url: 'https://stortinget.no/otprp-1997-98-42'
    }
  ],
  ukjent: []
};

const DOCTYPE_LABELS: Record<DocumentNodeType, string> = {
  lov: 'Lov',
  forskrift: 'Forskrift',
  dom: 'Dom',
  rundskriv: 'Rundskriv',
  forarbeid: 'Forarbeid',
  ukjent: 'Ukjent'
};

const DOCTYPE_COLORS: Record<DocumentNodeType, string> = {
  lov: 'bg-blue-100 text-blue-800',
  forskrift: 'bg-green-100 text-green-800',
  dom: 'bg-purple-100 text-purple-800',
  rundskriv: 'bg-yellow-100 text-yellow-800',
  forarbeid: 'bg-gray-100 text-gray-800',
  ukjent: 'bg-gray-100 text-gray-600'
};

const Selectors: React.FC<SelectorsProps> = ({
  sourceDocType,
  targetDocType,
  selectedDocuments,
  demoMode,
  onDocTypeChange,
  onDocumentSelect,
  onSwapDirection
}) => {
  // Fetch documents from Supabase (only when not in demo mode)
  const { data: sourceDocuments = [] } = useQuery({
    queryKey: ['legal-documents', sourceDocType],
    queryFn: async () => {
      if (demoMode) return MOCK_DOCUMENTS[sourceDocType];
      
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('document_type_id', sourceDocType)
        .eq('document_status', 'active')
        .limit(200);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!sourceDocType
  });

  const { data: targetDocuments = [] } = useQuery({
    queryKey: ['legal-documents', targetDocType],
    queryFn: async () => {
      if (demoMode) return MOCK_DOCUMENTS[targetDocType];
      
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('document_type_id', targetDocType)
        .eq('document_status', 'active')
        .limit(200);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!targetDocType
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Source Document */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Kilde
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document Type Selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Dokumenttype</label>
            <Select
              value={sourceDocType}
              onValueChange={(value: DocumentNodeType) => onDocTypeChange('source', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOCTYPE_LABELS).map(([type, label]) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      <Badge className={DOCTYPE_COLORS[type as DocumentNodeType]}>
                        {label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document Selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Dokument</label>
            <Select
              value={selectedDocuments.source?.id || ''}
              onValueChange={(value) => {
                const doc = sourceDocuments.find(d => d.id === value);
                if (doc) onDocumentSelect('source', doc);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg dokument..." />
              </SelectTrigger>
              <SelectContent>
                {sourceDocuments.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{doc.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {doc.document_number}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDocuments.source && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-sm">{selectedDocuments.source.title}</p>
              <p className="text-xs text-muted-foreground">
                {selectedDocuments.source.document_number}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Swap Direction Button */}
      <div className="flex items-center justify-center">
        <Button
          variant="outline"
          size="lg"
          onClick={onSwapDirection}
          className="h-12 w-12 rounded-full"
        >
          <ArrowLeftRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Target Document */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Mål
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document Type Selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Dokumenttype</label>
            <Select
              value={targetDocType}
              onValueChange={(value: DocumentNodeType) => onDocTypeChange('target', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOCTYPE_LABELS).map(([type, label]) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      <Badge className={DOCTYPE_COLORS[type as DocumentNodeType]}>
                        {label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document Selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Dokument</label>
            <Select
              value={selectedDocuments.target?.id || ''}
              onValueChange={(value) => {
                const doc = targetDocuments.find(d => d.id === value);
                if (doc) onDocumentSelect('target', doc);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg dokument..." />
              </SelectTrigger>
              <SelectContent>
                {targetDocuments.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{doc.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {doc.document_number}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDocuments.target && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-sm">{selectedDocuments.target.title}</p>
              <p className="text-xs text-muted-foreground">
                {selectedDocuments.target.document_number}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Selectors;