
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUp, FileText, AlertCircle, Upload, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePDFConversions } from '@/hooks/usePDFConversions';

interface PDFUploadManagerProps {
  onUploadComplete?: (conversionData: any) => void;
}

const PDFUploadManager = ({ onUploadComplete }: PDFUploadManagerProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [conversionType, setConversionType] = useState<'full' | 'summary' | 'checklist'>('full');
  
  const { uploadAndCreateConversion } = usePDFConversions();

  // Fetch knowledge categories for the dropdown
  const { data: categories } = useQuery({
    queryKey: ['knowledge-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        // Auto-suggest title from filename
        const fileName = selectedFile.name.replace('.pdf', '');
        if (!title) {
          setTitle(fileName);
        }
      } else {
        // Handle non-PDF files
        alert('Kun PDF-filer er støttet.');
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  const handleUpload = async () => {
    if (!file || !title || !categoryId) {
      alert('Fyll ut alle påkrevde felt og velg en PDF-fil.');
      return;
    }

    try {
      const result = await uploadAndCreateConversion.mutateAsync({
        file,
        title,
        categoryId,
        conversionType
      });

      // Notify parent component
      onUploadComplete?.(result);

      // Reset form
      setFile(null);
      setTitle('');
      setCategoryId('');
      setConversionType('full');

    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUp className="h-5 w-5" />
          PDF til Strukturert Artikkel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload Zone */}
        <div>
          <Label htmlFor="pdf-upload">PDF-dokument *</Label>
          {!file ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={uploadAndCreateConversion.isPending}
                className="hidden"
              />
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Klikk for å velge PDF-fil eller dra og slipp her
                </p>
                <p className="text-sm text-gray-500">
                  Maksimal filstørrelse: 50MB
                </p>
              </label>
            </div>
          ) : (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  disabled={uploadAndCreateConversion.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <Label htmlFor="title">Artikkel tittel *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="F.eks: ISA 315 - Risikovurdering"
            disabled={uploadAndCreateConversion.isPending}
          />
        </div>

        {/* Category Selection */}
        <div>
          <Label htmlFor="category">Kategori *</Label>
          <Select 
            value={categoryId} 
            onValueChange={setCategoryId} 
            disabled={uploadAndCreateConversion.isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Velg kategori" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Conversion Type */}
        <div>
          <Label htmlFor="conversion-type">Konverteringstype</Label>
          <Select 
            value={conversionType} 
            onValueChange={(value: any) => setConversionType(value)} 
            disabled={uploadAndCreateConversion.isPending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Full konvertering - Strukturert artikkel med alle detaljer</SelectItem>
              <SelectItem value="summary">Sammendrag - Nøkkelpunkter og referanser</SelectItem>
              <SelectItem value="checklist">Sjekkliste - Interaktiv arbeidsmal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Processing Info */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Konverteringsprosess:</p>
              <ul className="list-disc list-inside text-blue-800 mt-1 space-y-1">
                <li>Filen lastes opp til sikker lagring</li>
                <li>Teksten ekstraheres og struktureres automatisk</li>
                <li>Innholdet optimaliseres for søk og AI-bruk</li>
                <li>Artikkelen blir tilgjengelig i kunnskapsbasen</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <Button 
          onClick={handleUpload} 
          disabled={!file || !title || !categoryId || uploadAndCreateConversion.isPending}
          className="w-full"
        >
          {uploadAndCreateConversion.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Laster opp og starter konvertering...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Start PDF-konvertering
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PDFUploadManager;
