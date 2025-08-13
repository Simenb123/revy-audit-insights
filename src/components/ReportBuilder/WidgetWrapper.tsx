import React, { useRef } from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { WidgetConfiguration } from './WidgetConfiguration';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useViewMode } from './ViewModeContext';
import { useAutoGridItemHeight } from '@/hooks/useAutoGridItemHeight';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

interface WidgetWrapperProps {
  widget: Widget;
  children: React.ReactNode;
}

export function WidgetWrapper({ widget, children }: WidgetWrapperProps) {
  const { updateWidget, removeWidget, widgets } = useWidgetManager();
  const { isViewMode } = useViewMode();
  const containerRef = useRef<HTMLDivElement | null>(null);

// Auto-adjust height to content
  useAutoGridItemHeight(widget.id, containerRef, { minRows: 2, enabled: true });

  const handleUpdateWidget = (updates: Partial<Widget>) => {
    updateWidget(widget.id, updates);
  };

  const handleRemoveWidget = () => {
    removeWidget(widget.id);
  };

  const groupIds = Array.from(new Set(widgets.map(w => w.groupId).filter(Boolean))) as string[];

  const handleGroupChange = (value: string) => {
    if (value === 'new') {
      const name = prompt('Enter group name');
      if (name) {
        handleUpdateWidget({ groupId: name });
      }
    } else if (value === 'none') {
      handleUpdateWidget({ groupId: undefined });
    } else {
      handleUpdateWidget({ groupId: value });
    }
  };
  return (
    <div
      ref={containerRef}
      data-widget-id={widget.id}
      className="relative group h-full overflow-auto"
    >
      {children}
      {!isViewMode && (
        <div className="widget-controls absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div onMouseDown={e => e.stopPropagation()}>
            <Select value={widget.groupId || 'none'} onValueChange={handleGroupChange}>
              <SelectTrigger className="h-6 w-24 text-xs">
                <SelectValue placeholder="Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No group</SelectItem>
                {groupIds.map(id => (
                  <SelectItem key={id} value={id}>{id}</SelectItem>
                ))}
                <SelectItem value="new">New group...</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <WidgetConfiguration
            widget={widget}
            onUpdateWidget={handleUpdateWidget}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive-foreground hover:bg-destructive"
            onClick={handleRemoveWidget}
            onMouseDown={e => e.stopPropagation()}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}