import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { BookOpen, FileText, Scale, Search, Plus, Link2, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LegalKnowledgeService } from '@/services/legal-knowledge/legalKnowledgeService';
import type { LegalDocument, LegalProvision, LegalDocumentType } from '@/types/legal-knowledge';
import { toast } from 'sonner';

export const LegalKnowledgeManager: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [newDocument, setNewDocument] = useState({
    title: '',
    content: '',
    document_type_id: '',
    document_number: '',
    issuing_authority: ''
  });

  const queryClient = useQueryClient();

  // Fetch legal document types
  const { data: documentTypes } = useQuery({
    queryKey: ['legal-document-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legal_document_types')
        .select('*')
        .eq('is_active', true)
        .order('hierarchy_level', { ascending: true });
      
      if (error) throw error;
      return data as LegalDocumentType[];
    }
  });

  // Fetch legal documents
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['legal-documents', selectedDocumentType],
    queryFn: async () => {
      let query = supabase
        .from('legal_documents')
        .select(`
          *,
          document_type:legal_document_types(*)
        `)
        .eq('document_status', 'active')
        .order('created_at', { ascending: false })
        .limit(50);

      if (selectedDocumentType) {
        query = query.eq('document_type_id', selectedDocumentType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LegalDocument[];
    }
  });

  // Fetch legal provisions
  const { data: provisions } = useQuery({
    queryKey: ['legal-provisions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legal_provisions')
        .select('*')
        .eq('is_active', true)
        .order('law_identifier', { ascending: true })
        .limit(50);
      
      if (error) throw error;
      return data as LegalProvision[];
    }
  });

  // Search legal knowledge
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['legal-search', searchQuery, selectedDocumentType],
    queryFn: async () => {
      if (!searchQuery.trim()) return null;
      
      return await LegalKnowledgeService.searchLegalKnowledge({
        query: searchQuery,
        document_types: selectedDocumentType ? [selectedDocumentType] : undefined
      });
    },
    enabled: !!searchQuery.trim()
  });

  // Import document mutation
  const importDocumentMutation = useMutation({
    mutationFn: async (docData: typeof newDocument) => {
      if (!docData.title || !docData.content || !docData.document_type_id) {
        throw new Error('Tittel, innhold og dokumenttype er påkrevd');
      }

      return await LegalKnowledgeService.importLegalDocument(
        docData.title,
        docData.content,
        docData.document_type_id,
        {
          document_number: docData.document_number || undefined,
          issuing_authority: docData.issuing_authority || undefined
        }
      );
    },
    onSuccess: () => {
      toast.success('Juridisk dokument importert');
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
      setNewDocument({
        title: '',
        content: '',
        document_type_id: '',
        document_number: '',
        issuing_authority: ''
      });
    },
    onError: (error) => {
      toast.error(`Feil ved import: ${error.message}`);
    }
  });

  const handleImportDocument = () => {
    importDocumentMutation.mutate(newDocument);
  };

  const getAuthorityBadgeColor = (weight: number) => {
    if (weight >= 1.0) return 'bg-red-100 text-red-800';
    if (weight >= 0.8) return 'bg-orange-100 text-orange-800';
    if (weight >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const renderDocumentCard = (doc: LegalDocument) => (
    <Card key={doc.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{doc.title}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge 
                variant="outline"
                className={getAuthorityBadgeColor(doc.document_type?.authority_weight || 0)}
              >
                {doc.document_type?.display_name}
              </Badge>
              {doc.document_number && (
                <Badge variant="secondary">
                  {doc.document_number}
                </Badge>
              )}
              {doc.issuing_authority && (
                <Badge variant="outline">
                  {doc.issuing_authority}
                </Badge>
              )}
            </div>
          </div>
          <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardHeader>
      <CardContent>
        {doc.summary && (
          <p className="text-sm text-muted-foreground mb-3">{doc.summary}</p>
        )}
        <div className="text-xs text-muted-foreground">
          Publisert: {doc.publication_date ? new Date(doc.publication_date).toLocaleDateString('nb-NO') : 'Ukjent'}
        </div>
      </CardContent>
    </Card>
  );

  const renderProvisionCard = (provision: LegalProvision) => (
    <Card key={provision.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">
              {provision.law_identifier} § {provision.provision_number}
            </CardTitle>
            <p className="text-sm font-medium text-muted-foreground">{provision.title}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">
                {provision.provision_type}
              </Badge>
              {provision.law_full_name && (
                <Badge variant="secondary" className="text-xs">
                  {provision.law_full_name}
                </Badge>
              )}
            </div>
          </div>
          <Scale className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardHeader>
      {provision.content && (
        <CardContent>
          <p className="text-sm">{provision.content.substring(0, 300)}...</p>
        </CardContent>
      )}
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Juridisk Kunnskapsbase</h1>
          <p className="text-muted-foreground">
            Strukturert lagring og søk i juridiske dokumenter med relasjoner
          </p>
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Søk i Juridisk Kunnskapsbase
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Søk etter lover, paragrafer, dommer, etc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Dokumenttype" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle typer</SelectItem>
                {documentTypes?.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {searchResults && (
            <div className="mt-6">
              <h3 className="font-semibold mb-4">
                Søkeresultater ({searchResults.search_metadata.total_results} funnet)
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Dokumenter ({searchResults.documents.length})
                  </h4>
                  <ScrollArea className="h-96">
                    {searchResults.documents.map(renderDocumentCard)}
                  </ScrollArea>
                </div>
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    Bestemmelser ({searchResults.provisions.length})
                  </h4>
                  <ScrollArea className="h-96">
                    {searchResults.provisions.map(renderProvisionCard)}
                  </ScrollArea>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="documents">Dokumenter</TabsTrigger>
          <TabsTrigger value="provisions">Bestemmelser</TabsTrigger>
          <TabsTrigger value="import">Importer Nytt</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Juridiske Dokumenter</CardTitle>
              <p className="text-sm text-muted-foreground">
                Strukturerte juridiske dokumenter med autoritetstyngde
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {documentsLoading ? (
                  <div className="text-center py-8">Laster dokumenter...</div>
                ) : documents?.length ? (
                  documents.map(renderDocumentCard)
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Ingen dokumenter funnet
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="provisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Juridiske Bestemmelser</CardTitle>
              <p className="text-sm text-muted-foreground">
                Strukturerte lovbestemmelser med hierarkiske relasjoner
              </p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {provisions?.length ? (
                  provisions.map(renderProvisionCard)
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Ingen bestemmelser funnet
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Importer Juridisk Dokument
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Legg til nytt juridisk dokument med automatisk sitatgjenkjenning
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tittel *</label>
                  <Input
                    value={newDocument.title}
                    onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                    placeholder="f.eks. Regnskapsloven § 3-1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dokumenttype *</label>
                  <Select 
                    value={newDocument.document_type_id} 
                    onValueChange={(value) => setNewDocument({ ...newDocument, document_type_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg dokumenttype" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes?.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getAuthorityBadgeColor(type.authority_weight)}`}
                            >
                              {type.hierarchy_level}
                            </Badge>
                            {type.display_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dokumentnummer</label>
                  <Input
                    value={newDocument.document_number}
                    onChange={(e) => setNewDocument({ ...newDocument, document_number: e.target.value })}
                    placeholder="f.eks. LOV-1998-07-17-56"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Utstedende myndighet</label>
                  <Input
                    value={newDocument.issuing_authority}
                    onChange={(e) => setNewDocument({ ...newDocument, issuing_authority: e.target.value })}
                    placeholder="f.eks. Stortinget"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Innhold *</label>
                <Textarea
                  value={newDocument.content}
                  onChange={(e) => setNewDocument({ ...newDocument, content: e.target.value })}
                  placeholder="Skriv inn eller lim inn dokumentinnholdet..."
                  rows={10}
                />
              </div>

              <Button 
                onClick={handleImportDocument}
                disabled={importDocumentMutation.isPending}
                className="w-full"
              >
                {importDocumentMutation.isPending ? 'Importerer...' : 'Importer Dokument'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};