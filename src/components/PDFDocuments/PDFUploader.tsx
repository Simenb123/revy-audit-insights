
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText } from 'lucide-react';
import { usePDFDocuments } from '@/hooks/usePDFDocuments';

const PDFUploader = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('isa');
  const [isaNumber, setIsaNumber] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const { uploadDocument } = usePDFDocuments();

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
    setSelectedFiles(pdfFiles);
    
    // Auto-detect ISA number from filename if it's an ISA document
    if (pdfFiles.length === 1) {
      const fileName = pdfFiles[0].name;
      const isaMatch = fileName.match(/ISA\s*(\d+)/i);
      if (isaMatch) {
        setIsaNumber(isaMatch[1]);
        setTitle(fileName.replace(/\.pdf$/i, ''));
        setCategory('isa');
      } else {
        setTitle(fileName.replace(/\.pdf$/i, ''));
      }
    }
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

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !title.trim()) return;

    for (const file of selectedFiles) {
      await uploadDocument.mutateAsync({
        file,
        title: selectedFiles.length === 1 ? title : file.name.replace(/\.pdf$/i, ''),
        description,
        category,
        isaNumber: category === 'isa' ? isaNumber : undefined,
        tags: category === 'isa' ? ['ISA', `ISA ${isaNumber}`] : undefined
      });
    }

    // Reset form
    setSelectedFiles([]);
    setTitle('');
    setDescription('');
    setIsaNumber('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Last opp PDF-dokumenter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Drop Zone */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging ? 'border-revio-500 bg-revio-50' : 'border-gray-300 hover:border-revio-300'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="pdf-upload"
            className="hidden"
            multiple
            accept=".pdf"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <label htmlFor="pdf-upload" className="cursor-pointer">
            <FileText className="h-12 w-12 text-revio-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Dra og slipp PDF-filer her, eller klikk for å velge
            </p>
            <p className="text-sm text-gray-500">
              Støtter kun PDF-filer
            </p>
          </label>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <Label>Valgte filer:</Label>
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <FileText className="h-4 w-4" />
                <span className="text-sm">{file.name}</span>
                <span className="text-xs text-gray-500">
                  ({(file.size / 1024 / 1024).toFixed(1)} MB)
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Document Details */}
        {selectedFiles.length > 0 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Tittel *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Dokumenttittel"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kort beskrivelse av dokumentet"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="category">Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="isa">ISA Standarder</SelectItem>
                  <SelectItem value="laws">Lover og forskrifter</SelectItem>
                  <SelectItem value="internal">Interne retningslinjer</SelectItem>
                  <SelectItem value="other">Andre dokumenter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {category === 'isa' && (
              <div>
                <Label htmlFor="isa-number">ISA Nummer</Label>
                <Input
                  id="isa-number"
                  value={isaNumber}
                  onChange={(e) => setIsaNumber(e.target.value)}
                  placeholder="f.eks. 200, 210, 315"
                />
              </div>
            )}

            <Button 
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || !title.trim() || uploadDocument.isPending}
              className="w-full"
            >
              {uploadDocument.isPending ? 'Laster opp...' : `Last opp ${selectedFiles.length} fil(er)`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PDFUploader;
