
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, X, Bot, Edit, Check } from 'lucide-react';
import { useClientDocuments, DocumentCategory } from '@/hooks/useClientDocuments';
import { toast } from '@/components/ui/use-toast';

interface EnhancedDocumentUploaderProps {
  clientId: string;
  categories: DocumentCategory[];
}

const EnhancedDocumentUploader = ({ clientId, categories }: EnhancedDocumentUploaderProps) => {
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
      return validTypes.includes(file.type) && file.size <= 50 * 1024 * 1024;
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
          category: selectedCategory === 'ai-suggest' ? undefined : selectedCategory,
          subjectArea: selectedSubjectArea === 'none' ? undefined : selectedSubjectArea
        });
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }

    setSelectedFiles([]);
    setSelectedCategory('');
    setSelectedSubjectArea('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Last opp dokumenter med forbedret AI-kategorisering
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informasjonsboks om AI-kategorisering */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <Bot className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Forbedret AI-kategorisering</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• AI analyserer filnavnet og foreslår passende kategori</li>
                <li>• Velg fagområde først for bedre presisjon</li>
                <li>• Du kan overstyre AI-forslaget ved å velge en annen kategori</li>
                <li>• Konfidensscoren viser hvor sikker AI er på forslaget</li>
              </ul>
            </div>
          </div>
        </div>

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

        {/* Selected files with AI preview */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <Label>Valgte filer med AI-forhåndsvisning:</Label>
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <FilePreviewCard 
                  key={index}
                  file={file}
                  onRemove={() => removeFile(index)}
                  categories={filteredCategories}
                  subjectArea={selectedSubjectArea}
                  disabled={uploadDocument.isPending}
                />
              ))}
            </div>
          </div>
        )}

        {/* Category selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="subject-area">Fagområde (anbefalt) *</Label>
            <Select value={selectedSubjectArea} onValueChange={setSelectedSubjectArea}>
              <SelectTrigger id="subject-area">
                <SelectValue placeholder="Velg fagområde for bedre AI-presisjon" />
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
            <Label htmlFor="category">Kategori-override (valgfritt)</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="La AI bestemme eller velg manuelt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ai-suggest">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    AI vil kategorisere automatisk
                  </div>
                </SelectItem>
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
          {uploadDocument.isPending ? 'Laster opp og kategoriserer...' : `Last opp ${selectedFiles.length} fil${selectedFiles.length === 1 ? '' : 'er'}`}
        </Button>
      </CardContent>
    </Card>
  );
};

// Ny komponent for å vise filforhåndsvisning med AI-kategorisering
interface FilePreviewCardProps {
  file: File;
  onRemove: () => void;
  categories: DocumentCategory[];
  subjectArea: string;
  disabled: boolean;
}

const FilePreviewCard = ({ file, onRemove, categories, subjectArea, disabled }: FilePreviewCardProps) => {
  const [editingCategory, setEditingCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Simuler AI-kategorisering basert på filnavn
  const getAISuggestion = () => {
    const fileName = file.name.toLowerCase();
    
    // Forbedrede kategoriseringsmønstre
    const patterns = [
      { pattern: /(lønn|salary|payroll|årsverk)/, category: 'Lønnsrapporter', confidence: 0.9 },
      { pattern: /(timeregistrering|timer|hours)/, category: 'Timeregistrering', confidence: 0.85 },
      { pattern: /(ferie|vacation|holiday)/, category: 'Ferieplaner', confidence: 0.8 },
      { pattern: /(skatt|tax|skattemelding)/, category: 'Skattemelding', confidence: 0.9 },
      { pattern: /(mva|merverdiavgift|vat)/, category: 'MVA-rapporter', confidence: 0.85 },
      { pattern: /(regnskap|accounts|accounting)/, category: 'Regnskapsdata', confidence: 0.8 },
      { pattern: /(balanse|balance)/, category: 'Balanserapporter', confidence: 0.85 },
      { pattern: /(resultat|income|profit)/, category: 'Resultatregnskap', confidence: 0.85 },
      { pattern: /(kontrakt|contract|agreement)/, category: 'Kontrakter', confidence: 0.8 },
      { pattern: /(faktura|invoice|bill)/, category: 'Fakturaer', confidence: 0.9 },
      { pattern: /(kvittering|receipt)/, category: 'Kvitteringer', confidence: 0.85 },
    ];

    for (const { pattern, category, confidence } of patterns) {
      if (pattern.test(fileName)) {
        return { category, confidence };
      }
    }

    return { category: null, confidence: 0 };
  };

  const aiSuggestion = getAISuggestion();

  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <FileText className="h-5 w-5 mt-1" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{file.name}</p>
            <p className="text-sm text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
            
            {/* AI-forslag */}
            {aiSuggestion.category ? (
              <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">AI-forslag:</span>
                  <span className="text-sm text-blue-800">{aiSuggestion.category}</span>
                  <span className="text-xs text-blue-600">
                    ({Math.round(aiSuggestion.confidence * 100)}% sikkerhet)
                  </span>
                  {!editingCategory && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingCategory(true)}
                      className="h-6 px-2"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                {editingCategory && (
                  <div className="mt-2 space-y-2">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Velg annen kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter(cat => !subjectArea || subjectArea === 'none' || cat.subject_area === subjectArea)
                          .map(category => (
                            <SelectItem key={category.id} value={category.category_name}>
                              {category.category_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingCategory(false);
                          // Her kunne vi oppdatert filens kategorisering
                        }}
                        className="h-6"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingCategory(false);
                          setSelectedCategory('');
                        }}
                        className="h-6"
                      >
                        Avbryt
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-800">
                    AI klarte ikke å kategorisere denne filen automatisk
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={onRemove}
          disabled={disabled}
          className="ml-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default EnhancedDocumentUploader;
