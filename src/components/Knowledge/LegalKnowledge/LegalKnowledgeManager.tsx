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
import { BookOpen, FileText, Scale, Search, Plus, Link2, Target, Upload, Download, FileSpreadsheet, Zap } from 'lucide-react';
import { LegalExcelService, ExcelImportResult } from '@/services/legal-knowledge/excelService';
import { supabase } from '@/integrations/supabase/client';
import { LegalKnowledgeService } from '@/services/legal-knowledge/legalKnowledgeService';
import type { LegalDocument, LegalProvision, LegalDocumentType } from '@/types/legal-knowledge';
import { LawSelectionWizard } from './LawSelectionWizard';
import { LawProvisionUploader } from './LawProvisionUploader';
import { toast } from 'sonner';

export const LegalKnowledgeManager: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('all');
  const [showWizard, setShowWizard] = useState(false);
  const [selectedLaw, setSelectedLaw] = useState<{ identifier: string; title: string } | null>(null);
  const [newDocument, setNewDocument] = useState({
    title: '',
    content: '',
    document_type_id: '',
    document_number: '',
    issuing_authority: ''
  });
  const [excelImportResult, setExcelImportResult] = useState<ExcelImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

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

      if (selectedDocumentType && selectedDocumentType !== 'all') {
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
        document_types: (selectedDocumentType && selectedDocumentType !== 'all') ? [selectedDocumentType] : undefined
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

  const handleExcelFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const result = await LegalExcelService.parseExcelFile(file);
      setExcelImportResult(result);
      
      if (result.errors.length > 0) {
        toast.error(`Import med ${result.errors.length} feil. Se detaljer nedenfor.`);
      } else {
        toast.success(`Excel-fil parsert: ${result.documents.length} dokumenter, ${result.provisions.length} bestemmelser`);
      }
    } catch (error) {
      toast.error(`Feil ved parsing av Excel-fil: ${error}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleBulkImport = async () => {
    if (!excelImportResult) return;

    try {
      setIsImporting(true);
      
      // Import document types first
      for (const docType of excelImportResult.documentTypes) {
        await supabase
          .from('legal_document_types')
          .upsert(docType, { onConflict: 'id' });
      }

      // Import documents
      for (const doc of excelImportResult.documents) {
        const { error } = await supabase
          .from('legal_documents')
          .insert(doc);
        if (error) throw error;
      }

      // Import provisions
      for (const provision of excelImportResult.provisions) {
        const { error } = await supabase
          .from('legal_provisions')
          .insert(provision);
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
      queryClient.invalidateQueries({ queryKey: ['legal-provisions'] });
      queryClient.invalidateQueries({ queryKey: ['legal-document-types'] });
      
      toast.success('Bulk import fullført!');
      setExcelImportResult(null);
    } catch (error) {
      toast.error(`Feil ved bulk import: ${error}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportData = async () => {
    try {
      const [docsResult, provisionsResult, typesResult] = await Promise.all([
        supabase.from('legal_documents').select('*'),
        supabase.from('legal_provisions').select('*'),
        supabase.from('legal_document_types').select('*')
      ]);

      if (docsResult.error) throw docsResult.error;
      if (provisionsResult.error) throw provisionsResult.error;
      if (typesResult.error) throw typesResult.error;

      const exportData = {
        documentTypes: typesResult.data || [],
        documents: docsResult.data || [],
        provisions: provisionsResult.data || []
      };

      LegalExcelService.downloadExport(exportData, 'juridisk-kunnskapsbase-eksport');
      toast.success('Data eksportert til Excel');
    } catch (error) {
      toast.error(`Feil ved eksport: ${error}`);
    }
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
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Publisert: {doc.publication_date ? new Date(doc.publication_date).toLocaleDateString('nb-NO') : 'Ukjent'}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleLawClick(doc.document_number || doc.id, doc.title)}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Last opp bestemmelser
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderProvisionCard = (provision: LegalProvision) => (
    <Card key={provision.id} className="mb-4 cursor-pointer hover:bg-muted/30" 
          onClick={() => handleLawClick(provision.law_identifier, provision.law_full_name || provision.law_identifier)}>
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
              <Badge variant="outline" className="text-xs">
                Klikk for å laste opp flere bestemmelser
              </Badge>
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

  const handleLawClick = (lawIdentifier: string, lawTitle: string) => {
    setSelectedLaw({ identifier: lawIdentifier, title: lawTitle });
  };

  // Toggle wizard view
  if (showWizard) {
    return <LawSelectionWizard onBack={() => setShowWizard(false)} />;
  }

  // Show law provision uploader if law is selected
  if (selectedLaw) {
    return (
      <LawProvisionUploader
        lawIdentifier={selectedLaw.identifier}
        lawTitle={selectedLaw.title}
        onBack={() => setSelectedLaw(null)}
        onComplete={() => {
          setSelectedLaw(null);
          // Refresh the provisions list
          queryClient.invalidateQueries({ queryKey: ['legal-provisions'] });
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Juridisk Kunnskapsbase</h1>
            <p className="text-muted-foreground">
              Strukturert lagring og søk i juridiske dokumenter med relasjoner
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2"
        >
          <Zap className="h-4 w-4" />
          Guidet opplastning
        </Button>
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
                <SelectItem value="all">Alle typer</SelectItem>
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

      {/* Excel Import/Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Excel Import/Export
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Full kontroll over juridisk data via Excel-filer
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="outline" 
              onClick={() => LegalExcelService.downloadTemplate()}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Last ned Excel-template
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleExportData}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Eksporter eksisterende data
            </Button>
            
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelFileUpload}
                className="hidden"
                id="excel-upload"
              />
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('excel-upload')?.click()}
                disabled={isImporting}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {isImporting ? 'Parser...' : 'Last opp Excel-fil'}
              </Button>
            </div>
          </div>

          {excelImportResult && (
            <div className="mt-6 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-semibold mb-3">Excel Import Resultat</h4>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {excelImportResult.documentTypes.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Dokumenttyper</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {excelImportResult.documents.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Dokumenter</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {excelImportResult.provisions.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Bestemmelser</div>
                </div>
              </div>
              
              {excelImportResult.errors.length > 0 && (
                <div className="mb-4">
                  <h5 className="font-medium text-red-600 mb-2">Feil ({excelImportResult.errors.length}):</h5>
                  <ScrollArea className="h-32 p-2 bg-red-50 rounded">
                    {excelImportResult.errors.map((error, i) => (
                      <div key={i} className="text-sm text-red-700">{error}</div>
                    ))}
                  </ScrollArea>
                </div>
              )}

              <Button 
                onClick={handleBulkImport}
                disabled={isImporting || excelImportResult.documents.length === 0}
                className="w-full"
              >
                {isImporting ? 'Importerer...' : 'Importer alle data til database'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="documents">Dokumenter</TabsTrigger>
          <TabsTrigger value="provisions">Bestemmelser</TabsTrigger>
          <TabsTrigger value="import">Manuell Import</TabsTrigger>
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
                Manuell Import av Juridisk Dokument
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Legg til enkelt juridisk dokument manuelt med automatisk sitatgjenkjenning
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