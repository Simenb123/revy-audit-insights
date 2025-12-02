/**
 * Audit Actions Hooks
 * 
 * This module exports all hooks related to audit actions management.
 * These hooks handle CRUD operations, state management, and validation
 * for audit action templates and client-specific audit actions.
 */

// Template CRUD operations
export {
  useAuditActionTemplates,
  useCreateAuditActionTemplate,
  useUpdateAuditActionTemplate,
  useDeleteAuditActionTemplate,
} from './useActionTemplateCRUD';

// Client action operations
export { useDeleteClientAction } from './useDeleteClientAction';
export { useCopyActionsFromClient } from './useCopyActionsFromClient';
export { useDeleteOldClientActions } from './useDeleteOldClientActions';

// Action workflow
export { useCompleteAction } from './useCompleteAction';
export { useStartTimeTracking } from './useStartTimeTracking';

// Action editing and validation
export { useActionEditor } from './useActionEditor';
export {
  validateResponseFields,
  calculateCompletionPercentage,
  type ResponseField,
} from './useResponseFieldValidation';

// Comments
export { useActionComments } from './useActionComments';
export { useCreateComment } from './useCreateComment';
export { useDeleteComment } from './useDeleteComment';
export { useResolveComment } from './useResolveComment';

// Subject areas and filters
export { useSubjectAreaLabels } from './useSubjectAreaLabels';
export { useTemplateFilters } from './useTemplateFilters';
