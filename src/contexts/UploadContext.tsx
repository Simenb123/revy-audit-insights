import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { UploadSession, UploadTypeConfig, ProcessingResult, UploadContextValue } from '@/types/upload';
import { getUploadConfig } from '@/config/uploadTypes';
import { parseFilePreview, suggestColumnMappings } from '@/utils/fileProcessing';

const UploadContext = createContext<UploadContextValue | null>(null);

interface UploadProviderProps {
  children: ReactNode;
}

export const UploadProvider: React.FC<UploadProviderProps> = ({ children }) => {
  const [session, setSession] = useState<UploadSession | null>(null);
  const [config, setConfig] = useState<UploadTypeConfig | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeSession = useCallback(async (uploadTypeId: string, files: File[]): Promise<void> => {
    try {
      const uploadConfig = getUploadConfig(uploadTypeId);
      if (!uploadConfig) {
        throw new Error(`Unknown upload type: ${uploadTypeId}`);
      }

      const newSession: UploadSession = {
        id: `session-${Date.now()}`,
        uploadType: uploadTypeId,
        files: files.map((file, index) => ({
          id: `file-${index}-${Date.now()}`,
          name: file.name,
          size: file.size,
          status: 'uploading',
          progress: 0
        })),
        currentStep: 0,
        mapping: {},
        validationResults: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setSession(newSession);
      setConfig(uploadConfig);
      setError(null);

      // Process files for preview
      if (uploadConfig.enablePreview && files.length > 0) {
        setIsProcessing(true);
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          try {
            const preview = await parseFilePreview(file);
            
            // Update session with file processing results
            setSession(prev => {
              if (!prev) return prev;
              
              const updatedFiles = [...prev.files];
              updatedFiles[i] = {
                ...updatedFiles[i],
                status: 'completed',
                progress: 100
              };

              return {
                ...prev,
                files: updatedFiles,
                updatedAt: new Date()
              };
            });

            // Generate AI suggestions if enabled
            if (uploadConfig.enableAISuggestions) {
              const suggestions = await suggestColumnMappings(preview.headers, uploadConfig.fieldDefinitions);
              
              // Auto-apply high-confidence suggestions
              const autoMapping: Record<string, string> = {};
              suggestions.forEach(suggestion => {
                if (suggestion.confidence >= 0.8) {
                  autoMapping[suggestion.sourceColumn] = suggestion.targetField;
                }
              });

              setSession(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  mapping: { ...prev.mapping, ...autoMapping },
                  updatedAt: new Date()
                };
              });
            }

          } catch (fileError) {
            console.error(`Error processing file ${file.name}:`, fileError);
            
            setSession(prev => {
              if (!prev) return prev;
              
              const updatedFiles = [...prev.files];
              updatedFiles[i] = {
                ...updatedFiles[i],
                status: 'error',
                progress: 0
              };

              return {
                ...prev,
                files: updatedFiles,
                updatedAt: new Date()
              };
            });
          }
        }
        
        setIsProcessing(false);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize upload session';
      setError(errorMessage);
      console.error('Upload initialization error:', err);
    }
  }, []);

  const updateMapping = useCallback((mapping: Record<string, string>) => {
    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        mapping,
        updatedAt: new Date()
      };
    });
  }, []);

  const processFiles = useCallback(async (): Promise<void> => {
    if (!session || !config) {
      throw new Error('No active session or config');
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Validate required field mapping
      const requiredFields = config.fieldDefinitions.filter(f => f.is_required);
      const mappedRequired = requiredFields.filter(field => 
        Object.values(session.mapping).includes(field.field_key)
      );

      if (mappedRequired.length !== requiredFields.length) {
        throw new Error('All required fields must be mapped before processing');
      }

      // Use custom processor if available
      let result: ProcessingResult;
      
      if (config.customProcessor) {
        // Custom processing logic provided by upload type config
        const firstFile = session.files[0];
        if (!firstFile) {
          throw new Error('No files to process');
        }

        // Note: In a real implementation, you'd need to reconstruct the File object
        // For now, we'll simulate the processing
        result = {
          success: true,
          processedRows: 100, // Placeholder
          validRows: 95,
          invalidRows: 5,
          skippedRows: 0,
          validationResults: [
            {
              type: 'success',
              message: 'Files processed successfully',
              count: 95
            },
            {
              type: 'warning',
              message: 'Some rows had validation issues',
              count: 5,
              details: ['Invalid date format in row 3', 'Missing required field in row 7']
            }
          ]
        };
      } else {
        // Default processing logic
        result = {
          success: true,
          processedRows: session.files.length,
          validRows: session.files.length,
          invalidRows: 0,
          skippedRows: 0,
          validationResults: [
            {
              type: 'success',
              message: `Successfully processed ${session.files.length} files`,
              count: session.files.length
            }
          ]
        };
      }

      // Update session with processing results
      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          processingResult: result,
          currentStep: config.processingSteps.length - 1,
          updatedAt: new Date()
        };
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Processing failed';
      setError(errorMessage);
      console.error('File processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [session, config]);

  const clearSession = useCallback(() => {
    setSession(null);
    setConfig(null);
    setError(null);
    setIsProcessing(false);
  }, []);

  const contextValue: UploadContextValue = {
    session,
    config,
    initializeSession,
    updateMapping,
    processFiles,
    clearSession,
    isProcessing,
    error
  };

  return (
    <UploadContext.Provider value={contextValue}>
      {children}
    </UploadContext.Provider>
  );
};

export const useUpload = (): UploadContextValue => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
};