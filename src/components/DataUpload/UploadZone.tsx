
import React from 'react';
import { Upload } from 'lucide-react';

interface UploadZoneProps {
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UploadZone = ({
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
}: UploadZoneProps) => {
  return (
    <div 
      className={`
        border-2 border-dashed rounded-lg p-8 
        transition-colors duration-200 ease-in-out
        flex flex-col items-center justify-center
        ${isDragging ? 'border-revio-500 bg-revio-50' : 'border-gray-300 hover:border-revio-300'}
      `}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input 
        type="file" 
        id="file-upload" 
        className="hidden" 
        onChange={onFileSelect}
        accept=".xlsx,.xls,.csv"
      />
      
      <label htmlFor="file-upload" className="cursor-pointer text-center">
        <Upload size={48} className="text-revio-500 mx-auto mb-4" />
        <p className="text-sm text-gray-600 mb-2">
          Dra og slipp filen her, eller klikk for å velge
        </p>
        <p className="text-xs text-gray-500">
          Støtter Excel (.xlsx, .xls) og CSV-filer
        </p>
      </label>
    </div>
  );
};

export default UploadZone;
