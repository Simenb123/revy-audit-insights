import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, ChevronDown, GripVertical, Trash2, Clock, Circle, CheckCircle } from 'lucide-react';
import { ClientAuditAction } from '@/types/audit-actions';
import ActionStatusBadge from './ActionStatusBadge';
import ActionQuickActions from './ActionQuickActions';
import ActionProgressIndicator from './ActionProgressIndicator';
import ActionDetailDrawer from './ActionDetailDrawer';
import NewActionDialog from './NewActionDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useReorderClientAuditActions, useBulkUpdateClientActionsStatus, useBulkDeleteClientActions } from '@/hooks/audit-actions/useClientActionBulk';
import BulkActionsToolbar from '@/components/AuditActions/BulkActionsToolbar';

// Sorterbar rad for dra-og-slipp
const SortableRow = ({ action, selected, onToggle, onEdit }: {
  action: ClientAuditAction;
  selected: boolean;
  onToggle: (id: string) => void;
  onEdit: (action: ClientAuditAction) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: action.id });
  const style = { transform: CSS.Transform.toString(transform), transition } as React.CSSProperties;
  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer">
      <div className="flex items-start gap-3" onClick={() => onEdit(action)}>
        <div onClick={(e) => e.stopPropagation()} className="pt-1">
          <Checkbox checked={selected} onCheckedChange={() => onToggle(action.id)} />
        </div>
        <button
          className="p-1 text-muted-foreground hover:text-foreground cursor-grab"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          aria-label="Dra for å sortere"
        >
          <GripVertical size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium text-sm truncate">{action.name}</h3>
            <ActionStatusBadge status={action.status} />
          </div>
          {action.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{action.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">{action.action_type}</Badge>
            </span>
            {action.estimated_hours && (<span>Estimat: {action.estimated_hours}t</span>)}
            {action.actual_hours && (<span>Faktisk: {action.actual_hours}t</span>)}
          </div>
          {action.due_date && (
            <div className="text-xs text-muted-foreground mt-1">
              Forfaller: {new Date(action.due_date).toLocaleDateString('no-NO')}
            </div>
          )}
          {action.completed_at && (
            <div className="text-xs text-green-600 mt-1">
              Fullført: {new Date(action.completed_at).toLocaleDateString('no-NO')}
            </div>
          )}
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <ActionQuickActions action={action} onEdit={() => onEdit(action)} />
        </div>
      </div>
    </div>
  );
};

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

  const areaActions = actions.filter(a => selectedArea === 'all' ? true : a.subject_area === selectedArea);

  const handleEdit = (action: ClientAuditAction) => {
    setSelectedAction(action);
    setDrawerOpen(true);
  };

  // Filter actions by selected area, search term, and status
  const filteredActions = actions.filter(action => {
    const matchesArea = selectedArea === 'all' || action.subject_area === selectedArea;
    const matchesSearch = action.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         action.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || action.status === statusFilter;
    return matchesArea && matchesSearch && matchesStatus;
  });

  const dndEnabled = searchTerm === '' && statusFilter === 'all';

  const onDragEnd = (event: any) => {
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

  const visibleIds = filteredActions.map(a => a.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleSelectAllVisible = () => {
    setSelectedIds(allVisibleSelected ? selectedIds.filter(id => !visibleIds.includes(id)) : Array.from(new Set([...selectedIds, ...visibleIds])));
  };

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
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Søk i handlinger..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <Checkbox checked={allVisibleSelected} onCheckedChange={() => toggleSelectAllVisible()} aria-label="Velg alle synlige" />
                <span className="text-sm text-muted-foreground">Velg synlige</span>
              </div>
            </div>

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
                    <SortableRow
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
            <div className="space-y-3">
              {filteredActions.map((action) => (
                <div
                  key={action.id}
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => handleEdit(action)}
                >
                  <div className="flex items-start gap-3">
                    <div onClick={(e) => e.stopPropagation()} className="pt-1">
                      <Checkbox checked={selectedIds.includes(action.id)} onCheckedChange={() => toggleSelect(action.id)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-sm truncate">{action.name}</h3>
                        <ActionStatusBadge status={action.status} />
                      </div>
                      {action.description && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{action.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">{action.action_type}</Badge>
                        </span>
                        {action.estimated_hours && (<span>Estimat: {action.estimated_hours}t</span>)}
                        {action.actual_hours && (<span>Faktisk: {action.actual_hours}t</span>)}
                      </div>
                      {action.due_date && (
                        <div className="text-xs text-muted-foreground mt-1">Forfaller: {new Date(action.due_date).toLocaleDateString('no-NO')}</div>
                      )}
                      {action.completed_at && (
                        <div className="text-xs text-green-600 mt-1">Fullført: {new Date(action.completed_at).toLocaleDateString('no-NO')}</div>
                      )}
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <ActionQuickActions action={action} onEdit={() => handleEdit(action)} />
                    </div>
                  </div>
                </div>
              ))}
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

