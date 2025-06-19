
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Trash2, Search, Bot, Calendar, Brain } from 'lucide-react';
import { ClientDocument, useClientDocuments } from '@/hooks/useClientDocuments';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';
import EmbeddedContextChat from '@/components/Revy/EmbeddedContextChat';

interface DocumentListProps {
  documents: ClientDocument[];
  documentsByCategory: Record<string, ClientDocument[]>;
  isLoading: boolean;
}

const DocumentList = ({ documents, documentsByCategory, isLoading }: DocumentListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subjectAreaFilter, setSubjectAreaFilter] = useState('all');
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  
  const { deleteDocument, getDocumentUrl } = useClientDocuments('');

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    const matchesSubjectArea = subjectAreaFilter === 'all' || doc.subject_area === subjectAreaFilter;
    return matchesSearch && matchesCategory && matchesSubjectArea;
  });

  const categories = [...new Set(documents.map(d => d.category).filter(Boolean))];
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
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      <div className="xl:col-span-3 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">Filtrer dokumenter</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAIAssistant(!showAIAssistant)}
              >
                <Brain className="h-4 w-4 mr-2" />
                AI-Revi Hjelp
              </Button>
            </CardTitle>
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
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Card key={document.id}>
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
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          {document.category && (
                            <Badge variant="secondary" className="text-xs">
                              {document.category}
                            </Badge>
                          )}
                          {document.subject_area && (
                            <Badge variant="outline" className="text-xs">
                              {document.subject_area === 'lnn' ? 'Lønn' : document.subject_area}
                            </Badge>
                          )}
                          {document.ai_suggested_category && (
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              <Bot className="h-3 w-3" />
                              AI-forslag ({Math.round((document.ai_confidence_score || 0) * 100)}%)
                            </Badge>
                          )}
                        </div>

                        {document.ai_analysis_summary && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {document.ai_analysis_summary}
                          </p>
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

      {/* AI Assistant Panel */}
      {showAIAssistant && (
        <div>
          <EmbeddedContextChat
            clientId={documents[0]?.client_id || ''}
            context="documentation"
            title="AI-Revi Dokumenthjelp"
            height="600px"
          />
        </div>
      )}
    </div>
  );
};

export default DocumentList;
