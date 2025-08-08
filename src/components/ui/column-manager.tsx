import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowDown, ArrowUp, Pin, PinOff, Settings2 } from "lucide-react";

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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-2" />
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">{title}</h4>
          <div className="space-y-2">
            {columns.map((col, idx) => (
              <div key={col.key} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
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
                    disabled={idx === columns.length - 1}
                    title="Flytt ned"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColumnManager;
