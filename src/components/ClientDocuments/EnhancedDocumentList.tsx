
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Eye, Trash2, Search, Filter, CheckSquare, Square, Move } from 'lucide-react';
import { useClientDocuments, ClientDocument } from '@/hooks/useClientDocuments';
import { toast } from 'sonner';
import AdvancedFilePreview from './AdvancedFilePreview';

interface EnhancedDocumentListProps {
  clientId: string;
}

const EnhancedDocumentList = ({ clientId }: EnhancedDocumentListProps) => {
  const { documents, categories, deleteDocument, getDocumentUrl, isLoading } = useClientDocuments(clientId);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [previewDocument, setPreviewDocument] = useState<ClientDocument | null>(null);
  const [isBulkMode, setIsBulkMode] = useState(false);

  // Filter documents based on search and category
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.subject_area?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSelectDocument = (documentId: string) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(documentId)) {
      newSelected.delete(documentId);
    } else {
      newSelected.add(documentId);
    }
    setSelectedDocuments(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedDocuments.size === filteredDocuments.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(filteredDocuments.map(doc => doc.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocuments.size === 0) return;
    
    const confirmed = window.confirm(`Er du sikker på at du vil slette ${selectedDocuments.size} dokumenter?`);
    if (!confirmed) return;

    let deletedCount = 0;
    for (const docId of selectedDocuments) {
      try {
        await deleteDocument.mutateAsync(docId);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete document ${docId}:`, error);
      }
    }

    setSelectedDocuments(new Set());
    setIsBulkMode(false);
    toast.success(`${deletedCount} dokumenter slettet`);
  };

  const handleDownload = async (document: ClientDocument) => {
    try {
      const url = await getDocumentUrl(document.file_path);
      if (url) {
        const link = window.document.createElement('a');
        link.href = url;
        link.download = document.file_name;
        link.click();
      }
    } catch (error) {
      toast.error('Kunne ikke laste ned fil');
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-600 bg-gray-50 border-gray-200';
    if (confidence >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  if (isLoading) {
    return <div className="p-6">Laster dokumenter...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Dokumentliste ({filteredDocuments.length})</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={isBulkMode ? "default" : "outline"}
                onClick={() => {
                  setIsBulkMode(!isBulkMode);
                  setSelectedDocuments(new Set());
                }}
              >
                <CheckSquare className="h-4 w-4 mr-1" />
                {isBulkMode ? 'Avslutt bulk' : 'Bulk-modus'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and filter controls */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Søk i dokumenter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrer kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle kategorier</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.category_name}>
                    {cat.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bulk actions */}
          {isBulkMode && (
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedDocuments.size === filteredDocuments.length && filteredDocuments.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm">
                  {selectedDocuments.size} av {filteredDocuments.length} valgt
                </span>
              </div>
              {selectedDocuments.size > 0 && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Move className="h-4 w-4 mr-1" />
                    Flytt kategori
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Slett valgte
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Document list */}
          <div className="space-y-3">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || categoryFilter ? 'Ingen dokumenter funnet' : 'Ingen dokumenter lastet opp ennå'}
              </div>
            ) : (
              filteredDocuments.map((document) => (
                <Card key={document.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {isBulkMode && (
                        <Checkbox
                          checked={selectedDocuments.has(document.id)}
                          onCheckedChange={() => handleSelectDocument(document.id)}
                        />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{document.file_name}</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {document.category && (
                            <Badge variant="outline" className="text-xs">
                              {document.category}
                            </Badge>
                          )}
                          {document.subject_area && (
                            <Badge variant="secondary" className="text-xs">
                              {document.subject_area}
                            </Badge>
                          )}
                          {document.ai_confidence_score && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getConfidenceColor(document.ai_confidence_score)}`}
                            >
                              AI: {Math.round(document.ai_confidence_score * 100)}%
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {(document.file_size / 1024 / 1024).toFixed(2)} MB • 
                          {new Date(document.created_at).toLocaleDateString('nb-NO')}
                        </p>
                        {document.ai_analysis_summary && (
                          <p className="text-xs text-blue-600 mt-1 bg-blue-50 p-2 rounded">
                            {document.ai_analysis_summary}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewDocument(document)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(document)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteDocument.mutate(document.id)}
                        disabled={deleteDocument.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Advanced File Preview */}
      {previewDocument && (
        <AdvancedFilePreview
          file={new File([], previewDocument.file_name, { type: previewDocument.mime_type })}
          isOpen={!!previewDocument}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </div>
  );
};

export default EnhancedDocumentList;
