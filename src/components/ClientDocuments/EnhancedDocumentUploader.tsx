import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, File, X, Eye, Bot, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useClientDocuments, DocumentCategory } from '@/hooks/useClientDocuments';
import { useAdvancedDocumentAI } from '@/hooks/useAdvancedDocumentAI';
import FilePreview from './FilePreview';
import AdvancedFilePreview from './AdvancedFilePreview';
import { toast } from 'sonner';

interface FileWithPreview extends File {
  id: string;
  preview?: string;
  aiAnalysis?: any;
}

interface EnhancedDocumentUploaderProps {
  clientId: string;
  categories: DocumentCategory[];
}

const EnhancedDocumentUploader = ({ clientId, categories }: EnhancedDocumentUploaderProps) => {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [bulkCategory, setBulkCategory] = useState<string>('');
  const [bulkSubjectArea, setBulkSubjectArea] = useState<string>('');

  const { uploadDocument } = useClientDocuments(clientId);
  const { analyzeDocument, isAnalyzing } = useAdvancedDocumentAI();

  const handleFiles = useCallback(async (files: FileList) => {
    const newFiles: FileWithPreview[] = Array.from(files).map(file => ({
      ...file,
      id: Math.random().toString(36).substring(7)
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);

    // Analyser hver fil med AI
    for (const file of newFiles) {
      try {
        console.log('Analyzing file:', file.name);
        const analysis = await analyzeDocument.mutateAsync({
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size
        });
        
        setSelectedFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, aiAnalysis: analysis } : f
        ));
      } catch (error) {
        console.error('AI analysis failed for:', file.name, error);
      }
    }
  }, [analyzeDocument]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    for (const file of selectedFiles) {
      try {
        await uploadDocument.mutateAsync({
          file,
          clientId,
          category: file.aiAnalysis?.suggestedCategory || bulkCategory,
          subjectArea: file.aiAnalysis?.subjectArea || bulkSubjectArea
        });
      } catch (error) {
        console.error('Upload failed for:', file.name, error);
      }
    }

    setSelectedFiles([]);
    setBulkCategory('');
    setBulkSubjectArea('');
    toast.success(`${selectedFiles.length} filer lastet opp!`);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="h-4 w-4" />;
    if (confidence >= 0.6) return <AlertCircle className="h-4 w-4" />;
    return <X className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Last opp dokumenter med forbedret AI-kategorisering
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drag and drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">
              Dra og slipp filer her, eller klikk for å velge
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Støtter PDF, Excel, Word, bilder og mer. Automatisk AI-kategorisering aktivert.
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <Button asChild variant="outline">
              <label htmlFor="file-upload" className="cursor-pointer">
                Velg filer
              </label>
            </Button>
          </div>

          {/* Bulk settings */}
          {selectedFiles.length > 1 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-sm">Bulk-innstillinger (valgfritt)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bulk-category">Standard kategori</Label>
                    <Select value={bulkCategory} onValueChange={setBulkCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.category_name}>
                            {cat.category_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="bulk-subject">Standard fagområde</Label>
                    <Select value={bulkSubjectArea} onValueChange={setBulkSubjectArea}>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg fagområde" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regnskap">Regnskap</SelectItem>
                        <SelectItem value="revisjon">Revisjon</SelectItem>
                        <SelectItem value="skatt">Skatt</SelectItem>
                        <SelectItem value="lnn">Lønn</SelectItem>
                        <SelectItem value="annet">Annet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selected files with enhanced AI analysis */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <Bot className="h-4 w-4 text-blue-600" />
                Valgte filer med AI-analyse ({selectedFiles.length})
              </h3>
              {selectedFiles.map((file) => (
                <Card key={file.id} className="p-4 border-l-4 border-l-blue-500">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <File className="h-8 w-8 text-blue-600 mt-1" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{file.name}</h4>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Ukjent type'}
                        </p>
                        
                        {/* Enhanced AI Analysis Results */}
                        {file.aiAnalysis ? (
                          <div className="mt-3 space-y-3">
                            <div className="flex items-center gap-2">
                              <Bot className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">Forbedret AI-analyse:</span>
                            </div>
                            
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <div className="flex flex-wrap gap-2 mb-2">
                                <Badge 
                                  variant="outline" 
                                  className={`${getConfidenceColor(file.aiAnalysis.confidence)} flex items-center gap-1`}
                                >
                                  {getConfidenceIcon(file.aiAnalysis.confidence)}
                                  {file.aiAnalysis.suggestedCategory}
                                  ({Math.round(file.aiAnalysis.confidence * 100)}%)
                                </Badge>
                                
                                <Badge variant="secondary">
                                  {file.aiAnalysis.subjectArea === 'lnn' ? 'Lønn' : file.aiAnalysis.subjectArea}
                                </Badge>

                                <Badge variant="outline" className="text-xs">
                                  {file.aiAnalysis.documentType}
                                </Badge>
                              </div>
                              
                              {file.aiAnalysis.extractedKeywords.length > 0 && (
                                <div className="mb-2">
                                  <span className="text-xs text-blue-700 font-medium">Nøkkelord: </span>
                                  {file.aiAnalysis.extractedKeywords.map((keyword, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs mr-1">
                                      {keyword}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              
                              {file.aiAnalysis.reasoning && (
                                <p className="text-xs text-blue-800 bg-white p-2 rounded border">
                                  <strong>AI-begrunnelse:</strong> {file.aiAnalysis.reasoning}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : isAnalyzing ? (
                          <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
                            <Clock className="h-4 w-4 animate-spin" />
                            Analyserer med forbedret AI...
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewFile(file)}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Upload button */}
          {selectedFiles.length > 0 && (
            <Button 
              onClick={uploadFiles}
              disabled={uploadDocument.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {uploadDocument.isPending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Laster opp {selectedFiles.length} filer med AI-analyse...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Last opp {selectedFiles.length} filer med AI-kategorisering
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Enhanced File Preview Dialog */}
      {previewFile && (
        <AdvancedFilePreview
          file={previewFile}
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
};

export default EnhancedDocumentUploader;
