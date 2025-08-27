import React, { useState } from 'react';
import { 
  FileText, 
  Database, 
  CheckCircle, 
  FileSpreadsheet,
  Upload,
  X
} from 'lucide-react';
import { useActiveVersion } from '@/hooks/useAccountingVersions';
import { useActiveTrialBalanceVersion } from '@/hooks/useActiveTrialBalanceVersion';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import { useAccountingYear } from '@/hooks/useAccountingYear';
import { useDocumentCategories } from '@/hooks/useDocumentCategories';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';
import FileDropZone from '@/components/common/FileDropZone';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface DocumentDataPanelProps {
  clientId?: string;
}

export default function DocumentDataPanel({ clientId }: DocumentDataPanelProps) {
  const { accountingYear } = useAccountingYear(clientId || '');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isDragActive, setIsDragActive] = useState(false);
  
  // Active versions
  const { data: activeVersion, isLoading: activeVersionLoading } = useActiveVersion(clientId || '');
  const { data: activeTBVersion, isLoading: activeTBVersionLoading } = useActiveTrialBalanceVersion(clientId || '', accountingYear);
  
  // Documents and categories
  const { documents, isLoading: documentsLoading, uploadDocument } = useClientDocuments(clientId);
  const { data: categories = [] } = useDocumentCategories();
  
  if (!clientId) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Velg en klient for å se dokumenter og versjoner.
      </div>
    );
  }

  // Show all documents, sorted by date
  const allDocuments = documents
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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
          category: selectedCategory || undefined
        });
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }

    // Reset form
    setSelectedFiles([]);
    setSelectedCategory('');
    
    toast({
      title: "Filer lastet opp",
      description: `${selectedFiles.length} fil${selectedFiles.length === 1 ? '' : 'er'} ble lastet opp.`
    });
  };

  return (
    <div className="p-3 space-y-4 text-sm">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4" />
        <h3 className="font-medium">Dokumenter</h3>
      </div>

      {/* Regnskapsdata Section */}
      <div className="space-y-3">
        <div className="text-muted-foreground font-medium">Regnskapsdata</div>
        
        {/* Hovedbok */}
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          {activeVersionLoading ? (
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          ) : activeVersion ? (
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="font-medium">Hovedbok:</span>
                <span className="text-muted-foreground truncate">
                  {activeVersion.file_name || `V${activeVersion.version_number}`}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">Ingen hovedbok</span>
          )}
        </div>

        {/* Saldobalanse */}
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          {activeTBVersionLoading ? (
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          ) : activeTBVersion ? (
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="font-medium">Saldobalanse:</span>
                <span className="text-muted-foreground truncate">
                  {activeTBVersion.version} ({activeTBVersion.year})
                </span>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">Ingen saldobalanse</span>
          )}
        </div>
      </div>

      {/* Upload Section */}
      <div className="space-y-3">
        <div className="text-muted-foreground font-medium">Last opp filer</div>
        
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
          className="py-4 px-3"
        >
          {(active) => (
            <div className="text-center">
              <Upload className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-xs font-medium">
                {active ? 'Slipp filene her' : 'Dra filer hit eller klikk'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, Word, Excel, CSV, bilder
              </p>
            </div>
          )}
        </FileDropZone>

        {/* Selected files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Valgte filer:</div>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-1 bg-muted rounded text-xs">
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <FileText className="h-3 w-3 shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(index)}
                    className="h-5 w-5 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            
            {/* Category selection */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Kategori (valgfritt)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ai-suggest">AI vil foreslå kategori</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.category_name}>
                    {category.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleUpload}
              disabled={uploadDocument.isPending}
              size="sm"
              className="w-full h-7 text-xs"
            >
              {uploadDocument.isPending ? 'Laster opp...' : `Last opp ${selectedFiles.length} fil${selectedFiles.length === 1 ? '' : 'er'}`}
            </Button>
          </div>
        )}
      </div>

      {/* All Documents */}
      <div className="space-y-2">
        <div className="text-muted-foreground font-medium">Alle dokumenter</div>
        {documentsLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-4 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : allDocuments.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {allDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center gap-2">
                <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm">
                    {doc.file_name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(doc.created_at), {
                      addSuffix: true,
                      locale: nb
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground py-2">
            Ingen dokumenter lastet opp
          </div>
        )}
      </div>
    </div>
  );
}