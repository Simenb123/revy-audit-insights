
import React from 'react';
import { FileText } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface PDFSelectedFilesListProps {
  files: File[];
}

const PDFSelectedFilesList = ({ files }: PDFSelectedFilesListProps) => {
  if (files.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label>Valgte filer:</Label>
      {files.map((file, index) => (
        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
          <FileText className="h-4 w-4" />
          <span className="text-sm">{file.name}</span>
          <span className="text-xs text-gray-500">
            ({(file.size / 1024 / 1024).toFixed(1)} MB)
          </span>
        </div>
      ))}
    </div>
  );
};

export default PDFSelectedFilesList;
