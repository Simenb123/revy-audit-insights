import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Settings, GripVertical, Eye, EyeOff } from 'lucide-react';
import type { ClientColumnConfig } from '@/types/client-extended';

interface ClientColumnsConfigProps {
  columns: ClientColumnConfig[];
  onColumnsChange: (columns: ClientColumnConfig[]) => void;
  onSaveConfiguration?: (config: ClientColumnConfig[]) => void;
}

interface SortableColumnItemProps {
  column: ClientColumnConfig;
  onToggleVisible: (key: string, visible: boolean) => void;
}

const SortableColumnItem: React.FC<SortableColumnItemProps> = ({
  column,
  onToggleVisible,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-background border rounded-lg"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <Checkbox
        id={column.key}
        checked={column.visible}
        onCheckedChange={(checked) => onToggleVisible(column.key, !!checked)}
      />
      
      <Label
        htmlFor={column.key}
        className="flex-1 cursor-pointer font-medium"
      >
        {column.label}
      </Label>
      
      <div className="text-sm text-muted-foreground">
        {column.type}
      </div>
      
      {column.visible ? (
        <Eye className="h-4 w-4 text-green-600" />
      ) : (
        <EyeOff className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  );
};

const ClientColumnsConfig: React.FC<ClientColumnsConfigProps> = ({
  columns,
  onColumnsChange,
  onSaveConfiguration,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [localColumns, setLocalColumns] = useState<ClientColumnConfig[]>(columns);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localColumns.findIndex(column => column.key === active.id);
      const newIndex = localColumns.findIndex(column => column.key === over.id);

      const reorderedColumns = arrayMove(localColumns, oldIndex, newIndex).map((col, index) => ({
        ...col,
        order: index + 1,
      }));

      setLocalColumns(reorderedColumns);
    }
  };

  const handleToggleVisible = (key: string, visible: boolean) => {
    const updatedColumns = localColumns.map(col =>
      col.key === key ? { ...col, visible } : col
    );
    setLocalColumns(updatedColumns);
  };

  const handleApplyChanges = () => {
    onColumnsChange(localColumns);
    setIsDialogOpen(false);
  };

  const handleSaveConfiguration = () => {
    if (onSaveConfiguration) {
      onSaveConfiguration(localColumns);
    }
    handleApplyChanges();
  };

  const handleResetToDefault = () => {
    // Reset to show only essential columns
    const resetColumns = localColumns.map(col => ({
      ...col,
      visible: ['company_name', 'org_number', 'engagement_type', 'phase', 'progress'].includes(col.key),
    }));
    setLocalColumns(resetColumns);
  };

  const visibleColumnsCount = localColumns.filter(col => col.visible).length;
  const totalColumnsCount = localColumns.length;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Kolonner ({visibleColumnsCount}/{totalColumnsCount})
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Konfigurer kolonner</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Dra og slipp for å endre rekkefølge. Kryss av for å vise/skjule kolonner.
          </p>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localColumns.map(col => col.key)}
              strategy={verticalListSortingStrategy}
            >
              {localColumns
                .sort((a, b) => a.order - b.order)
                .map(column => (
                  <SortableColumnItem
                    key={column.key}
                    column={column}
                    onToggleVisible={handleToggleVisible}
                  />
                ))}
            </SortableContext>
          </DndContext>
        </div>
        
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {visibleColumnsCount} av {totalColumnsCount} kolonner synlige
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetToDefault}
            >
              Tilbakestill til standard
            </Button>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setLocalColumns(columns);
                setIsDialogOpen(false);
              }}
            >
              Avbryt
            </Button>
            
            <Button
              variant="outline"
              onClick={handleApplyChanges}
            >
              Bruk endringer
            </Button>
            
            {onSaveConfiguration && (
              <Button onClick={handleSaveConfiguration}>
                Lagre konfigurasjon
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientColumnsConfig;