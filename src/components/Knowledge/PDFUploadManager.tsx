
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUp, FileText, AlertCircle, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface PDFUploadManagerProps {
  onUploadComplete?: (conversionData: any) => void;
}

const PDFUploadManager = ({ onUploadComplete }: PDFUploadManagerProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [conversionType, setConversionType] = useState<'full' | 'summary' | 'checklist'>('full');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

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
        toast({
          title: "Ugyldig filtype",
          description: "Kun PDF-filer er støttet.",
          variant: "destructive"
        });
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setUploadProgress(0);
  };

  const uploadFileToStorage = async (file: File, userId: string): Promise<string> => {
    const fileExt = 'pdf';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error } = await supabase.storage
      .from('pdf-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    return filePath;
  };

  const createConversionRecord = async (data: {
    filePath: string;
    fileName: string;
    fileSize: number;
    title: string;
    categoryId: string;
    conversionType: string;
    userId: string;
  }) => {
    const { data: conversion, error } = await supabase
      .from('pdf_conversions')
      .insert({
        user_id: data.userId,
        file_name: data.fileName,
        file_path: data.filePath,
        file_size: data.fileSize,
        title: data.title,
        category_id: data.categoryId,
        conversion_type: data.conversionType,
        status: 'uploading'
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create conversion record: ${error.message}`);
    }

    return conversion;
  };

  const startConversionProcess = async (conversionId: string, filePath: string) => {
    const { error } = await supabase.functions.invoke('pdf-converter', {
      body: {
        conversionId,
        filePath,
        conversionType,
        title,
        categoryId
      }
    });

    if (error) {
      throw new Error(`Conversion failed: ${error.message}`);
    }
  };

  const handleUpload = async () => {
    if (!file || !title || !categoryId) {
      toast({
        title: "Manglende informasjon",
        description: "Fyll ut alle påkrevde felt og velg en PDF-fil.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Du må være logget inn for å laste opp filer');
      }

      // Step 1: Upload file to storage
      setUploadProgress(25);
      const filePath = await uploadFileToStorage(file, user.id);

      // Step 2: Create conversion record
      setUploadProgress(50);
      const conversion = await createConversionRecord({
        filePath,
        fileName: file.name,
        fileSize: file.size,
        title,
        categoryId,
        conversionType,
        userId: user.id
      });

      // Step 3: Start conversion process
      setUploadProgress(75);
      await startConversionProcess(conversion.id, filePath);

      setUploadProgress(100);

      toast({
        title: "Upload fullført!",
        description: `${title} er nå i konverteringskøen.`,
      });

      // Notify parent component
      onUploadComplete?.(conversion);

      // Reset form
      setFile(null);
      setTitle('');
      setCategoryId('');
      setConversionType('full');
      setUploadProgress(0);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload feilet",
        description: error.message || "Det oppstod en feil under opplasting.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
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
                disabled={isUploading}
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
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{uploadProgress}% lastet opp</p>
                </div>
              )}
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
            disabled={isUploading}
          />
        </div>

        {/* Category Selection */}
        <div>
          <Label htmlFor="category">Kategori *</Label>
          <Select value={categoryId} onValueChange={setCategoryId} disabled={isUploading}>
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
          <Select value={conversionType} onValueChange={(value: any) => setConversionType(value)} disabled={isUploading}>
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
          disabled={!file || !title || !categoryId || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {uploadProgress < 100 ? `Laster opp... ${uploadProgress}%` : 'Starter konvertering...'}
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
