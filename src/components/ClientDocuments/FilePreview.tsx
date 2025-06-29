import { logger } from '@/utils/logger';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Download, X, FileText, Image, FileSpreadsheet } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface FilePreviewProps {
  file: File;
  isOpen: boolean;
  onClose: () => void;
}

const FilePreview = ({ file, isOpen, onClose }: FilePreviewProps) => {
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'text' | 'image' | 'pdf' | 'unsupported'>('unsupported');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !file) return;

    const generatePreview = async () => {
      setIsLoading(true);
      logger.log('Generating preview for:', file.name, file.type);

      try {
        if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          setPreviewContent(url);
          setPreviewType('image');
        } else if (file.type === 'application/pdf') {
          // For PDF, vi viser bare info om filen siden vi ikke kan rendre PDF direkte
          setPreviewContent(`PDF-dokument: ${file.name}\nStørrelse: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
          setPreviewType('pdf');
        } else if (file.type.includes('text') || file.name.endsWith('.txt')) {
          const text = await file.text();
          setPreviewContent(text.substring(0, 1000) + (text.length > 1000 ? '...' : ''));
          setPreviewType('text');
        } else if (file.type.includes('csv')) {
          const text = await file.text();
          const lines = text.split('\n').slice(0, 10);
          setPreviewContent(lines.join('\n') + (text.split('\n').length > 10 ? '\n...' : ''));
          setPreviewType('text');
        } else {
          setPreviewType('unsupported');
          setPreviewContent(`Filtype: ${file.type}\nStørrelse: ${(file.size / 1024 / 1024).toFixed(2)} MB\nPreview ikke støttet for denne filtypen.`);
        }
      } catch (error) {
        logger.error('Preview generation failed:', error);
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
    return <FileText className="h-5 w-5" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon()}
            Preview: {file.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Filtype:</strong> {file.type || 'Ukjent'}
            </div>
            <div>
              <strong>Størrelse:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
            <div>
              <strong>Sist endret:</strong> {new Date(file.lastModified).toLocaleDateString('nb-NO')}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-4">
                {previewType === 'image' && previewContent && (
                  <img 
                    src={previewContent} 
                    alt={file.name}
                    className="max-w-full max-h-96 object-contain mx-auto rounded"
                  />
                )}
                
                {previewType === 'text' && (
                  <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded max-h-96 overflow-auto">
                    {previewContent}
                  </pre>
                )}
                
                {previewType === 'pdf' && (
                  <div className="text-center p-8 bg-blue-50 rounded">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-blue-600" />
                    <div className="text-sm text-gray-600 whitespace-pre-line">
                      {previewContent}
                    </div>
                    <p className="mt-4 text-sm text-blue-600">
                      Last ned filen for å se fullstendig innhold
                    </p>
                  </div>
                )}
                
                {previewType === 'unsupported' && (
                  <div className="text-center p-8 bg-gray-50 rounded">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <div className="text-sm text-gray-600 whitespace-pre-line">
                      {previewContent}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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

export default FilePreview;
