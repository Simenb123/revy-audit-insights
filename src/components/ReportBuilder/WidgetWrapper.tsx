import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { WidgetConfiguration } from './WidgetConfiguration';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useViewMode } from './ViewModeContext';

interface WidgetWrapperProps {
  widget: Widget;
  children: React.ReactNode;
}

export function WidgetWrapper({ widget, children }: WidgetWrapperProps) {
  const { updateWidget, removeWidget } = useWidgetManager();
  const { isViewMode } = useViewMode();

  const handleUpdateWidget = (updates: Partial<Widget>) => {
    updateWidget(widget.id, updates);
  };

  const handleRemoveWidget = () => {
    removeWidget(widget.id);
  };

  return (
    <div className="relative group h-full">
      {children}
      {!isViewMode && (
        <div className="widget-controls absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
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