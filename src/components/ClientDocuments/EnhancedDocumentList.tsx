
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Trash2, Search, Calendar } from 'lucide-react';
import { ClientDocument, useClientDocuments } from '@/hooks/useClientDocuments';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';
import FrontendDocumentProcessor from './FrontendDocumentProcessor';

interface EnhancedDocumentListProps {
  documents: ClientDocument[];
  isLoading: boolean;
  clientId: string;
  onUpdate?: () => void;
}

const EnhancedDocumentList = ({ documents, isLoading, clientId, onUpdate }: EnhancedDocumentListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { deleteDocument, getDocumentUrl } = useClientDocuments(clientId);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || doc.text_extraction_status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(documents.map(d => d.category).filter(Boolean))];

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

  const getStatsForStatus = (status: string) => {
    return documents.filter(d => d.text_extraction_status === status).length;
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
      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-700">{getStatsForStatus('completed')}</div>
          <div className="text-sm text-green-600">✅ AI kan lese</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-700">{getStatsForStatus('processing')}</div>
          <div className="text-sm text-blue-600">🔄 Prosesserer</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-700">{getStatsForStatus('pending')}</div>
          <div className="text-sm text-yellow-600">⏳ Venter</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-700">{getStatsForStatus('failed')}</div>
          <div className="text-sm text-red-600">❌ Feilet</div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtrer dokumenter
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Alle statuser" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statuser</SelectItem>
                <SelectItem value="completed">AI kan lese</SelectItem>
                <SelectItem value="processing">Prosesserer</SelectItem>
                <SelectItem value="pending">Venter</SelectItem>
                <SelectItem value="failed">Feilet</SelectItem>
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
              {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' 
                ? 'Ingen dokumenter matcher søkekriteriene'
                : 'Ingen dokumenter lastet opp ennå'
              }
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="transition-shadow hover:shadow-md">
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
                        <FrontendDocumentProcessor 
                          document={document}
                          onUpdate={onUpdate}
                        />
                        
                        {document.category && (
                          <Badge variant="secondary" className="text-xs">
                            {document.category}
                          </Badge>
                        )}
                        
                        {document.ai_analysis_summary && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            🤖 AI-analysert
                          </Badge>
                        )}
                      </div>

                      {document.ai_analysis_summary && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                          <strong>AI-sammendrag:</strong> {document.ai_analysis_summary.substring(0, 200)}
                          {document.ai_analysis_summary.length > 200 && '...'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(document)}
                      title="Last ned dokument"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteDocument.mutate(document.id)}
                      disabled={deleteDocument.isPending}
                      title="Slett dokument"
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
