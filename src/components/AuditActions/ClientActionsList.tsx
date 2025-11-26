import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown } from 'lucide-react';
import { ClientAuditAction } from '@/types/audit-actions';
import ActionProgressIndicator from './ActionProgressIndicator';
import NewActionDialog from './NewActionDialog';
import AddActionsDialog from './AddActionsDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useReorderClientAuditActions } from '@/hooks/audit-actions/useClientActionBulk';
import { useCopyActionsFromTemplate } from '@/hooks/useAuditActions';
import BulkActionsToolbar from '@/components/AuditActions/BulkActionsToolbar';
import ActionList from './core/ActionList';
import ExpandableActionCard from './core/ExpandableActionCard';
import ActionFilters from './core/ActionFilters';
import { useAuditActionsContext } from '@/contexts/AuditActionsContext';
import type { FilterConfig } from './core/ActionFilters';


interface ClientActionsListProps {
  actions: ClientAuditAction[];
  clientId: string;
  phase: import('@/types/revio').AuditPhase;
  onOpenTemplates?: () => void;
}

const ClientActionsList = ({ actions, clientId, phase, onOpenTemplates }: ClientActionsListProps) => {
  const [filters, setFilters] = useState<FilterConfig>({
    search: '',
    status: 'all',
  });
  const [newOpen, setNewOpen] = useState(false);
  const [addFromTemplatesOpen, setAddFromTemplatesOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  
  const copyActionsMutation = useCopyActionsFromTemplate();

  const { 
    selectedIds, 
    toggleSelect, 
    selectAll, 
    clearSelection, 
    bulkUpdateStatus, 
    bulkDelete: contextBulkDelete,
    isLoading: contextLoading 
  } = useAuditActionsContext();

  const reorderMutation = useReorderClientAuditActions();

  const filteredActions = useMemo(() => {
    const term = filters.search?.toLowerCase() || '';
    return actions.filter(action => {
      const matchesSearch = !term || action.name.toLowerCase().includes(term) || action.description?.toLowerCase().includes(term);
      const matchesStatus = filters.status === 'all' || action.status === filters.status;
      return matchesSearch && matchesStatus;
    });
  }, [actions, filters]);

  const handleReorder = (updates: Array<{ id: string; sort_order: number }>) => {
    reorderMutation.mutate({ clientId, updates });
  };

  const handleCopyFromTemplates = async (templateIds: string[]) => {
    try {
      await copyActionsMutation.mutateAsync({
        clientId,
        templateIds,
        phase
      });
      toast.success('Maler kopiert til klienten');
      setAddFromTemplatesOpen(false);
    } catch (error) {
      toast.error('Kunne ikke kopiere maler');
    }
  };

  const visibleIds = useMemo(() => filteredActions.map(a => a.id), [filteredActions]);
  const allVisibleSelected = useMemo(() => 
    visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id)), 
    [visibleIds, selectedIds]
  );

  const handleToggleSelectAll = useCallback(() => {
    if (allVisibleSelected) {
      clearSelection();
    } else {
      selectAll(visibleIds);
    }
  }, [allVisibleSelected, visibleIds, selectAll, clearSelection]);

  const handleBulkStatus = useCallback((status: string) => {
    bulkUpdateStatus(clientId, status as any);
  }, [clientId, bulkUpdateStatus]);

  const handleBulkDelete = useCallback(() => {
    contextBulkDelete(clientId);
    setConfirmOpen(false);
  }, [clientId, contextBulkDelete]);

  return (
    <div
      className="space-y-4"
      tabIndex={0}
      onKeyDown={(e) => {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || (target as HTMLElement).isContentEditable)) return;
        const key = e.key.toLowerCase();
        if ((e.ctrlKey || e.metaKey) && key === 'a') { e.preventDefault(); handleToggleSelectAll(); return; }
        if (selectedIds.length === 0) return;
        if (key === 'escape') { clearSelection(); return; }
        if (key === 'delete' || key === 'backspace') { setConfirmOpen(true); return; }
        if (key === '1') handleBulkStatus('not_started');
        else if (key === '2') handleBulkStatus('in_progress');
        else if (key === '3') handleBulkStatus('completed');
        else if (key === 'r') handleBulkStatus('reviewed');
        else if (key === 'g') handleBulkStatus('approved');
      }}
      aria-label="Liste over revisjonshandlinger. Bruk Ctrl/Cmd+A for å velge synlige, Delete for å slette, 1/2/3 for status, R for gjennomgått, G for godkjent."
    >
      <ActionProgressIndicator actions={filteredActions} />
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button size="sm" className="gap-2" onClick={() => setNewOpen(true)}>
                <Plus size={16} />
                Ny handling
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" aria-label="Flere måter å legge til">
                    <ChevronDown size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setNewOpen(true)}>Fra blank</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAddFromTemplatesOpen(true)}>
                    Fra mal
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-col gap-2 mt-4">
            <ActionFilters
              filters={filters}
              onChange={setFilters}
              enabledFilters={{ search: true, status: true }}
              showSelectAll={true}
              allSelected={allVisibleSelected}
              onToggleSelectAll={handleToggleSelectAll}
              resultCount={filteredActions.length}
              totalCount={actions.length}
            />

            {selectedIds.length > 0 && (
              <BulkActionsToolbar
                selectedCount={selectedIds.length}
                disabled={contextLoading}
                onStatus={handleBulkStatus}
                onDeleteConfirm={handleBulkDelete}
                onClear={clearSelection}
                confirmOpen={confirmOpen}
                setConfirmOpen={setConfirmOpen}
              />
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <ActionList
            items={filteredActions}
            renderItem={(action, { selected, onToggle, dragHandle }) => (
              <ExpandableActionCard
                action={action as ClientAuditAction}
                selected={selected}
                onToggle={onToggle}
                dragHandle={dragHandle}
                showCheckbox={true}
              />
            )}
            enableDragDrop={filters.search === '' && filters.status === 'all'}
            onReorder={handleReorder}
            enableVirtualization={filteredActions.length > 50}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            emptyState={
              <div className="text-center py-8 text-muted-foreground">
                {actions.length === 0 ? (
                  <div className="space-y-3">
                    <div>Ingen handlinger funnet</div>
                    <div className="flex items-center gap-2 justify-center">
                      <Button size="sm" className="gap-2" onClick={() => setNewOpen(true)}>
                        <Plus size={16} />
                        Ny handling
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setAddFromTemplatesOpen(true)}>
                        Fra mal
                      </Button>
                    </div>
                  </div>
                ) : (
                  'Ingen handlinger matcher søkekriteriene'
                )}
              </div>
            }
          />
        </CardContent>
      </Card>

      {(() => {
        const maxSort = actions.length ? Math.max(...actions.map(a => a.sort_order || 0)) : 0;
        const nextSortOrder = maxSort + 1;
        return (
          <NewActionDialog
            open={newOpen}
            onOpenChange={setNewOpen}
            clientId={clientId}
            phase={phase}
            nextSortOrder={nextSortOrder}
            onCreated={() => {}}
          />
        );
      })()}

      <AddActionsDialog
        open={addFromTemplatesOpen}
        onOpenChange={setAddFromTemplatesOpen}
        clientId={clientId}
        phase={phase}
        onCopyToClient={handleCopyFromTemplates}
      />
    </div>
  );
};

export default ClientActionsList;

