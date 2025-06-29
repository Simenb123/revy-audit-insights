import { logger } from '@/utils/logger';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { PDFDocument as PDFDocumentType } from '@/hooks/usePDFDocuments';

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  document: PDFDocumentType;
  isOpen: boolean;
  onClose: () => void;
  getDocumentUrl: (filePath: string) => Promise<string | null>;
}

const PDFViewer = ({ document, isOpen, onClose, getDocumentUrl }: PDFViewerProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  useEffect(() => {
    if (isOpen && document) {
      setIsLoadingUrl(true);
      setPdfUrl(null);
      setNumPages(null);
      setPageNumber(1);
      setScale(1.0);

      getDocumentUrl(document.file_path)
        .then(url => {
          setPdfUrl(url);
        })
        .finally(() => {
          setIsLoadingUrl(false);
        });
    }
  }, [isOpen, document, getDocumentUrl]);

  function onDocumentLoadSuccess({ numPages: nextNumPages }: { numPages: number }) {
    setNumPages(nextNumPages);
  }

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

  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  
  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
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
        
        {numPages && (
          <div className="flex items-center justify-center gap-4 p-2 bg-background border-y mt-4">
            <Button variant="ghost" size="sm" onClick={goToPrevPage} disabled={pageNumber <= 1}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Forrige
            </Button>
            <span className="text-sm">Side {pageNumber} av {numPages}</span>
            <Button variant="ghost" size="sm" onClick={goToNextPage} disabled={pageNumber >= numPages}>
              Neste <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut} disabled={scale <= 0.5}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="min-w-[40px] text-center text-sm">{Math.round(scale * 100)}%</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn} disabled={scale >= 3}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto flex items-start justify-center bg-gray-100 p-4">
          {isLoadingUrl ? (
            <p className="m-auto text-muted-foreground">Laster sikker PDF-visning...</p>
          ) : pdfUrl ? (
            <div className="relative">
                <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={(error) => logger.error('Failed to load PDF:', error)}
                    loading={<div className="m-auto text-muted-foreground">Laster PDF-dokument...</div>}
                    error={
                        <div className="p-4 text-center m-auto bg-card rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-destructive mb-2">Feil ved lasting av PDF</h3>
                        <p className="mb-4 text-sm text-muted-foreground">Dette kan være fordi filen er korrupt, eller at visning i nettleser ikke er støttet for denne filen.</p>
                        <Button asChild>
                            <a href={pdfUrl} download={document.file_name}>
                            <Download className="h-4 w-4 mr-2" />
                            Prøv å laste ned i stedet
                            </a>
                        </Button>
                        </div>
                    }
                    className="flex justify-center"
                    >
                    <Page 
                        pageNumber={pageNumber} 
                        scale={scale} 
                        className="shadow-lg"
                    />
                </Document>
            </div>
          ) : (
            <p className="m-auto text-destructive">Kunne ikke hente URL for PDF-filen.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewer;
