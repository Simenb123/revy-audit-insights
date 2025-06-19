
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, X } from 'lucide-react';
import { useClientDocuments, DocumentCategory } from '@/hooks/useClientDocuments';
import { toast } from '@/components/ui/use-toast';

interface DocumentUploaderProps {
  clientId: string;
  categories: DocumentCategory[];
}

const DocumentUploader = ({ clientId, categories }: DocumentUploaderProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubjectArea, setSelectedSubjectArea] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  
  const { uploadDocument } = useClientDocuments(clientId);

  const subjectAreas = [...new Set(categories.map(c => c.subject_area))];
  const filteredCategories = selectedSubjectArea 
    ? categories.filter(c => c.subject_area === selectedSubjectArea)
    : categories;

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
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

    if (validFiles.length !== fileArray.length) {
      toast({
        title: "Noen filer ble ignorert",
        description: "Kun PDF, Word, Excel, CSV og bilderfiler under 50MB er støttet.",
        variant: "destructive"
      });
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
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
        await uploadDocument.mutateAsync({
          file,
          clientId,
          category: selectedCategory || undefined,
          subjectArea: selectedSubjectArea || undefined
        });
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }

    // Reset form
    setSelectedFiles([]);
    setSelectedCategory('');
    setSelectedSubjectArea('');
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
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
            ${uploadDocument.isPending ? 'pointer-events-none opacity-50' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="document-upload"
            className="hidden"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={uploadDocument.isPending}
          />
          <label htmlFor="document-upload" className="cursor-pointer">
            <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">
              Dra og slipp filer her, eller klikk for å velge
            </p>
            <p className="text-sm text-muted-foreground">
              Støtter PDF, Word, Excel, CSV og bilder (maks 50MB per fil)
            </p>
          </label>
        </div>

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
                <SelectItem value="ai-suggest">AI vil foreslå kategori</SelectItem>
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
