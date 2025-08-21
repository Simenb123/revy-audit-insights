import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, File, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileUploadConfig {
  acceptedTypes: Record<string, string[]>;
  maxSize: number;
  maxFiles: number;
  autoProcess?: boolean;
}

export interface UploadedFileInfo {
  id: string;
  file: File;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  preview?: {
    headers: string[];
    sampleRows: string[][];
    totalRows: number;
  };
}

interface EnhancedFileUploaderProps {
  config: FileUploadConfig;
  onFilesSelected: (files: UploadedFileInfo[]) => void;
  onFileRemove: (fileId: string) => void;
  onFileProcess?: (file: UploadedFileInfo) => Promise<void>;
  files: UploadedFileInfo[];
  title?: string;
  description?: string;
  className?: string;
}

const EnhancedFileUploader: React.FC<EnhancedFileUploaderProps> = ({
  config,
  onFilesSelected,
  onFileRemove,
  onFileProcess,
  files,
  title = "Last opp filer",
  description,
  className
}) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: UploadedFileInfo[] = acceptedFiles.map(file => ({
      id: `${file.name}-${Date.now()}`,
      file,
      status: 'uploading' as const,
      progress: 0
    }));

    onFilesSelected(newFiles);

    // Auto-process if enabled
    if (config.autoProcess && onFileProcess) {
      for (const fileInfo of newFiles) {
        try {
          await onFileProcess(fileInfo);
        } catch (error) {
          console.error('Auto-processing failed:', error);
        }
      }
    }
  }, [config.autoProcess, onFilesSelected, onFileProcess]);

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept: config.acceptedTypes,
    maxSize: config.maxSize,
    maxFiles: config.maxFiles,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false)
  });

  const getStatusIcon = (status: UploadedFileInfo['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <File className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: UploadedFileInfo['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragActive && !isDragReject && 'border-primary bg-primary/5',
              isDragReject && 'border-destructive bg-destructive/5',
              !isDragActive && 'border-muted-foreground/25 hover:border-primary hover:bg-primary/5'
            )}
          >
            <input {...getInputProps()} />
            <Upload className={cn(
              'w-12 h-12 mx-auto mb-4',
              isDragActive ? 'text-primary' : 'text-muted-foreground'
            )} />
            
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            
            {description && (
              <p className="text-muted-foreground mb-4">{description}</p>
            )}
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Dra og slipp filer her, eller klikk for å velge
              </p>
              <p>
                Støttede formater: {Object.keys(config.acceptedTypes).join(', ')}
              </p>
              <p>
                Maks størrelse: {formatFileSize(config.maxSize)} per fil
              </p>
              {config.maxFiles > 1 && (
                <p>Maks {config.maxFiles} filer</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-4">Opplastede filer ({files.length})</h4>
            <div className="space-y-3">
              {files.map((fileInfo) => (
                <div key={fileInfo.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  {getStatusIcon(fileInfo.status)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{fileInfo.file.name}</span>
                      <Badge className={cn('text-xs', getStatusColor(fileInfo.status))}>
                        {fileInfo.status === 'uploading' && 'Laster opp'}
                        {fileInfo.status === 'processing' && 'Behandler'}
                        {fileInfo.status === 'completed' && 'Ferdig'}
                        {fileInfo.status === 'error' && 'Feil'}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(fileInfo.file.size)}
                      {fileInfo.preview && (
                        <span className="ml-2">
                          • {fileInfo.preview.totalRows} rader • {fileInfo.preview.headers.length} kolonner
                        </span>
                      )}
                    </div>
                    
                    {(fileInfo.status === 'uploading' || fileInfo.status === 'processing') && (
                      <Progress value={fileInfo.progress} className="mt-2 h-1" />
                    )}
                    
                    {fileInfo.error && (
                      <div className="text-xs text-destructive mt-1">{fileInfo.error}</div>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFileRemove(fileInfo.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedFileUploader;