# Deprecated Shareholders Components

This directory contains deprecated upload components that are being phased out in favor of the new universal upload system.

## Components to be removed:

- **ShareholderUpload.tsx** - Multi-file upload with sequential processing
- **OptimizedImportForm.tsx** - Advanced form with session handling
- **ImportProgressMonitor.tsx** - Real-time progress monitoring
- **EnhancedImportMonitor.tsx** - Enhanced monitoring dashboard

## Migration Status:

- ✅ New AdvancedUploadProvider created
- ✅ UniversalDataTable implemented
- ✅ LargeDatasetUploader implemented
- 🚧 ShareholdersUpload.tsx - Current active component (to be enhanced)
- ❌ Old components not yet removed

## Next Steps:

1. Enhance ShareholdersUpload.tsx to use new universal system
2. Test all functionality with large datasets
3. Remove deprecated components
4. Update all references in other files

## DO NOT USE:

These components are kept for reference only and should not be used in new development.