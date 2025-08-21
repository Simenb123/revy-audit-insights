export interface FieldDefinition {
  field_key: string;
  field_label: string;
  field_description?: string; 
  is_required: boolean;
  data_type: 'text' | 'number' | 'date' | 'boolean' | 'email';
  validation_rules?: {
    min_length?: number;
    max_length?: number;
    pattern?: string;
    min_value?: number;
    max_value?: number;
  };
  sort_order: number;
  category?: string;
  example_values?: string[];
}

export interface UploadTypeConfig {
  id: string;
  name: string;
  description: string;
  icon?: string;
  acceptedFileTypes: Record<string, string[]>;
  maxFileSize: number;
  maxFiles: number;
  fieldDefinitions: FieldDefinition[];
  processingSteps: {
    id: string;
    title: string;
    description?: string;
  }[];
  enableAISuggestions: boolean;
  enablePreview: boolean;
  customValidation?: (data: any[]) => Promise<ValidationResult[]>;
  customProcessor?: (file: File, mapping: Record<string, string>) => Promise<ProcessingResult>;
}

export interface ValidationResult {
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  details?: string[];
  count?: number;
  rowIndexes?: number[];
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ProcessingResult {
  success: boolean;
  processedRows: number;
  validRows: number;
  invalidRows: number;
  skippedRows: number;
  validationResults: ValidationResult[];
  downloadLinks?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  }[];
  metadata?: Record<string, any>;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number;
  suggestedBy: 'ai' | 'user' | 'auto';
}

export interface UploadSession {
  id: string;
  uploadType: string;
  files: {
    id: string;
    name: string;
    size: number;
    status: 'uploading' | 'processing' | 'completed' | 'error';
    progress: number;
    error?: string;
  }[];
  currentStep: number;
  mapping: Record<string, string>;
  validationResults: ValidationResult[];
  processingResult?: ProcessingResult;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadContextValue {
  session: UploadSession | null;
  config: UploadTypeConfig | null;
  initializeSession: (uploadTypeId: string, files: File[]) => Promise<void>;
  updateMapping: (mapping: Record<string, string>) => void;
  processFiles: () => Promise<void>;
  clearSession: () => void;
  isProcessing: boolean;
  error: string | null;
}