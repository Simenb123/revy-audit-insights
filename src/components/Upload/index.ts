// Export all upload components and new advanced components
export { default as UniversalUploader } from './UniversalUploader';
export { default as EnhancedFileUploader } from './EnhancedFileUploader';
export { default as SmartColumnMapper } from './SmartColumnMapper';
export { default as UploadProgressTracker } from './UploadProgressTracker';
export { default as ValidationSummary } from './ValidationSummary';
export { default as UploadTypeSelector } from './UploadTypeSelector';

// New consolidated upload components (Fase 1)
export { default as FileUploadZone } from './FileUploadZone';
export { default as FileUploadZoneExample } from './FileUploadZoneExample';
export type { FileUploadZoneProps } from './FileUploadZone';

// New advanced upload components for large datasets
export { AdvancedUploadProvider, useAdvancedUpload } from './AdvancedUploadProvider';
export { default as UniversalDataTable } from './UniversalDataTable';
export { default as LargeDatasetUploader } from './LargeDatasetUploader';

// Export types
export type { UploadedFileInfo, FileUploadConfig } from './EnhancedFileUploader';
export type { UploadStep } from './UploadProgressTracker';
export type { ValidationResult, ValidationSummaryData } from './ValidationSummary';
export type { Column, FilterState, PaginationState, UniversalDataTableProps } from './UniversalDataTable';
export type { UploadSession, FileInfo, UploadConfig, ProcessingOptions, ProcessingResult } from './AdvancedUploadProvider';
export type { FileProcessingResult, LargeDatasetUploaderProps } from './LargeDatasetUploader';