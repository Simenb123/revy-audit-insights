import { logger } from '@/utils/logger';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import FileDropZone from '../common/FileDropZone';
import { useClientDocuments, DocumentCategory } from '@/hooks/useClientDocuments';
import { toast } from '@/components/ui/use-toast';

interface DocumentUploaderProps {
  clientId: string;
  categories: DocumentCategory[];
  enableAIProgress?: boolean;
}

const DocumentUploader = ({ clientId, categories, enableAIProgress = false }: DocumentUploaderProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubjectArea, setSelectedSubjectArea] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  
  const { uploadDocument } = useClientDocuments(clientId);

  const subjectAreas = [...new Set(categories.map(c => c.subject_area))];
  const filteredCategories = selectedSubjectArea 
    ? categories.filter(c => c.subject_area === selectedSubjectArea)
    : categories;

  const handleFileSelect = (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
        'image/jpeg',
        'image/png'
      ];
      return validTypes.includes(file.type) && file.size <= 50 * 1024 * 1024; // 50MB limit
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Noen filer ble ignorert",
        description: "Kun PDF, Word, Excel, CSV og bilderfiler under 50MB er støttet.",
        variant: "destructive"
      });
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    if (enableAIProgress) {
      setUploadProgress(prev => {
        const copy = { ...prev };
        validFiles.forEach(f => {
          copy[f.name] = 0;
        });
        return copy;
      });
    }
  };


  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "Ingen filer valgt",
        description: "Velg minst én fil for å laste opp.",
        variant: "destructive"
      });
      return;
    }

    for (const file of selectedFiles) {
      try {
        if (enableAIProgress) {
          setUploadProgress(prev => ({ ...prev, [file.name]: 25 }));
        }
        await uploadDocument.mutateAsync({
          file,
          clientId,
          category: selectedCategory || undefined,
          subjectArea: selectedSubjectArea || undefined
        });
        if (enableAIProgress) {
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        }
      } catch (error) {
        logger.error(`Failed to upload ${file.name}:`, error);
        if (enableAIProgress) {
          setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        }
      }
    }

    // Reset form
    setSelectedFiles([]);
    setSelectedCategory('');
    setSelectedSubjectArea('');
    if (enableAIProgress) {
      setUploadProgress({});
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Last opp dokumenter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File drop zone */}
        <FileDropZone
          accept={{
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
          }}
          onFilesSelected={handleFileSelect}
          className={`${uploadDocument.isPending ? 'pointer-events-none opacity-50' : ''}`}
        >
          {(active) => (
            <div>
              <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                {active ? 'Slipp filene' : 'Dra og slipp filer her, eller klikk for å velge'}
              </p>
              <p className="text-sm text-muted-foreground">
                Støtter PDF, Word, Excel, CSV og bilder (maks 50MB per fil)
              </p>
            </div>
          )}
        </FileDropZone>

        {/* Selected files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <Label>Valgte filer:</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(file.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(index)}
                    disabled={uploadDocument.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {enableAIProgress && Object.keys(uploadProgress).length > 0 && (
          <div className="space-y-2">
            {Object.entries(uploadProgress).map(([name, progress]) => (
              <div key={name} className="space-y-1">
                <span className="text-sm">{name}</span>
                <Progress value={progress} />
              </div>
            ))}
          </div>
        )}

        {/* Category selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="subject-area">Fagområde (valgfritt)</Label>
            <Select value={selectedSubjectArea} onValueChange={setSelectedSubjectArea}>
              <SelectTrigger id="subject-area">
                <SelectValue placeholder="Velg fagområde" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Alle fagområder</SelectItem>
                {subjectAreas.map(area => (
                  <SelectItem key={area} value={area}>
                    {area === 'lnn' ? 'Lønn' : area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori (valgfritt)</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Velg kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ai-suggest">AI-Revi vil foreslå kategori</SelectItem>
                {filteredCategories.map(category => (
                  <SelectItem key={category.id} value={category.category_name}>
                    {category.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Upload button */}
        <Button 
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || uploadDocument.isPending}
          className="w-full"
        >
          {uploadDocument.isPending ? 'Laster opp...' : `Last opp ${selectedFiles.length} fil${selectedFiles.length === 1 ? '' : 'er'}`}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DocumentUploader;
