import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown } from 'lucide-react';
import { ClientAuditAction } from '@/types/audit-actions';
import ActionProgressIndicator from './ActionProgressIndicator';
import ActionDetailDrawer from './ActionDetailDrawer';
import NewActionDialog from './NewActionDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useWindowVirtualizer } from '@tanstack/react-virtual';

import { useReorderClientAuditActions, useBulkUpdateClientActionsStatus, useBulkDeleteClientActions } from '@/hooks/audit-actions/useClientActionBulk';
import BulkActionsToolbar from '@/components/AuditActions/BulkActionsToolbar';
import ActionRowBody from './ActionRowBody';
import SortableActionRow from './SortableActionRow';
import ActionsFilterHeader from './ActionsFilterHeader';


interface ClientActionsListProps {
  actions: ClientAuditAction[];
  selectedArea: string;
  clientId: string;
  phase: import('@/types/revio').AuditPhase;
  onOpenTemplates?: () => void;
}

const ClientActionsList = ({ actions, selectedArea, clientId, phase, onOpenTemplates }: ClientActionsListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<ClientAuditAction | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const reorderMutation = useReorderClientAuditActions();
  const bulkStatus = useBulkUpdateClientActionsStatus();
  const bulkDelete = useBulkDeleteClientActions();

  const sensors = useSensors(useSensor(PointerSensor));

  const areaActions = useMemo(() => actions.filter(a => selectedArea === 'all' ? true : a.subject_area === selectedArea), [actions, selectedArea]);

  const handleEdit = (action: ClientAuditAction) => {
    setSelectedAction(action);
    setDrawerOpen(true);
  };

  // Filter actions by selected area, search term, and status
  const filteredActions = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return actions.filter(action => {
      const matchesArea = selectedArea === 'all' || action.subject_area === selectedArea;
      const matchesSearch = action.name.toLowerCase().includes(term) || action.description?.toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all' || action.status === statusFilter;
      return matchesArea && matchesSearch && matchesStatus;
    });
  }, [actions, selectedArea, searchTerm, statusFilter]);

const dndEnabled = searchTerm === '' && statusFilter === 'all';

// Virtualizer for non-dnd list rendering
const rowVirtualizer = useWindowVirtualizer({
  count: filteredActions.length,
  estimateSize: () => 72,
  overscan: 8,
});


  const onDragEnd = (event: DragEndEvent) => {
    if (!dndEnabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = areaActions.findIndex(a => a.id === active.id);
    const toIndex = areaActions.findIndex(a => a.id === over.id);
    if (fromIndex === -1 || toIndex === -1) return;
    const reordered = arrayMove(areaActions, fromIndex, toIndex);
    const updates = reordered.map((a, idx) => ({ id: a.id, sort_order: idx }));
    reorderMutation.mutate({ clientId, updates });
  };
  const visibleIds = useMemo(() => filteredActions.map(a => a.id), [filteredActions]);
  const allVisibleSelected = useMemo(() => visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id)), [visibleIds, selectedIds]);
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);
  const toggleSelectAllVisible = useCallback(() => {
    setSelectedIds(prev => (allVisibleSelected ? prev.filter(id => !visibleIds.includes(id)) : Array.from(new Set([...prev, ...visibleIds]))));
  }, [allVisibleSelected, visibleIds]);
  const statusOptions = [
    { value: 'all', label: 'Alle statuser' },
    { value: 'not_started', label: 'Ikke startet' },
    { value: 'in_progress', label: 'Pågående' },
    { value: 'completed', label: 'Fullført' },
    { value: 'reviewed', label: 'Under gjennomgang' },
    { value: 'approved', label: 'Godkjent' }
  ];

  return (
    <div
      className="space-y-4"
      ref={listRef}
      tabIndex={0}
      onKeyDown={(e) => {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || (target as HTMLElement).isContentEditable)) return;
        const key = e.key.toLowerCase();
        if ((e.ctrlKey || e.metaKey) && key === 'a') { e.preventDefault(); toggleSelectAllVisible(); return; }
        if (selectedIds.length === 0) return;
        if (key === 'escape') { setSelectedIds([]); return; }
        if (key === 'delete' || key === 'backspace') { setConfirmOpen(true); return; }
        const doStatus = (status: any) => bulkStatus.mutate({ clientId, ids: selectedIds, status }, { onSuccess: () => setSelectedIds([]) });
        if (key === '1') doStatus('not_started');
        else if (key === '2') doStatus('in_progress');
        else if (key === '3') doStatus('completed');
        else if (key === 'r') doStatus('reviewed');
        else if (key === 'g') doStatus('approved');
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
                  <DropdownMenuItem onClick={() => {
                    if (onOpenTemplates) onOpenTemplates();
                    else toast('Bytt til fanen Handlingsmaler for å velge maler.');
                  }}>Fra mal</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-col gap-2 mt-4">
  <ActionsFilterHeader
    searchTerm={searchTerm}
    onSearchChange={setSearchTerm}
    statusFilter={statusFilter}
    onStatusChange={setStatusFilter}
    statusOptions={statusOptions}
    allVisibleSelected={allVisibleSelected}
    onToggleSelectAllVisible={toggleSelectAllVisible}
  />

            {selectedIds.length > 0 && (
              <BulkActionsToolbar
                selectedCount={selectedIds.length}
                disabled={bulkStatus.isPending || bulkDelete.isPending}
                onStatus={(status) => bulkStatus.mutate({ clientId, ids: selectedIds, status } as any, { onSuccess: () => setSelectedIds([]) })}
                onDeleteConfirm={() => bulkDelete.mutate({ clientId, ids: selectedIds }, { onSuccess: () => { setSelectedIds([]); setConfirmOpen(false); } })}
                onClear={() => setSelectedIds([])}
                confirmOpen={confirmOpen}
                setConfirmOpen={setConfirmOpen}
              />
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredActions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {(() => {
                const areaSubset = selectedArea === 'all' ? actions : actions.filter(a => a.subject_area === selectedArea);
                return areaSubset.length === 0 ? (
                  <div className="space-y-3">
                    <div>Ingen handlinger funnet for dette fagområdet</div>
                    <Button size="sm" className="gap-2" onClick={() => setNewOpen(true)}>
                      <Plus size={16} />
                      Ny handling
                    </Button>
                  </div>
                ) : (
                  <div>Ingen handlinger matcher søkekriteriene</div>
                );
              })()}
            </div>
          ) : dndEnabled ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={areaActions.map(a => a.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {areaActions.map((action) => (
                    <SortableActionRow
                      key={action.id}
                      action={action}
                      selected={selectedIds.includes(action.id)}
                      onToggle={toggleSelect}
                      onEdit={handleEdit}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
<div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
    const action = filteredActions[virtualRow.index];
    return (
      <div
        key={virtualRow.key}
        data-index={virtualRow.index}
        ref={(el) => el && rowVirtualizer.measureElement(el)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          transform: `translateY(${virtualRow.start}px)`,
        }}
      >
        <ActionRowBody
          action={action}
          selected={selectedIds.includes(action.id)}
          onToggle={toggleSelect}
          onEdit={handleEdit}
        />
      </div>
    );
  })}
</div>
          )}

        </CardContent>
      </Card>

      <ActionDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        action={selectedAction}
      />

      {(() => {
        const areaActions = selectedArea === 'all' ? actions : actions.filter(a => a.subject_area === selectedArea);
        const maxSort = areaActions.length ? Math.max(...areaActions.map(a => a.sort_order || 0)) : 0;
        const nextSortOrder = maxSort + 1;
        return (
          <NewActionDialog
            open={newOpen}
            onOpenChange={setNewOpen}
            clientId={clientId}
            selectedArea={selectedArea}
            phase={phase}
            nextSortOrder={nextSortOrder}
            onCreated={(created) => { setSelectedAction(created); setDrawerOpen(true); }}
          />
        );
      })()}
    </div>
  );
};

export default ClientActionsList;

