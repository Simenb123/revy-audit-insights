import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, X } from 'lucide-react';
import { ClientDocument } from '@/hooks/useClientDocuments';

interface DocumentViewerProps {
  document: ClientDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (documentId: string, fileName: string) => void;
}

const DocumentViewer = ({ document, isOpen, onClose, onDownload }: DocumentViewerProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleOpenInNewTab = async () => {
    if (!document) return;
    
    try {
      // Get signed URL and open in new tab
      const response = await fetch(`/api/documents/${document.id}/url`);
      const { url } = await response.json();
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Failed to open document:', error);
    }
  };

  const handleDownload = () => {
    if (document) {
      onDownload(document.id, document.file_name);
    }
  };

  if (!document) return null;

  const isPDF = document.mime_type.includes('pdf');
  const isImage = document.mime_type.includes('image');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex-1">
            <DialogTitle className="text-lg truncate pr-4">
              {document.file_name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {(document.file_size / 1024 / 1024).toFixed(1)} MB • {document.mime_type}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Last ned
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenInNewTab}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Ny fane
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isPDF ? (
            <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">📄</div>
                <p className="text-lg font-medium mb-2">PDF-visning</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Klikk "Ny fane" for å åpne dokumentet i nettleseren
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleOpenInNewTab} className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Åpne i ny fane
                  </Button>
                  <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Last ned
                  </Button>
                </div>
              </div>
            </div>
          ) : isImage ? (
            <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
              <img 
                src={pdfUrl || ''} 
                alt={document.file_name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">📁</div>
                <p className="text-lg font-medium mb-2">{document.file_name}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Forhåndsvisning ikke tilgjengelig for denne filtypen
                </p>
                <Button onClick={handleDownload} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Last ned fil
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewer;