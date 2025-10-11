import { useState } from 'react';
import { 
  processExcelFile, 
  processCSVFile, 
  FilePreview,
  suggestColumnMappings,
  ColumnMapping,
  FieldDefinition
} from '@/utils/fileProcessing';
import { useToast } from '@/hooks/use-toast';

/**
 * useFileProcessor - Hook for å håndtere fil-parsing og -validering
 * 
 * Dette er en gjenbrukbar hook som wrapper fileProcessing.ts utilities.
 * Den håndterer:
 * - Parsing av Excel og CSV filer
 * - Loading states
 * - Feilhåndtering med toast-meldinger
 * - Column mapping suggestions
 * 
 * Eksempel bruk:
 * ```tsx
 * const { processFile, preview, isProcessing, error } = useFileProcessor();
 * 
 * const handleFile = async (files: File[]) => {
 *   const result = await processFile(files[0], TRIAL_BALANCE_FIELDS);
 *   if (result) {
 *     console.log('Preview:', result);
 *   }
 * };
 * ```
 */

export interface UseFileProcessorOptions {
  /** Ekstra termer for header-deteksjon */
  extraTerms?: string[];
  
  /** Automatisk vis toast ved feil */
  showErrorToast?: boolean;
}

export interface UseFileProcessorResult {
  /** Parser en fil og returnerer preview */
  processFile: (
    file: File, 
    fieldDefinitions?: FieldDefinition[]
  ) => Promise<FilePreview | null>;
  
  /** Foreslå column mappings basert på preview */
  suggestMappings: (
    preview: FilePreview,
    fieldDefinitions: FieldDefinition[]
  ) => Promise<ColumnMapping[]>;
  
  /** Nåværende preview (hvis noen) */
  preview: FilePreview | null;
  
  /** Loading state */
  isProcessing: boolean;
  
  /** Feilmelding (hvis noen) */
  error: string | null;
  
  /** Reset state */
  reset: () => void;
}

export const useFileProcessor = (
  options: UseFileProcessorOptions = {}
): UseFileProcessorResult => {
  const { extraTerms = [], showErrorToast = true } = options;
  const { toast } = useToast();
  
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = async (
    file: File,
    fieldDefinitions?: FieldDefinition[]
  ): Promise<FilePreview | null> => {
    setIsProcessing(true);
    setError(null);
    setPreview(null);

    try {
      let filePreview: FilePreview;

      // Determine file type and use appropriate processor
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.csv')) {
        filePreview = await processCSVFile(file, { extraAliasHeaders: extraTerms });
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        filePreview = await processExcelFile(file, { extraTerms });
      } else {
        throw new Error('Ugyldig filtype. Kun Excel (.xlsx, .xls) og CSV-filer støttes.');
      }

      setPreview(filePreview);
      return filePreview;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ukjent feil ved parsing av fil';
      setError(errorMessage);
      
      if (showErrorToast) {
        toast({
          title: 'Feil ved fil-prosessering',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const suggestMappings = async (
    filePreview: FilePreview,
    fieldDefinitions: FieldDefinition[]
  ): Promise<ColumnMapping[]> => {
    try {
      return await suggestColumnMappings(filePreview.headers, fieldDefinitions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Feil ved forslag til kolonne-mapping';
      setError(errorMessage);
      
      if (showErrorToast) {
        toast({
          title: 'Feil ved mapping-forslag',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      
      return [];
    }
  };

  const reset = () => {
    setPreview(null);
    setError(null);
    setIsProcessing(false);
  };

  return {
    processFile,
    suggestMappings,
    preview,
    isProcessing,
    error,
    reset,
  };
};
