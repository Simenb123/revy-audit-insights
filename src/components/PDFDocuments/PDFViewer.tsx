
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from 'lucide-react';
import { PDFDocument } from '@/hooks/usePDFDocuments';

interface PDFViewerProps {
  document: PDFDocument;
  isOpen: boolean;
  onClose: () => void;
  getDocumentUrl: (filePath: string) => string;
}

const PDFViewer = ({ document, isOpen, onClose, getDocumentUrl }: PDFViewerProps) => {
  const pdfUrl = getDocumentUrl(document.file_path);

  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = pdfUrl;
    link.download = document.file_name;
    link.click();
  };

  const handleOpenInNewTab = () => {
    window.open(pdfUrl, '_blank');
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
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Last ned
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Åpne i ny fane
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 border rounded-lg overflow-hidden">
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-full"
            title={document.title}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewer;
