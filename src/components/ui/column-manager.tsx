import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowDown, ArrowUp, Pin, PinOff, Settings2, GripVertical } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type ColumnState = {
  key: string;
  label: string;
  visible: boolean;
  required?: boolean;
  pinnedLeft?: boolean;
};

interface ColumnManagerProps {
  columns: ColumnState[];
  onChange: (next: ColumnState[]) => void;
  allowPinLeft?: boolean;
  title?: string;
  triggerLabel?: string;
}

const SortableRow: React.FC<{
  col: ColumnState;
  idx: number;
  move: (index: number, dir: -1 | 1) => void;
  columnsLength: number;
  allowPinLeft: boolean;
  togglePinLeft: (key: string) => void;
  toggleVisible: (key: string, visible: boolean) => void;
}> = ({ col, idx, move, columnsLength, allowPinLeft, togglePinLeft, toggleVisible }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: col.key });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <button
          aria-label="Dra for å endre rekkefølge"
          className="h-7 w-7 grid place-items-center rounded border bg-background cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <Checkbox
          id={`vis-${col.key}`}
          checked={col.visible}
          onCheckedChange={(checked) => !col.required && toggleVisible(col.key, !!checked)}
          disabled={col.required}
        />
        <label htmlFor={`vis-${col.key}`} className="text-sm">
          {col.label}
          {col.required && " (påkrevd)"}
        </label>
      </div>
      <div className="flex items-center gap-1">
        {allowPinLeft && (
          <Button
            variant={col.pinnedLeft ? "default" : "outline"}
            size="icon"
            className="h-7 w-7"
            onClick={() => togglePinLeft(col.key)}
            title={col.pinnedLeft ? "Løsne fra venstre" : "Fest til venstre"}
          >
            {col.pinnedLeft ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => move(idx, -1)}
          disabled={idx === 0}
          title="Flytt opp"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => move(idx, 1)}
          disabled={idx === columnsLength - 1}
          title="Flytt ned"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

const ColumnManager: React.FC<ColumnManagerProps> = ({
  columns,
  onChange,
  allowPinLeft = true,
  title = "Tilpass kolonner",
  triggerLabel = "Kolonner",
}) => {
  const move = (index: number, dir: -1 | 1) => {
    const next = [...columns];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  };

  const toggleVisible = (key: string, visible: boolean) => {
    onChange(columns.map(c => (c.key === key ? { ...c, visible } : c)));
  };

  const togglePinLeft = (key: string) => {
    if (!allowPinLeft) return;
    const alreadyPinned = columns.find(c => c.pinnedLeft)?.key;
    onChange(
      columns.map(c =>
        c.key === key
          ? { ...c, pinnedLeft: !c.pinnedLeft }
          : { ...c, pinnedLeft: c.key === alreadyPinned && key !== alreadyPinned ? false : c.pinnedLeft }
      )
    );
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = columns.findIndex((c) => c.key === active.id);
    const newIndex = columns.findIndex((c) => c.key === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(columns, oldIndex, newIndex);
    onChange(next);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-2" />
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <div className="space-y-3">
            <h4 className="font-medium text-sm">{title}</h4>
            <SortableContext items={columns.map((c) => c.key)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {columns.map((col, idx) => (
                  <SortableRow
                    key={col.key}
                    col={col}
                    idx={idx}
                    move={move}
                    columnsLength={columns.length}
                    allowPinLeft={allowPinLeft}
                    togglePinLeft={togglePinLeft}
                    toggleVisible={toggleVisible}
                  />
                ))}
              </div>
            </SortableContext>
          </div>
        </DndContext>
      </PopoverContent>
    </Popover>
  );
};

export default ColumnManager;
