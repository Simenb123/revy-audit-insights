import React, { useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { GripVertical } from 'lucide-react';

interface ActionListProps<T extends { id: string; sort_order?: number }> {
  items: T[];
  renderItem: (item: T, options: {
    selected: boolean;
    onToggle: (id: string) => void;
    dragHandle?: React.ReactNode;
  }) => React.ReactNode;
  emptyState?: React.ReactNode;
  enableDragDrop?: boolean;
  enableVirtualization?: boolean;
  onReorder?: (items: T[]) => void;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  keyboardShortcuts?: boolean;
}

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

const SortableItem = ({ id, children }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;

  const dragHandle = (
    <button
      className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
      aria-label="Dra for å sortere"
      title="Dra for å sortere"
    >
      <GripVertical size={16} />
    </button>
  );

  return (
    <div ref={setNodeRef} style={style}>
      {React.cloneElement(children as React.ReactElement, { dragHandle })}
    </div>
  );
};

function ActionList<T extends { id: string; sort_order?: number }>({
  items,
  renderItem,
  emptyState,
  enableDragDrop = false,
  enableVirtualization = false,
  onReorder,
  selectedIds = [],
  onToggleSelect,
  keyboardShortcuts = false,
}: ActionListProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  const rowVirtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => 72,
    overscan: 8,
    enabled: enableVirtualization && !enableDragDrop,
  });

  const handleDragEnd = (event: DragEndEvent) => {
    if (!enableDragDrop || !onReorder) return;
    
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromIndex = items.findIndex((item) => item.id === active.id);
    const toIndex = items.findIndex((item) => item.id === over.id);
    
    if (fromIndex === -1 || toIndex === -1) return;

    const reordered = arrayMove(items, fromIndex, toIndex);
    onReorder(reordered);
  };

  const handleToggle = (id: string) => {
    if (onToggleSelect) {
      onToggleSelect(id);
    }
  };

  // Empty state
  if (items.length === 0) {
    return emptyState || (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Ingen elementer å vise
        </CardContent>
      </Card>
    );
  }

  // Drag-n-drop mode (no virtualization)
  if (enableDragDrop && onReorder) {
    return (
      <div ref={listRef} className="space-y-3">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            {items.map((item) => (
              <SortableItem key={item.id} id={item.id}>
                {renderItem(item, {
                  selected: selectedIds.includes(item.id),
                  onToggle: handleToggle,
                })}
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
      </div>
    );
  }

  // Virtualized mode
  if (enableVirtualization) {
    return (
      <div ref={listRef} style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index];
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
              {renderItem(item, {
                selected: selectedIds.includes(item.id),
                onToggle: handleToggle,
              })}
            </div>
          );
        })}
      </div>
    );
  }

  // Standard mode
  return (
    <div ref={listRef} className="space-y-3">
      {items.map((item) => (
        <div key={item.id}>
          {renderItem(item, {
            selected: selectedIds.includes(item.id),
            onToggle: handleToggle,
          })}
        </div>
      ))}
    </div>
  );
}

export default ActionList;
