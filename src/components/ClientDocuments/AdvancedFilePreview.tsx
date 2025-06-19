
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Download, X, FileText, Image, FileSpreadsheet, File, ZoomIn, ZoomOut } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import * as XLSX from 'xlsx';

interface AdvancedFilePreviewProps {
  file: File;
  isOpen: boolean;
  onClose: () => void;
}

const AdvancedFilePreview = ({ file, isOpen, onClose }: AdvancedFilePreviewProps) => {
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'text' | 'image' | 'pdf' | 'excel' | 'unsupported'>('unsupported');
  const [isLoading, setIsLoading] = useState(false);
  const [excelData, setExcelData] = useState<any[][]>([]);
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!isOpen || !file) return;

    const generatePreview = async () => {
      setIsLoading(true);
      console.log('Generating advanced preview for:', file.name, file.type);

      try {
        if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          setPreviewContent(url);
          setPreviewType('image');
        } else if (file.type === 'application/pdf') {
          // For PDF, show basic info and first page if possible
          setPreviewContent(`PDF-dokument: ${file.name}\nStørrelse: ${(file.size / 1024 / 1024).toFixed(2)} MB\nSider: Ukjent (preview ikke fullt implementert)`);
          setPreviewType('pdf');
        } else if (file.type.includes('sheet') || file.type.includes('csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          // Excel/Spreadsheet preview
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0, defval: '' });
          
          setExcelData(jsonData.slice(0, 20) as any[][]); // Show first 20 rows
          setPreviewType('excel');
        } else if (file.type.includes('text') || file.name.endsWith('.txt')) {
          const text = await file.text();
          setPreviewContent(text.substring(0, 2000) + (text.length > 2000 ? '\n\n... (tekst avkortet)' : ''));
          setPreviewType('text');
        } else if (file.type.includes('csv')) {
          const text = await file.text();
          const lines = text.split('\n').slice(0, 20);
          setPreviewContent(lines.join('\n') + (text.split('\n').length > 20 ? '\n... (flere rader)' : ''));
          setPreviewType('text');
        } else {
          setPreviewType('unsupported');
          setPreviewContent(`Filtype: ${file.type}\nStørrelse: ${(file.size / 1024 / 1024).toFixed(2)} MB\nPreview ikke støttet for denne filtypen.`);
        }
      } catch (error) {
        console.error('Advanced preview generation failed:', error);
        setPreviewType('unsupported');
        setPreviewContent('Kunne ikke generere preview');
      } finally {
        setIsLoading(false);
      }
    };

    generatePreview();

    return () => {
      if (previewContent && previewType === 'image') {
        URL.revokeObjectURL(previewContent);
      }
    };
  }, [isOpen, file]);

  const getFileIcon = () => {
    if (file.type.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (file.type === 'application/pdf') return <FileText className="h-5 w-5" />;
    if (file.type.includes('sheet') || file.type.includes('csv')) return <FileSpreadsheet className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const renderExcelPreview = () => {
    if (excelData.length === 0) return <div>Ingen data funnet</div>;

    return (
      <div className="overflow-auto max-h-96">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              {excelData[0]?.map((header, index) => (
                <th key={index} className="border border-gray-300 px-2 py-1 text-left text-xs font-medium">
                  {header || `Kolonne ${index + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {excelData.slice(1).map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="border border-gray-300 px-2 py-1 text-xs">
                    {cell?.toString() || ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {excelData.length >= 20 && (
          <div className="text-center text-sm text-gray-500 mt-2">
            ... og flere rader (viser kun de første 20)
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon()}
            Avansert Preview: {file.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File metadata */}
          <div className="grid grid-cols-4 gap-4 text-sm bg-gray-50 p-3 rounded">
            <div>
              <strong>Filtype:</strong> {file.type || 'Ukjent'}
            </div>
            <div>
              <strong>Størrelse:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
            <div>
              <strong>Sist endret:</strong> {new Date(file.lastModified).toLocaleDateString('nb-NO')}
            </div>
            <div>
              <strong>Preview:</strong> {previewType}
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Preview content */}
          {!isLoading && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Innholdsvisning</span>
                  {previewType === 'image' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setZoom(zoom * 1.2)}>
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setZoom(zoom / 1.2)}>
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-gray-500">{Math.round(zoom * 100)}%</span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {previewType === 'image' && previewContent && (
                  <div className="text-center">
                    <img 
                      src={previewContent} 
                      alt={file.name}
                      style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                      className="max-w-full max-h-96 object-contain mx-auto rounded border"
                    />
                  </div>
                )}
                
                {previewType === 'text' && (
                  <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded max-h-96 overflow-auto font-mono">
                    {previewContent}
                  </pre>
                )}
                
                {previewType === 'excel' && renderExcelPreview()}
                
                {previewType === 'pdf' && (
                  <div className="text-center p-8 bg-blue-50 rounded">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-blue-600" />
                    <div className="text-sm text-gray-600 whitespace-pre-line">
                      {previewContent}
                    </div>
                    <p className="mt-4 text-sm text-blue-600">
                      PDF-visning kommer i neste oppdatering
                    </p>
                  </div>
                )}
                
                {previewType === 'unsupported' && (
                  <div className="text-center p-8 bg-gray-50 rounded">
                    <File className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <div className="text-sm text-gray-600 whitespace-pre-line">
                      {previewContent}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Lukk
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedFilePreview;
