
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  Download, 
  X, 
  Share2,
  Eye,
  Trash2,
  Folder
} from 'lucide-react';
import { formatDate } from '@/lib/formatters';

interface SharedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
  downloadCount: number;
  isPublic: boolean;
}

interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

interface FileSharingProps {
  roomId: string;
  canUpload?: boolean;
  canDelete?: boolean;
}

const FileSharing = ({ roomId, canUpload = true, canDelete = false }: FileSharingProps) => {
  const [files, setFiles] = useState<SharedFile[]>([
    {
      id: '1',
      name: 'Revisionsplan_2024.pdf',
      size: 2450000,
      type: 'application/pdf',
      uploadedBy: 'Sarah Berg',
      uploadedAt: new Date().toISOString(),
      downloadCount: 5,
      isPublic: false
    },
    {
      id: '2',
      name: 'Kontrollmiljø_analyse.xlsx',
      size: 890000,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      uploadedBy: 'Erik Nordahl',
      uploadedAt: new Date(Date.now() - 86400000).toISOString(),
      downloadCount: 12,
      isPublic: true
    }
  ]);
  
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />;
    if (type.includes('spreadsheet') || type.includes('excel')) return <File className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || !canUpload) return;

    Array.from(selectedFiles).forEach((file) => {
      const uploadId = Math.random().toString(36).substr(2, 9);
      const newUpload: FileUpload = {
        id: uploadId,
        file,
        progress: 0,
        status: 'uploading'
      };

      setUploads(prev => [...prev, newUpload]);

      // Simuler filopplasting
      const interval = setInterval(() => {
        setUploads(prev => prev.map(upload => {
          if (upload.id === uploadId) {
            const newProgress = Math.min(upload.progress + Math.random() * 20, 100);
            if (newProgress >= 100) {
              clearInterval(interval);
              
              // Legg til fil i fillisten
              const newFile: SharedFile = {
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                size: file.size,
                type: file.type,
                uploadedBy: 'Du',
                uploadedAt: new Date().toISOString(),
                downloadCount: 0,
                isPublic: false
              };
              
              setFiles(prev => [newFile, ...prev]);
              
              // Fjern fra uploads etter kort delay
              setTimeout(() => {
                setUploads(prev => prev.filter(u => u.id !== uploadId));
              }, 1000);
              
              return { ...upload, progress: 100, status: 'completed' };
            }
            return { ...upload, progress: newProgress };
          }
          return upload;
        }));
      }, 200);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const downloadFile = (file: SharedFile) => {
    // Simuler nedlasting
    setFiles(prev => prev.map(f => 
      f.id === file.id 
        ? { ...f, downloadCount: f.downloadCount + 1 }
        : f
    ));
  };

  const deleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const togglePublic = (fileId: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, isPublic: !f.isPublic }
        : f
    ));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Folder className="h-5 w-5" />
          Delte filer
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Upload område */}
        {canUpload && (
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Dra og slipp filer her, eller klikk for å velge
            </p>
            <Button variant="outline" size="sm">
              Velg filer
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>
        )}

        {/* Aktive opplastinger */}
        {uploads.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Laster opp...</h4>
            {uploads.map((upload) => (
              <div key={upload.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate">{upload.file.name}</span>
                  <span>{Math.round(upload.progress)}%</span>
                </div>
                <Progress value={upload.progress} className="h-2" />
              </div>
            ))}
          </div>
        )}

        {/* Filliste */}
        <div className="space-y-3">
          <h4 className="font-medium">Delte filer ({files.length})</h4>
          {files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Ingen filer delt ennå</p>
            </div>
          ) : (
            files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-sm truncate">{file.name}</h5>
                      {file.isPublic && (
                        <Badge variant="secondary" className="text-xs">
                          <Share2 className="h-3 w-3 mr-1" />
                          Offentlig
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)} • Lastet opp av {file.uploadedBy} • {formatDate(file.uploadedAt)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {file.downloadCount} nedlastinger
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadFile(file)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePublic(file.id)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteFile(file.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FileSharing;
