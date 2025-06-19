
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Download, Trash2, Search, Bot, Calendar, Edit, Check, X } from 'lucide-react';
import { ClientDocument, useClientDocuments } from '@/hooks/useClientDocuments';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';

interface EnhancedDocumentListProps {
  documents: ClientDocument[];
  documentsByCategory: Record<string, ClientDocument[]>;
  isLoading: boolean;
  categories: any[];
}

const EnhancedDocumentList = ({ documents, documentsByCategory, isLoading, categories }: EnhancedDocumentListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subjectAreaFilter, setSubjectAreaFilter] = useState('all');
  const [editingDocument, setEditingDocument] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');
  
  const { deleteDocument, getDocumentUrl } = useClientDocuments('');

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    const matchesSubjectArea = subjectAreaFilter === 'all' || doc.subject_area === subjectAreaFilter;
    return matchesSearch && matchesCategory && matchesSubjectArea;
  });

  const categoriesNames = [...new Set(documents.map(d => d.category).filter(Boolean))];
  const subjectAreas = [...new Set(documents.map(d => d.subject_area).filter(Boolean))];

  const handleDownload = async (document: ClientDocument) => {
    const url = await getDocumentUrl(document.file_path);
    if (!url) return;
    
    const link = window.document.createElement('a');
    link.href = url;
    link.download = document.file_name;
    link.click();
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('image')) return '🖼️';
    return '📁';
  };

  const getConfidenceColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleCategoryEdit = async (documentId: string, category: string) => {
    // Her ville vi normalt oppdatert dokumentet i databasen
    console.log('Updating document category:', documentId, category);
    setEditingDocument(null);
    setNewCategory('');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Laster dokumenter...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtrer og administrer dokumenter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk i filnavn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={subjectAreaFilter} onValueChange={setSubjectAreaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Alle fagområder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle fagområder</SelectItem>
                {subjectAreas.map(area => (
                  <SelectItem key={area} value={area}>
                    {area === 'lnn' ? 'Lønn' : area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Alle kategorier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle kategorier</SelectItem>
                <SelectItem value="uncategorized">Ukategoriserte</SelectItem>
                <SelectItem value="ai-suggested">Kun AI-forslag</SelectItem>
                {categoriesNames.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* AI Categorization Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI-kategorisering sammendrag
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {documents.filter(d => d.ai_confidence_score && d.ai_confidence_score >= 0.8).length}
              </div>
              <div className="text-sm text-green-700">Høy sikkerhet (80%+)</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {documents.filter(d => d.ai_confidence_score && d.ai_confidence_score >= 0.6 && d.ai_confidence_score < 0.8).length}
              </div>
              <div className="text-sm text-yellow-700">Middels sikkerhet (60-80%)</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {documents.filter(d => d.ai_confidence_score && d.ai_confidence_score < 0.6).length}
              </div>
              <div className="text-sm text-red-700">Lav sikkerhet (&lt;60%)</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {documents.filter(d => !d.ai_confidence_score).length}
              </div>
              <div className="text-sm text-gray-700">Ikke kategorisert</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              {searchTerm || categoryFilter !== 'all' || subjectAreaFilter !== 'all' 
                ? 'Ingen dokumenter matcher søkekriteriene'
                : 'Ingen dokumenter lastet opp ennå'
              }
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-2xl">{getFileIcon(document.mime_type)}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{document.file_name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(document.created_at), { 
                            addSuffix: true, 
                            locale: nb 
                          })}
                        </span>
                        <span>•</span>
                        <span>{(document.file_size / 1024 / 1024).toFixed(1)} MB</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        {/* Kategori med redigeringsmulighet */}
                        {document.category && (
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {document.category}
                            </Badge>
                            {editingDocument !== document.id && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingDocument(document.id)}
                                className="h-6 w-6 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )}
                        
                        {/* Fagområde */}
                        {document.subject_area && (
                          <Badge variant="outline" className="text-xs">
                            {document.subject_area === 'lnn' ? 'Lønn' : document.subject_area}
                          </Badge>
                        )}
                        
                        {/* AI-forslag */}
                        {document.ai_suggested_category && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <Bot className="h-3 w-3" />
                            AI: {document.ai_suggested_category}
                            <span className={`font-medium ${getConfidenceColor(document.ai_confidence_score)}`}>
                              ({Math.round((document.ai_confidence_score || 0) * 100)}%)
                            </span>
                          </Badge>
                        )}
                      </div>

                      {/* Kategori-redigering */}
                      {editingDocument === document.id && (
                        <div className="mt-3 p-3 bg-gray-50 rounded border">
                          <div className="flex items-center gap-2">
                            <Select value={newCategory} onValueChange={setNewCategory}>
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Velg ny kategori" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories
                                  .filter(cat => !document.subject_area || cat.subject_area === document.subject_area)
                                  .map(category => (
                                    <SelectItem key={category.id} value={category.category_name}>
                                      {category.category_name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              onClick={() => handleCategoryEdit(document.id, newCategory)}
                              disabled={!newCategory}
                              className="h-8"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingDocument(null);
                                setNewCategory('');
                              }}
                              className="h-8"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* AI-analyse sammendrag */}
                      {document.ai_analysis_summary && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                          <div className="flex items-start gap-2">
                            <Bot className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-blue-900 mb-1">AI-analyse:</p>
                              <p className="text-sm text-blue-800">{document.ai_analysis_summary}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedDocumentList;
