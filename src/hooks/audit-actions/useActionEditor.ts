import { useState, useEffect } from 'react';
import { ActionStatus, ClientAuditAction } from '@/types/audit-actions';
import type { WorkingPaperData, WorkingPaperResponseData } from '@/types/working-paper';
import { useUpdateClientAuditAction } from '@/hooks/useAuditActions';
import { validateResponseFields, calculateCompletionPercentage, ResponseField } from './useResponseFieldValidation';
import { toast } from 'sonner';

/**
 * Hook for managing action editing state and operations.
 * Consolidates logic previously duplicated in ExpandableActionCard and ActionDetailDrawer.
 * 
 * @param action - The client audit action to edit
 * @param responseFields - Optional array of response field definitions from the template
 * @returns Object containing state and handlers for editing the action
 * 
 * @example
 * ```tsx
 * const {
 *   status,
 *   responseFieldValues,
 *   hasChanges,
 *   handleStatusChange,
 *   handleResponseFieldChange,
 *   handleSave,
 *   getCompletionPercentage,
 * } = useActionEditor(action, template?.response_fields);
 * ```
 */
export function useActionEditor(
  action: ClientAuditAction,
  responseFields?: ResponseField[]
) {
  const updateMutation = useUpdateClientAuditAction();
  
  const [status, setStatus] = useState<ActionStatus>(action.status);
  const [responseFieldValues, setResponseFieldValues] = useState<WorkingPaperResponseData>({});
  const [responseFieldErrors, setResponseFieldErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Sync with action changes
  useEffect(() => {
    setStatus(action.status);
    
    const wpData: WorkingPaperData = action.working_paper_data ?? {};
    const responseData = wpData.response_data || {};
    setResponseFieldValues(responseData);
    setHasChanges(false);
  }, [action]);

  const handleValidateFields = (): boolean => {
    const { isValid, errors } = validateResponseFields(
      responseFields,
      responseFieldValues
    );
    setResponseFieldErrors(errors);
    return isValid;
  };

  const getCompletionPercentage = (): number => {
    return calculateCompletionPercentage(
      responseFields,
      responseFieldValues
    );
  };

  const handleSave = async () => {
    if (!handleValidateFields()) {
      toast.error('Vennligst fyll ut alle obligatoriske felter');
      return false;
    }

    try {
      const wpData: WorkingPaperData = action.working_paper_data ?? {};
      const updatedWpData: WorkingPaperData = {
        ...wpData,
        response_data: responseFieldValues
      };

      await updateMutation.mutateAsync({
        id: action.id,
        updates: {
          status,
          working_paper_data: updatedWpData,
        },
      });

      toast.success('Handlingen er oppdatert');
      setHasChanges(false);
      return true;
    } catch (error) {
      toast.error('Kunne ikke oppdatere handlingen');
      return false;
    }
  };

  const handleStatusChange = (newStatus: ActionStatus) => {
    if (newStatus === 'completed' && !handleValidateFields()) {
      toast.error('Fyll ut alle obligatoriske felter før du fullfører handlingen');
      return;
    }
    setStatus(newStatus);
    setHasChanges(true);
  };

  const handleResponseFieldChange = (fieldId: string, value: string | number | boolean | string[] | null) => {
    setResponseFieldValues((prev) => ({
      ...prev,
      [fieldId]: value
    }));
    setHasChanges(true);
    
    // Clear error for this field
    if (responseFieldErrors[fieldId]) {
      setResponseFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  return {
    status,
    responseFieldValues,
    responseFieldErrors,
    hasChanges,
    isUpdating: updateMutation.isPending,
    handleStatusChange,
    handleResponseFieldChange,
    handleSave,
    handleValidateFields,
    getCompletionPercentage,
  };
}
