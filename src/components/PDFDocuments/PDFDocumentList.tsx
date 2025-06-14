import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Star, 
  Download, 
  Trash2, 
  Search,
  Filter,
  Eye
} from 'lucide-react';
import { usePDFDocuments, PDFDocument } from '@/hooks/usePDFDocuments';
import PDFViewer from './PDFViewer';

const PDFDocumentList = () => {
  const { documents, isLoading, toggleFavorite, deleteDocument, getDocumentUrl } = usePDFDocuments();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<PDFDocument | null>(null);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.isa_number?.includes(searchTerm);
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    const matchesFavorites = !favoritesOnly || doc.is_favorite;
    
    return matchesSearch && matchesCategory && matchesFavorites;
  });

  const handleDownload = async (document: PDFDocument) => {
    const url = await getDocumentUrl(document.file_path);
    if (!url) return; // Error is handled in the hook
    const link = window.document.createElement('a');
    link.href = url;
    link.download = document.file_name;
    link.click();
  };

  const handleView = (document: PDFDocument) => {
    setSelectedDocument(document);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      isa: 'ISA',
      laws: 'Lover',
      internal: 'Intern',
      other: 'Annet'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      isa: 'bg-blue-100 text-blue-800',
      laws: 'bg-green-100 text-green-800',
      internal: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
  };

  if (isLoading) {
    return <div className="animate-pulse">Laster dokumenter...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PDF-dokumenter ({documents.length})
          </CardTitle>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Søk i dokumenter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Alle kategorier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle kategorier</SelectItem>
                <SelectItem value="isa">ISA Standarder</SelectItem>
                <SelectItem value="laws">Lover og forskrifter</SelectItem>
                <SelectItem value="internal">Interne retningslinjer</SelectItem>
                <SelectItem value="other">Andre dokumenter</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant={favoritesOnly ? "default" : "outline"}
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              className="flex items-center gap-2"
            >
              <Star className={`h-4 w-4 ${favoritesOnly ? 'fill-current' : ''}`} />
              Favoritter
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || categoryFilter !== 'all' || favoritesOnly 
                ? 'Ingen dokumenter matcher søkekriteriene'
                : 'Ingen dokumenter lastet opp ennå'
              }
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map((document) => (
                <div key={document.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-lg">{document.title}</h3>
                        {document.isa_number && (
                          <Badge variant="outline" className="text-xs">
                            ISA {document.isa_number}
                          </Badge>
                        )}
                        <Badge className={`text-xs ${getCategoryColor(document.category)}`}>
                          {getCategoryLabel(document.category)}
                        </Badge>
                        {document.is_favorite && (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        )}
                      </div>
                      
                      {document.description && (
                        <p className="text-gray-600 text-sm mb-2">{document.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{document.file_name}</span>
                        <span>{(document.file_size / 1024 / 1024).toFixed(1)} MB</span>
                        <span>{new Date(document.created_at).toLocaleDateString('no-NO')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(document)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite.mutate(document.id)}
                      >
                        <Star className={`h-4 w-4 ${document.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(document)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDocument.mutate(document.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedDocument && (
        <PDFViewer
          document={selectedDocument}
          isOpen={!!selectedDocument}
          onClose={() => setSelectedDocument(null)}
          getDocumentUrl={getDocumentUrl}
        />
      )}
    </>
  );
};

export default PDFDocumentList;
