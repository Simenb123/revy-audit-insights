
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  Brain, 
  Link2,
  Calendar,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import { toast } from 'sonner';
import IntelligentDocumentLinker from './IntelligentDocumentLinker';
import SmartDocumentSearch from './SmartDocumentSearch';

interface EnhancedDocumentListProps {
  clientId: string;
}

const EnhancedDocumentList: React.FC<EnhancedDocumentListProps> = ({ clientId }) => {
  const { documents, deleteDocument, getDocumentUrl, isLoading } = useClientDocuments(clientId);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Filtrer dokumenter basert på søketerm og kategori
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.ai_analysis_summary?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Grupper dokumenter etter AI-sikkerhet
  const groupDocumentsByConfidence = () => {
    const high = filteredDocuments.filter(d => d.ai_confidence_score && d.ai_confidence_score >= 0.8);
    const medium = filteredDocuments.filter(d => d.ai_confidence_score && d.ai_confidence_score >= 0.6 && d.ai_confidence_score < 0.8);
    const low = filteredDocuments.filter(d => d.ai_confidence_score && d.ai_confidence_score < 0.6);
    const unprocessed = filteredDocuments.filter(d => !d.ai_confidence_score);
    
    return { high, medium, low, unprocessed };
  };

  const { high, medium, low, unprocessed } = groupDocumentsByConfidence();

  const handleDownload = async (document: any) => {
    try {
      const url = await getDocumentUrl(document.file_path);
      if (url) {
        window.open(url, '_blank');
      } else {
        toast.error("Kunne ikke laste ned - dokumentet er ikke tilgjengelig");
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Nedlasting feilet - prøv igjen senere");
    }
  };

  const handleDelete = async (documentId: string, fileName: string) => {
    if (window.confirm(`Er du sikker på at du vil slette "${fileName}"?`)) {
      try {
        await deleteDocument.mutateAsync(documentId);
        if (selectedDocumentId === documentId) {
          setSelectedDocumentId(undefined);
        }
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const getConfidenceBadge = (score?: number) => {
    if (!score) return <Badge variant="secondary">Ikke prosessert</Badge>;
    
    if (score >= 0.8) {
      return <Badge className="bg-green-100 text-green-800">Høy sikkerhet ({Math.round(score * 100)}%)</Badge>;
    } else if (score >= 0.6) {
      return <Badge className="bg-yellow-100 text-yellow-800">Middels sikkerhet ({Math.round(score * 100)}%)</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Lav sikkerhet ({Math.round(score * 100)}%)</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const DocumentCard = ({ document, isSelected, onSelect }: any) => (
    <Card 
      className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}
      onClick={() => onSelect(document.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <FileText className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-sm truncate" title={document.file_name}>
                {document.file_name}
              </h4>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>{new Date(document.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>{formatFileSize(document.file_size)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(document);
              }}
            >
              <Download className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(document.id, document.file_name);
              }}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {document.category && (
            <Badge variant="outline" className="text-xs">
              {document.category}
            </Badge>
          )}
          
          {getConfidenceBadge(document.ai_confidence_score)}
          
          {document.ai_analysis_summary && (
            <div className="p-2 bg-purple-50 border border-purple-200 rounded text-xs">
              <div className="flex items-center gap-1 mb-1">
                <Brain className="h-3 w-3 text-purple-600" />
                <span className="font-medium text-purple-900">AI-analyse</span>
              </div>
              <p className="text-purple-700 line-clamp-2">
                {document.ai_analysis_summary}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="documents">
            Dokumenter ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-1" />
            Smart søk
          </TabsTrigger>
          <TabsTrigger value="links">
            <Link2 className="h-4 w-4 mr-1" />
            Koblinger
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Brain className="h-4 w-4 mr-1" />
            AI-innsikt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          {/* Søk og filter */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Søk i dokumenter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Alle kategorier</option>
              <option value="hovedbok">Hovedbok</option>
              <option value="saldobalanse">Saldobalanse</option>
              <option value="faktura">Faktura</option>
              <option value="lonnslipp">Lønnsslipp</option>
            </select>
          </div>

          {/* Dokumenter gruppert etter AI-sikkerhet */}
          <div className="space-y-6">
            {high.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">Høy AI-sikkerhet</Badge>
                  <span className="text-sm font-normal text-gray-600">({high.length} dokumenter)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {high.map(doc => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      isSelected={selectedDocumentId === doc.id}
                      onSelect={setSelectedDocumentId}
                    />
                  ))}
                </div>
              </div>
            )}

            {medium.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                  <Badge className="bg-yellow-100 text-yellow-800">Middels AI-sikkerhet</Badge>
                  <span className="text-sm font-normal text-gray-600">({medium.length} dokumenter)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {medium.map(doc => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      isSelected={selectedDocumentId === doc.id}
                      onSelect={setSelectedDocumentId}
                    />
                  ))}
                </div>
              </div>
            )}

            {low.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-800">Lav AI-sikkerhet</Badge>
                  <span className="text-sm font-normal text-gray-600">({low.length} dokumenter - trenger gjennomgang)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {low.map(doc => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      isSelected={selectedDocumentId === doc.id}
                      onSelect={setSelectedDocumentId}
                    />
                  ))}
                </div>
              </div>
            )}

            {unprocessed.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Badge variant="secondary">Ikke prosessert</Badge>
                  <span className="text-sm font-normal text-gray-600">({unprocessed.length} dokumenter)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {unprocessed.map(doc => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      isSelected={selectedDocumentId === doc.id}
                      onSelect={setSelectedDocumentId}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredDocuments.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Ingen dokumenter funnet</h3>
                <p>Ingen dokumenter matcher søkekriteriene dine</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="search">
          <SmartDocumentSearch clientId={clientId} />
        </TabsContent>

        <TabsContent value="links">
          <IntelligentDocumentLinker 
            clientId={clientId} 
            selectedDocumentId={selectedDocumentId}
          />
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Revi dokumentinnsikt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{high.length}</div>
                  <div className="text-sm text-green-700">Dokumenter med høy AI-sikkerhet</div>
                  <div className="text-xs text-green-600 mt-1">Klar for bruk</div>
                </div>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{medium.length + low.length}</div>
                  <div className="text-sm text-yellow-700">Trenger gjennomgang</div>
                  <div className="text-xs text-yellow-600 mt-1">Middels/lav sikkerhet</div>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{unprocessed.length}</div>
                  <div className="text-sm text-blue-700">Ikke prosessert</div>
                  <div className="text-xs text-blue-600 mt-1">Venter på AI-analyse</div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">AI-Revi anbefalinger</h4>
                <ul className="space-y-1 text-sm text-purple-700">
                  {low.length > 0 && (
                    <li>• Start med å gjennomgå {low.length} dokumenter med lav AI-sikkerhet</li>
                  )}
                  {unprocessed.length > 0 && (
                    <li>• {unprocessed.length} dokumenter venter fortsatt på AI-analyse</li>
                  )}
                  {high.length > medium.length + low.length && (
                    <li>• Utmerket! Flesteparten av dokumentene har høy AI-sikkerhet</li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedDocumentList;
