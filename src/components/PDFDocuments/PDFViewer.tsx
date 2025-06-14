
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from 'lucide-react';
import { PDFDocument } from '@/hooks/usePDFDocuments';

interface PDFViewerProps {
  document: PDFDocument;
  isOpen: boolean;
  onClose: () => void;
  getDocumentUrl: (filePath: string) => Promise<string | null>;
}

const PDFViewer = ({ document, isOpen, onClose, getDocumentUrl }: PDFViewerProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  useEffect(() => {
    if (isOpen && document) {
      setIsLoadingUrl(true);
      setPdfUrl(null);
      getDocumentUrl(document.file_path)
        .then(url => {
          setPdfUrl(url);
        })
        .finally(() => {
          setIsLoadingUrl(false);
        });
    }
  }, [isOpen, document, getDocumentUrl]);

  const handleDownload = async () => {
    if (!pdfUrl) return;
    const link = window.document.createElement('a');
    link.href = pdfUrl;
    link.download = document.file_name;
    link.click();
  };

  const handleOpenInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <span>{document.title}</span>
              {document.isa_number && (
                <span className="text-sm text-gray-500 ml-2">(ISA {document.isa_number})</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={!pdfUrl || isLoadingUrl}>
                <Download className="h-4 w-4 mr-2" />
                Last ned
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenInNewTab} disabled={!pdfUrl || isLoadingUrl}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Åpne i ny fane
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 border rounded-lg overflow-hidden flex items-center justify-center bg-gray-100">
          {isLoadingUrl ? (
            <p>Laster sikker PDF-visning...</p>
          ) : pdfUrl ? (
            <object
              data={pdfUrl}
              type="application/pdf"
              className="w-full h-full"
              title={document.title}
            >
              <div className="p-4 text-center flex flex-col items-center justify-center h-full">
                <p className="mb-4">Nettleseren din kan ikke vise PDF-er direkte i dette vinduet.</p>
                <Button asChild>
                  <a href={pdfUrl} download={document.file_name}>
                    <Download className="h-4 w-4 mr-2" />
                    Last ned PDF-filen i stedet
                  </a>
                </Button>
              </div>
            </object>
          ) : (
            <p className="text-red-500">Kunne ikke laste PDF-filen.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewer;
