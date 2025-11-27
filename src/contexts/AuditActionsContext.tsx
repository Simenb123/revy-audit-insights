import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import { ActionStatus } from '@/types/audit-actions';
import { useBulkUpdateClientActionsStatus, useBulkDeleteClientActions } from '@/hooks/audit-actions/useClientActionBulk';
import { useAuditActionTemplates } from '@/hooks/audit-actions/useActionTemplateCRUD';

interface AuditActionsContextValue {
  // Selection state
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  
  // Bulk operations
  bulkUpdateStatus: (clientId: string, status: ActionStatus) => Promise<void>;
  bulkDelete: (clientId: string) => Promise<void>;
  
  // State
  isLoading: boolean;
  error: Error | null;
}

const AuditActionsContext = createContext<AuditActionsContextValue | undefined>(undefined);

export const useAuditActionsContext = () => {
  const context = useContext(AuditActionsContext);
  if (!context) {
    throw new Error('useAuditActionsContext must be used within AuditActionsProvider');
  }
  return context;
};

interface AuditActionsProviderProps {
  children: ReactNode;
  actions?: any[];
}

export const AuditActionsProvider = ({ children, actions = [] }: AuditActionsProviderProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const { data: actionTemplates = [] } = useAuditActionTemplates();

  const bulkStatusMutation = useBulkUpdateClientActionsStatus();
  const bulkDeleteMutation = useBulkDeleteClientActions();

  const isLoading = bulkStatusMutation.isPending || bulkDeleteMutation.isPending;

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.includes(id),
    [selectedIds]
  );

  const bulkUpdateStatus = useCallback(
    async (clientId: string, status: ActionStatus) => {
      if (selectedIds.length === 0) {
        toast.error('Ingen handlinger valgt');
        return;
      }

      try {
        setError(null);
        await bulkStatusMutation.mutateAsync({
          clientId,
          ids: selectedIds,
          status,
        });
        toast.success(`${selectedIds.length} handling(er) oppdatert`);
        clearSelection();
      } catch (err) {
        const error = err as Error;
        setError(error);
        toast.error('Kunne ikke oppdatere handlinger');
      }
    },
    [selectedIds, bulkStatusMutation, clearSelection]
  );

  const bulkDelete = useCallback(
    async (clientId: string) => {
      if (selectedIds.length === 0) {
        toast.error('Ingen handlinger valgt');
        return;
      }

      // Filter out system template actions
      const systemTemplateIds = new Set(
        actionTemplates
          .filter((t: any) => t.is_system_template)
          .map((t: any) => t.id)
      );
      
      const selectedActions = actions.filter((a: any) => selectedIds.includes(a.id));
      const deletableIds = selectedActions
        .filter((a: any) => !a.template_id || !systemTemplateIds.has(a.template_id))
        .map((a: any) => a.id);
      
      const mandatoryCount = selectedIds.length - deletableIds.length;
      
      if (mandatoryCount > 0) {
        toast.error(`${mandatoryCount} obligatorisk${mandatoryCount > 1 ? 'e' : ''} handling${mandatoryCount > 1 ? 'er' : ''} kan ikke slettes`);
      }
      
      if (deletableIds.length === 0) {
        clearSelection();
        return;
      }

      try {
        setError(null);
        await bulkDeleteMutation.mutateAsync({
          clientId,
          ids: deletableIds,
        });
        toast.success(`${deletableIds.length} handling(er) slettet`);
        clearSelection();
      } catch (err) {
        const error = err as Error;
        setError(error);
        toast.error('Kunne ikke slette handlinger');
      }
    },
    [selectedIds, bulkDeleteMutation, clearSelection, actionTemplates, actions]
  );

  const value: AuditActionsContextValue = {
    selectedIds,
    toggleSelect,
    selectAll,
    clearSelection,
    isSelected,
    bulkUpdateStatus,
    bulkDelete,
    isLoading,
    error,
  };

  return (
    <AuditActionsContext.Provider value={value}>
      {children}
    </AuditActionsContext.Provider>
  );
};
