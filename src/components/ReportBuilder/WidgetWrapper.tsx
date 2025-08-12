import React, { useRef, useState } from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { WidgetConfiguration } from './WidgetConfiguration';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useViewMode } from './ViewModeContext';
import { useAutoGridItemHeight } from '@/hooks/useAutoGridItemHeight';
import { cn } from '@/lib/utils';

interface WidgetWrapperProps {
  widget: Widget;
  children: React.ReactNode;
}

export function WidgetWrapper({ widget, children }: WidgetWrapperProps) {
  const { updateWidget, removeWidget } = useWidgetManager();
  const { isViewMode } = useViewMode();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isActive, setIsActive] = useState(false);

  // Auto-adjust height to content
  useAutoGridItemHeight(widget.id, containerRef, { minRows: 2, enabled: true });

  const handleUpdateWidget = (updates: Partial<Widget>) => {
    updateWidget(widget.id, updates);
  };

  const handleRemoveWidget = () => {
    removeWidget(widget.id);
  };

  const handleMouseDown = () => setIsActive(true);
  const handleMouseUp = () => setIsActive(false);
  const handleMouseLeave = () => setIsActive(false);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative group h-full overflow-auto bg-card border rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-primary',
        isViewMode && 'print:shadow-none print:border-gray-300',
        isActive && 'ring-2 ring-primary shadow-lg'
      )}
    >
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