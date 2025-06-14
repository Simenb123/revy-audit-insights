
import React from 'react';
import { PDFDocument } from '@/types/pdf';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Download, Trash2, Eye } from 'lucide-react';
import ExtractionStatusIndicator from './ExtractionStatusIndicator';

interface PDFDocumentItemProps {
  document: PDFDocument;
  onView: (document: PDFDocument) => void;
  onToggleFavorite: (documentId: string) => void;
  onDownload: (document: PDFDocument) => void;
  onDelete: (documentId: string) => void;
}

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    isa: 'ISA',
    regnskapsstandarder: 'NRS',
    laws: 'Lover',
    internal: 'Intern',
    other: 'Annet'
  };
  return labels[category] || category;
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    isa: 'bg-blue-100 text-blue-800',
    regnskapsstandarder: 'bg-teal-100 text-teal-800',
    laws: 'bg-green-100 text-green-800',
    internal: 'bg-purple-100 text-purple-800',
    other: 'bg-gray-100 text-gray-800'
  };
  return colors[category] || colors.other;
};

const PDFDocumentItem = ({
  document,
  onView,
  onToggleFavorite,
  onDownload,
  onDelete,
}: PDFDocumentItemProps) => {
  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <ExtractionStatusIndicator status={document.text_extraction_status} />
            <h3 className="font-medium text-lg">{document.title}</h3>
            <div className="flex items-center gap-2">
              {document.isa_number && (
                <Badge variant="outline" className="text-xs">
                  ISA {document.isa_number}
                </Badge>
              )}
              {document.nrs_number && (
                <Badge variant="outline" className="text-xs">
                  NRS {document.nrs_number}
                </Badge>
              )}
              <Badge className={`text-xs ${getCategoryColor(document.category)}`}>
                {getCategoryLabel(document.category)}
              </Badge>
              {document.is_favorite && (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              )}
            </div>
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
            onClick={() => onView(document)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleFavorite(document.id)}
          >
            <Star className={`h-4 w-4 ${document.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDownload(document)}
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(document.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PDFDocumentItem;
