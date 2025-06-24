import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import { toast } from 'sonner';
import { 
  FileText, 
  ChevronDown, 
  ChevronRight, 
  Eye,
  Calendar,
  BarChart3,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Download,
  AlertTriangle
} from 'lucide-react';

interface DocumentReference {
  id: string;
  fileName: string;
  category?: string;
  summary?: string;
  confidence?: number;
  textPreview?: string;
  uploadDate: string;
  relevantText?: string;
}

interface DocumentReferenceViewerProps {
  documents: DocumentReference[];
  title?: string;
  maxHeight?: string;
  clientId?: string;
}

const DocumentReferenceViewer: React.FC<DocumentReferenceViewerProps> = ({
  documents,
  title = "Refererte dokumenter",
  maxHeight = "400px",
  clientId
}) => {
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
  const [operationStatus, setOperationStatus] = useState<Record<string, 'success' | 'error' | 'loading'>>({});
  const { getDocumentUrl, downloadDocument, triggerTextExtraction } = useClientDocuments(clientId || '');

  const toggleExpanded = (docId: string) => {
    const newExpanded = new Set(expandedDocs);
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId);
    } else {
      newExpanded.add(docId);
    }
    setExpandedDocs(newExpanded);
  };

  const setOperationResult = (docId: string, status: 'success' | 'error' | 'loading') => {
    setOperationStatus(prev => ({ ...prev, [docId]: status }));
    
    // Clear status after 3 seconds
    if (status !== 'loading') {
      setTimeout(() => {
        setOperationStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[docId];
          return newStatus;
        });
      }, 3000);
    }
  };

  const handleViewDocument = async (event: React.MouseEvent, docId: string, fileName: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('🎯 [VIEWER] View document clicked:', { docId, fileName, clientId });
    
    if (!clientId) {
      toast.error('❌ Klient-ID mangler', {
        description: 'Kunde-informasjon er ikke tilgjengelig.',
        duration: 5000
      });
      return;
    }

    setOperationResult(docId, 'loading');
    
    try {
      console.log('📄 [VIEWER] Fetching document data...');
      
      // Fetch document data
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: documentData, error } = await supabase
        .from('client_documents_files')
        .select('file_path, file_name, mime_type, extracted_text, text_extraction_status')
        .eq('id', docId)
        .single();

      if (error || !documentData) {
        console.error('❌ [VIEWER] Error fetching document data:', error);
        setOperationResult(docId, 'error');
        toast.error('❌ Kunne ikke hente dokumentdata', {
          description: error?.message || 'Ukjent database feil',
          duration: 5000
        });
        return;
      }

      console.log('✅ [VIEWER] Document data retrieved:', { 
        fileName: documentData.file_name,
        hasText: !!documentData.extracted_text,
        status: documentData.text_extraction_status
      });

      // Get document URL
      const url = await getDocumentUrl(documentData.file_path);
      
      if (url) {
        console.log('✅ [VIEWER] Opening document in new tab');
        window.open(url, '_blank', 'noopener,noreferrer');
        toast.success('✅ Dokumentet åpnes i ny fane', {
          duration: 3000
        });
        setOperationResult(docId, 'success');
      } else {
        console.error('❌ [VIEWER] Could not generate document URL');
        setOperationResult(docId, 'error');
        toast.error('❌ Kunne ikke generere dokument-URL', {
          description: 'Filen kan være skadet eller utilgjengelig.',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('❌ [VIEWER] Error viewing document:', error);
      setOperationResult(docId, 'error');
      toast.error('❌ Kunne ikke åpne dokumentet', {
        description: 'En uventet feil oppstod ved åpning av dokumentet.',
        duration: 5000
      });
    }
  };

  const handleDownloadDocument = async (event: React.MouseEvent, docId: string, fileName: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('📥 [VIEWER] Download document clicked:', { docId, fileName, clientId });
    
    if (!clientId) {
      toast.error('❌ Klient-ID mangler', {
        description: 'Kunde-informasjon er ikke tilgjengelig.',
        duration: 5000
      });
      return;
    }

    setOperationResult(docId, 'loading');
    
    try {
      console.log('📥 [VIEWER] Starting document download...');
      
      // Call downloadDocument with just the document ID
      await downloadDocument(docId);
      setOperationResult(docId, 'success');
      
    } catch (error) {
      console.error('❌ [VIEWER] Error downloading document:', error);
      setOperationResult(docId, 'error');
      toast.error('❌ Nedlasting feilet', {
        description: 'Kunne ikke laste ned dokumentet.',
        duration: 5000
      });
    }
  };

  const handleRetryTextExtraction = async (event: React.MouseEvent, docId: string, fileName: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('🔄 [VIEWER] Retry text extraction clicked:', { docId, fileName, clientId });
    
    if (!clientId) {
      toast.error('❌ Klient-ID mangler', {
        description: 'Kunde-informasjon er ikke tilgjengelig.',
        duration: 5000
      });
      return;
    }

    setOperationResult(docId, 'loading');
    
    try {
      console.log('🔄 [VIEWER] Starting text extraction retry...');
      
      // Show immediate feedback
      toast.info('🔄 Starter tekstekstraksjon på nytt...', {
        description: 'Dette kan ta opp til et minutt.',
        duration: 3000
      });
      
      await triggerTextExtraction(docId);
      
      console.log('✅ [VIEWER] Text extraction retry initiated successfully');
      setOperationResult(docId, 'success');
      
    } catch (error) {
      console.error('❌ [VIEWER] Error retrying text extraction:', error);
      setOperationResult(docId, 'error');
      // Error toast is handled in the hook, so we don't need to show another one here
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'bg-gray-100 text-gray-700';
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getOperationStatusIcon = (docId: string) => {
    const status = operationStatus[docId];
    switch (status) {
      case 'loading':
        return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  if (!documents || documents.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>Ingen dokumenter funnet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <FileText className="h-4 w-4 text-blue-600" />
          {title} ({documents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2" style={{ maxHeight, overflowY: 'auto' }}>
          {documents.map((doc) => {
            const isExpanded = expandedDocs.has(doc.id);
            const hasNoText = !doc.textPreview || doc.textPreview === 'Tekstinnhold ikke tilgjengelig';
            const statusIcon = getOperationStatusIcon(doc.id);
            const isLoading = operationStatus[doc.id] === 'loading';
            
            return (
              <Collapsible key={doc.id} open={isExpanded}>
                <div className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <CollapsibleTrigger
                    onClick={() => toggleExpanded(doc.id)}
                    className="w-full"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1 text-left">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium text-sm truncate">
                              {doc.fileName}
                            </span>
                            {doc.confidence && (
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${getConfidenceColor(doc.confidence)}`}
                              >
                                {Math.round(doc.confidence * 100)}%
                              </Badge>
                            )}
                            {hasNoText && (
                              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Ingen tekst
                              </Badge>
                            )}
                            {statusIcon}
                          </div>
                          
                          {doc.category && (
                            <Badge variant="outline" className="text-xs mb-2">
                              {doc.category}
                            </Badge>
                          )}
                          
                          {doc.summary && (
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {doc.summary}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-blue-100"
                          onClick={(e) => handleViewDocument(e, doc.id, doc.fileName)}
                          disabled={isLoading}
                          title="Vis dokument"
                        >
                          {isLoading && operationStatus[doc.id] === 'loading' ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0 hover:bg-green-100"
                          onClick={(e) => handleDownloadDocument(e, doc.id, doc.fileName)}
                          disabled={isLoading}
                          title="Last ned dokument"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="mt-3 pt-3 border-t space-y-3">
                      {/* Upload info */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Lastet opp: {new Date(doc.uploadDate).toLocaleDateString('no-NO')}</span>
                        </div>
                        {doc.confidence && (
                          <div className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            <span>AI-sikkerhet: {Math.round(doc.confidence * 100)}%</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Relevant text preview */}
                      {(doc.relevantText || doc.textPreview) && (
                        <div className="bg-gray-50 rounded p-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">
                            {doc.relevantText ? 'Relevant innhold:' : 'Forhåndsvisning:'}
                          </p>
                          <p className="text-xs text-gray-600 italic">
                            "{doc.relevantText || doc.textPreview}"
                          </p>
                        </div>
                      )}
                      
                      {/* Action buttons */}
                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs hover:bg-blue-50"
                          onClick={(e) => handleViewDocument(e, doc.id, doc.fileName)}
                          disabled={isLoading}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Vis dokument
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs hover:bg-green-50"
                          onClick={(e) => handleDownloadDocument(e, doc.id, doc.fileName)}
                          disabled={isLoading}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Last ned
                        </Button>
                        {hasNoText && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs hover:bg-orange-50 border-orange-200 text-orange-700"
                            onClick={(e) => handleRetryTextExtraction(e, doc.id, doc.fileName)}
                            disabled={isLoading}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Ekstrahér tekst
                          </Button>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentReferenceViewer;
