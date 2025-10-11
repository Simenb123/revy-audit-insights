import React, { useState } from 'react';
import { Upload, FileText, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * FileUploadZone - Felles gjenbrukbar komponent for drag & drop fil-opplasting
 * 
 * Denne komponenten erstatter dublert dropzone-kode på tvers av applikasjonen.
 * Den håndterer:
 * - Drag & drop funksjonalitet
 * - Fil-validering (type og størrelse)
 * - Feilhåndtering
 * - Visuell feedback
 * 
 * Brukes sammen med fileProcessing.ts utilities for parsing.
 */

export interface FileUploadZoneProps {
  /** Callback når filer er valgt og validert */
  onFilesSelected: (files: File[]) => void;
  
  /** Tillatte filtyper (MIME types eller extensions) */
  acceptedFileTypes?: string[];
  
  /** Maks filstørrelse i bytes (default: 100MB) */
  maxFileSize?: number;
  
  /** Tillat multiple filer */
  multiple?: boolean;
  
  /** Deaktiver upload */
  disabled?: boolean;
  
  /** Egendefinert hjelpetekst */
  helpText?: string;
  
  /** Egendefinert ikon */
  icon?: React.ReactNode;
  
  /** Egendefinert className */
  className?: string;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFilesSelected,
  acceptedFileTypes = ['.xlsx', '.xls', '.csv'],
  maxFileSize = 100_000_000, // 100MB
  multiple = false,
  disabled = false,
  helpText,
  icon,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Determine icon based on accepted file types
  const defaultIcon = acceptedFileTypes.some(type => type.includes('pdf')) ? (
    <FileText className="h-12 w-12 text-revio-500 mx-auto mb-4" />
  ) : (
    <FileSpreadsheet className="h-12 w-12 text-revio-500 mx-auto mb-4" />
  );

  // Default help text based on accepted types
  const defaultHelpText = helpText || 
    `Støtter ${acceptedFileTypes.join(', ')} filer${maxFileSize ? ` (maks ${Math.round(maxFileSize / 1_000_000)}MB)` : ''}`;

  const validateFiles = (files: FileList | null): File[] | null => {
    if (!files || files.length === 0) return null;

    const fileArray = Array.from(files);
    setValidationError(null);

    // Check multiple files
    if (!multiple && fileArray.length > 1) {
      setValidationError('Du kan bare laste opp én fil om gangen');
      return null;
    }

    // Validate each file
    for (const file of fileArray) {
      // Check file size
      if (file.size > maxFileSize) {
        setValidationError(
          `Filen "${file.name}" er for stor. Maksimal størrelse er ${Math.round(maxFileSize / 1_000_000)}MB`
        );
        return null;
      }

      // Check file type
      const hasValidExtension = acceptedFileTypes.some(ext => 
        file.name.toLowerCase().endsWith(ext.toLowerCase())
      );

      if (!hasValidExtension) {
        setValidationError(
          `Filen "${file.name}" har ugyldig filtype. Tillatte typer: ${acceptedFileTypes.join(', ')}`
        );
        return null;
      }
    }

    return fileArray;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const validatedFiles = validateFiles(e.dataTransfer.files);
    if (validatedFiles) {
      onFilesSelected(validatedFiles);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validatedFiles = validateFiles(e.target.files);
    if (validatedFiles) {
      onFilesSelected(validatedFiles);
    }
    // Reset input so samme fil kan velges på nytt
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging && !disabled && 'border-revio-500 bg-revio-50',
          !isDragging && !disabled && 'border-gray-300 hover:border-revio-300',
          disabled && 'bg-gray-100 cursor-not-allowed border-gray-200',
          className
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload-zone"
          className="hidden"
          accept={acceptedFileTypes.join(',')}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={disabled}
        />
        
        <label 
          htmlFor="file-upload-zone" 
          className={cn(
            'cursor-pointer block',
            disabled && 'cursor-not-allowed'
          )}
        >
          {icon || defaultIcon}
          
          <p className="text-lg font-medium text-gray-900 mb-2">
            Dra og slipp {multiple ? 'filer' : 'fil'} her, eller klikk for å velge
          </p>
          
          <p className="text-sm text-gray-500">
            {defaultHelpText}
          </p>
        </label>
      </div>

      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default FileUploadZone;
