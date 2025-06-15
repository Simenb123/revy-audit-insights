
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from 'lucide-react';
import { usePDFUploadForm } from '@/hooks/pdf/usePDFUploadForm';
import PDFDropzone from './PDFDropzone';
import PDFSelectedFilesList from './PDFSelectedFilesList';
import PDFUploadFormFields from './PDFUploadFormFields';

const PDFUploader = () => {
  const {
    selectedFiles,
    title,
    description,
    category,
    isaNumber,
    nrsNumber,
    uploadDocument,
    handleFileSelect,
    handleUpload,
    setTitle,
    setDescription,
    setCategory,
    setIsaNumber,
    setNrsNumber,
  } = usePDFUploadForm();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Last opp PDF-dokumenter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <PDFDropzone 
          onFileSelect={handleFileSelect} 
          disabled={uploadDocument.isPending} 
        />

        <PDFSelectedFilesList files={selectedFiles} />

        {selectedFiles.length > 0 && (
          <PDFUploadFormFields
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            category={category}
            setCategory={setCategory}
            isaNumber={isaNumber}
            setIsaNumber={setIsaNumber}
            nrsNumber={nrsNumber}
            setNrsNumber={setNrsNumber}
            onUpload={handleUpload}
            isUploading={uploadDocument.isPending}
            canUpload={selectedFiles.length > 0 && !!title.trim()}
            fileCount={selectedFiles.length}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default PDFUploader;
