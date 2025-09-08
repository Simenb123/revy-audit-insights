import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { BatchProcessingManager, BatchTask, BatchProcessingResult } from '@/services/batchProcessingManager';
import { logger } from '@/utils/logger';

interface UploadSession {
  id: string;
  uploadType: string;
  files: FileInfo[];
  status: 'idle' | 'processing' | 'paused' | 'completed' | 'error' | 'cancelled';
  currentStep: number;
  totalSteps: number;
  progress: number;
  processedRows: number;
  totalRows: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface FileInfo {
  id: string;
  name: string;
  size: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  processedRows?: number;
  totalRows?: number;
  error?: string;
}

interface UploadConfig {
  uploadType: string;
  acceptedFileTypes: string[];
  maxFileSize: number;
  maxFiles: number;
  batchSize: number;
  concurrency: number;
  enableCaching: boolean;
  enableAISuggestions: boolean;
  enableWebWorker: boolean;
  sessionTracking: boolean;
}

interface ProcessingOptions {
  clientId?: string;
  year?: number;
  mode?: 'full' | 'incremental' | 'validate-only';
  mapping?: Record<string, string>;
  customProcessor?: (data: any[], options: ProcessingOptions) => Promise<ProcessingResult>;
}

interface ProcessingResult {
  success: boolean;
  processedRows: number;
  validRows: number;
  invalidRows: number;
  skippedRows: number;
  errors: string[];
  warnings: string[];
  summary?: Record<string, any>;
}

interface AdvancedUploadContextValue {
  session: UploadSession | null;
  config: UploadConfig | null;
  
  // Session management
  initializeSession: (config: UploadConfig, files: File[]) => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  cancelSession: () => Promise<void>;
  clearSession: () => void;
  
  // File operations
  addFiles: (files: File[]) => Promise<void>;
  removeFile: (fileId: string) => void;
  processFiles: (options: ProcessingOptions) => Promise<ProcessingResult>;
  
  // Progress and status
  isProcessing: boolean;
  error: string | null;
  onProgress?: (session: UploadSession) => void;
}

const AdvancedUploadContext = createContext<AdvancedUploadContextValue | null>(null);

interface AdvancedUploadProviderProps {
  children: ReactNode;
  onProgress?: (session: UploadSession) => void;
}

export const AdvancedUploadProvider: React.FC<AdvancedUploadProviderProps> = ({ 
  children, 
  onProgress 
}) => {
  const [session, setSession] = useState<UploadSession | null>(null);
  const [config, setConfig] = useState<UploadConfig | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchProcessor, setBatchProcessor] = useState<BatchProcessingManager<any, any> | null>(null);

  // Initialize upload session
  const initializeSession = useCallback(async (uploadConfig: UploadConfig, files: File[]) => {
    try {
      setError(null);
      
      // Validate files
      const validFiles = files.filter(file => {
        if (file.size > uploadConfig.maxFileSize) {
          logger.warn(`File ${file.name} exceeds size limit`);
          return false;
        }
        return uploadConfig.acceptedFileTypes.some(type => 
          file.name.toLowerCase().endsWith(type.toLowerCase())
        );
      });

      if (validFiles.length === 0) {
        throw new Error('No valid files selected');
      }

      const newSession: UploadSession = {
        id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        uploadType: uploadConfig.uploadType,
        files: validFiles.map((file, index) => ({
          id: `file-${index}-${Date.now()}`,
          name: file.name,
          size: file.size,
          status: 'pending',
          progress: 0
        })),
        status: 'idle',
        currentStep: 0,
        totalSteps: 4, // upload, parse, process, complete
        progress: 0,
        processedRows: 0,
        totalRows: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setSession(newSession);
      setConfig(uploadConfig);

      // Save session to localStorage if session tracking is enabled
      if (uploadConfig.sessionTracking) {
        localStorage.setItem(`upload_session_${newSession.id}`, JSON.stringify({
          sessionId: newSession.id,
          uploadType: uploadConfig.uploadType,
          fileNames: validFiles.map(f => f.name),
          createdAt: newSession.createdAt.toISOString()
        }));
      }

      logger.log(`Initialized upload session ${newSession.id} with ${validFiles.length} files`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize session';
      setError(errorMessage);
      logger.error('Session initialization error:', err);
    }
  }, []);

  // Add files to existing session
  const addFiles = useCallback(async (files: File[]) => {
    if (!session || !config) return;

    const newFiles: FileInfo[] = files.map((file, index) => ({
      id: `file-${session.files.length + index}-${Date.now()}`,
      name: file.name,
      size: file.size,
      status: 'pending',
      progress: 0
    }));

    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        files: [...prev.files, ...newFiles],
        updatedAt: new Date()
      };
    });
  }, [session, config]);

  // Remove file from session
  const removeFile = useCallback((fileId: string) => {
    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        files: prev.files.filter(f => f.id !== fileId),
        updatedAt: new Date()
      };
    });
  }, []);

  // Process files using batch processing
  const processFiles = useCallback(async (options: ProcessingOptions): Promise<ProcessingResult> => {
    if (!session || !config) {
      throw new Error('No active session');
    }

    if (session.files.length === 0) {
      throw new Error('No files to process');
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Update session status
      setSession(prev => prev ? { 
        ...prev, 
        status: 'processing', 
        currentStep: 1,
        updatedAt: new Date()
      } : prev);

      // Initialize batch processor
      const processor = new BatchProcessingManager<any, any>(
        async (data) => {
          // This would be the actual processing function
          // For now, simulate processing
          await new Promise(resolve => setTimeout(resolve, 100));
          return { success: true, data };
        },
        {
          concurrency: config.concurrency,
          batchSize: config.batchSize,
          enableCaching: config.enableCaching,
          cacheStrategy: 'upload-processing',
          delayBetweenBatches: 500,
          retryDelayMs: 2000,
          priorityWeighting: true
        }
      );

      setBatchProcessor(processor);

      // Monitor progress
      processor.onStatusUpdate((stats) => {
        setSession(prev => {
          if (!prev) return prev;
          
          const progress = (stats.completedTasks / stats.totalTasks) * 100;
          const updatedSession = {
            ...prev,
            progress,
            processedRows: stats.completedTasks,
            totalRows: stats.totalTasks,
            updatedAt: new Date()
          };
          
          if (onProgress) {
            onProgress(updatedSession);
          }
          
          return updatedSession;
        });
      });

      // Create processing tasks
      const tasks: BatchTask<any, any>[] = session.files.map((file, index) => ({
        id: file.id,
        data: { file, options },
        priority: 'medium' as const,
        retryCount: 0,
        maxRetries: 2,
        timeout: 30000,
        cacheKey: config.enableCaching ? `file-${file.id}` : undefined
      }));

      processor.addTasks(tasks);
      const results = await processor.startProcessing();

      // Process results
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      const result: ProcessingResult = {
        success: failed.length === 0,
        processedRows: successful.length,
        validRows: successful.length,
        invalidRows: failed.length,
        skippedRows: 0,
        errors: failed.map(r => r.error || 'Unknown error'),
        warnings: [],
        summary: {
          totalFiles: session.files.length,
          successfulFiles: successful.length,
          failedFiles: failed.length
        }
      };

      // Update session to completed
      setSession(prev => prev ? {
        ...prev,
        status: result.success ? 'completed' : 'error',
        currentStep: 4,
        progress: 100,
        updatedAt: new Date()
      } : prev);

      // Clean up session storage on successful completion
      if (result.success && config.sessionTracking) {
        localStorage.removeItem(`upload_session_${session.id}`);
      }

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Processing failed';
      setError(errorMessage);
      
      setSession(prev => prev ? {
        ...prev,
        status: 'error',
        updatedAt: new Date()
      } : prev);

      throw new Error(errorMessage);
      
    } finally {
      setIsProcessing(false);
      setBatchProcessor(null);
    }
  }, [session, config, onProgress]);

  // Pause session
  const pauseSession = useCallback(async () => {
    if (session && session.status === 'processing') {
      setSession(prev => prev ? {
        ...prev,
        status: 'paused',
        updatedAt: new Date()
      } : prev);
    }
  }, [session]);

  // Resume session
  const resumeSession = useCallback(async () => {
    if (session && session.status === 'paused') {
      setSession(prev => prev ? {
        ...prev,
        status: 'processing',
        updatedAt: new Date()
      } : prev);
    }
  }, [session]);

  // Cancel session
  const cancelSession = useCallback(async () => {
    if (session) {
      setSession(prev => prev ? {
        ...prev,
        status: 'cancelled',
        updatedAt: new Date()
      } : prev);
      
      if (config?.sessionTracking) {
        localStorage.removeItem(`upload_session_${session.id}`);
      }
    }
    setIsProcessing(false);
  }, [session, config]);

  // Clear session
  const clearSession = useCallback(() => {
    if (session && config?.sessionTracking) {
      localStorage.removeItem(`upload_session_${session.id}`);
    }
    setSession(null);
    setConfig(null);
    setError(null);
    setIsProcessing(false);
    setBatchProcessor(null);
  }, [session, config]);

  const contextValue: AdvancedUploadContextValue = {
    session,
    config,
    initializeSession,
    pauseSession,
    resumeSession,
    cancelSession,
    clearSession,
    addFiles,
    removeFile,
    processFiles,
    isProcessing,
    error,
    onProgress
  };

  return (
    <AdvancedUploadContext.Provider value={contextValue}>
      {children}
    </AdvancedUploadContext.Provider>
  );
};

export const useAdvancedUpload = (): AdvancedUploadContextValue => {
  const context = useContext(AdvancedUploadContext);
  if (!context) {
    throw new Error('useAdvancedUpload must be used within an AdvancedUploadProvider');
  }
  return context;
};

export type { 
  UploadSession, 
  FileInfo, 
  UploadConfig, 
  ProcessingOptions, 
  ProcessingResult 
};