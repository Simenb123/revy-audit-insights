
import React, { useState } from 'react';
import { FileText } from 'lucide-react';

interface PDFDropzoneProps {
  onFileSelect: (files: FileList | null) => void;
  disabled?: boolean;
}

const PDFDropzone = ({ onFileSelect, disabled }: PDFDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) onFileSelect(e.dataTransfer.files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
  };

  return (
    <div
      className={`
        border-2 border-dashed rounded-lg p-8 text-center transition-colors
        ${isDragging ? 'border-brand-primary bg-brand-surface/30' : 'border-gray-300 hover:border-brand-primary/70'}
        ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
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
        onChange={handleFileChange}
        disabled={disabled}
      />
      <label htmlFor="pdf-upload" className={disabled ? 'cursor-not-allowed' : 'cursor-pointer'}>
        <FileText className="h-12 w-12 text-brand-primary mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Dra og slipp PDF-filer her, eller klikk for å velge
        </p>
        <p className="text-sm text-gray-500">
          Støtter kun PDF-filer
        </p>
      </label>
    </div>
  );
};

export default PDFDropzone;
