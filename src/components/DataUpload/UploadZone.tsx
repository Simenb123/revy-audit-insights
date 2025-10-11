import React from 'react';
import FileUploadZone from '@/components/Upload/FileUploadZone';

/**
 * UploadZone - Legacy wrapper for FileUploadZone
 * 
 * DEPRECATED: Dette er en adapter for bakoverkompatibilitet.
 * Nye komponenter bør bruke FileUploadZone direkte.
 * 
 * Denne komponenten wrapper den nye FileUploadZone men beholder
 * den gamle API-en slik at eksisterende komponenter fortsatt virker.
 */

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
  // Adapter: Convert new FileUploadZone callback to legacy format
  const handleFilesSelected = (files: File[]) => {
    // Create a proper mock event for backward compatibility
    const fileList = files as unknown as FileList;
    const mockEvent = {
      target: {
        files: fileList,
        value: files[0]?.name || '',
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    onFileSelect(mockEvent);
  };

  return (
    <FileUploadZone
      onFilesSelected={handleFilesSelected}
      acceptedFileTypes={['.xlsx', '.xls', '.csv']}
      multiple={false}
      helpText="Støtter Excel (.xlsx, .xls) og CSV-filer med aksjonærdata"
    />
  );
};

export default UploadZone;
