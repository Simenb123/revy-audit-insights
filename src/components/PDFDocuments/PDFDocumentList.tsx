
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from 'lucide-react';
import { usePDFDocuments, PDFDocument } from '@/hooks/usePDFDocuments';
import PDFViewer from './PDFViewer';
import { useDocumentFilters } from '@/hooks/pdf/useDocumentFilters';
import PDFDocumentFilters from './PDFDocumentFilters';
import PDFDocumentItem from './PDFDocumentItem';

const PDFDocumentList = () => {
  const { documents, isLoading, toggleFavorite, deleteDocument, getDocumentUrl, retryTextExtraction } = usePDFDocuments();
  const [selectedDocument, setSelectedDocument] = useState<PDFDocument | null>(null);

  const {
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    favoritesOnly,
    setFavoritesOnly,
    filteredDocuments,
  } = useDocumentFilters(documents);

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

  if (isLoading) {
    return <div className="text-center py-8">Laster dokumenter...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PDF-dokumenter ({documents.length})
          </CardTitle>
          
          <div className="pt-4">
            <PDFDocumentFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              favoritesOnly={favoritesOnly}
              setFavoritesOnly={setFavoritesOnly}
            />
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
                <PDFDocumentItem
                  key={document.id}
                  document={document}
                  onView={handleView}
                  onToggleFavorite={toggleFavorite.mutate}
                  onDownload={handleDownload}
                  onDelete={deleteDocument.mutate}
                  onRetryExtraction={retryTextExtraction.mutate}
                />
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
