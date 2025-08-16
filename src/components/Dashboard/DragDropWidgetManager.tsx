import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWidgetManager } from '@/contexts/WidgetManagerContext';
import { WidgetRenderer } from '@/components/ReportBuilder/WidgetRenderer';
import { GripVertical, Plus, Download, Upload, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DragDropWidgetManagerProps {
  className?: string;
  enableCrossSectionDrag?: boolean;
}

export function DragDropWidgetManager({ 
  className, 
  enableCrossSectionDrag = true 
}: DragDropWidgetManagerProps) {
  const { widgets, layouts, updateLayout } = useWidgetManager();
  const [draggedSection, setDraggedSection] = useState<string | null>(null);

  // Group widgets by section
  const widgetSections = widgets.reduce((acc, widget) => {
    const sectionId = widget.sectionId || 'default';
    if (!acc[sectionId]) {
      acc[sectionId] = [];
    }
    acc[sectionId].push(widget);
    return acc;
  }, {} as Record<string, typeof widgets>);

  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) {
      setDraggedSection(null);
      return;
    }

    if (type === 'SECTION') {
      // Handle section reordering
      const sections = Object.keys(widgetSections);
      const [removed] = sections.splice(source.index, 1);
      sections.splice(destination.index, 0, removed);
      // Update section order in layouts
      // Implementation would go here
    } else {
      // Handle widget movement
      const sourceSection = source.droppableId;
      const destSection = destination.droppableId;

      if (sourceSection === destSection) {
        // Reorder within same section
        const sectionWidgets = [...widgetSections[sourceSection]];
        const [removed] = sectionWidgets.splice(source.index, 1);
        sectionWidgets.splice(destination.index, 0, removed);

        // Update layouts
        const newLayouts = layouts.map(layout => {
          if (layout.widgetId === draggableId) {
            return { ...layout, y: destination.index * 2 };
          }
          return layout;
        });
        updateLayout(newLayouts);
      } else if (enableCrossSectionDrag) {
        // Move between sections
        const widget = widgets.find(w => w.id === draggableId);
        if (widget) {
          // Update widget section
          const updatedWidget = { ...widget, sectionId: destSection };
          // Implementation for updating widget would go here
        }
      }
    }

    setDraggedSection(null);
  }, [widgets, layouts, widgetSections, updateLayout, enableCrossSectionDrag]);

  const handleDragStart = useCallback((start: any) => {
    if (start.type === 'SECTION') {
      setDraggedSection(start.draggableId);
    }
  }, []);

  return (
    <div className={cn("space-y-6", className)}>
      <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <Droppable droppableId="sections" type="SECTION">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                "space-y-4",
                snapshot.isDraggingOver && "bg-muted/30 rounded-lg p-2"
              )}
            >
              {Object.entries(widgetSections).map(([sectionId, sectionWidgets], sectionIndex) => (
                <Draggable 
                  key={sectionId} 
                  draggableId={sectionId} 
                  index={sectionIndex}
                  isDragDisabled={!enableCrossSectionDrag}
                >
                  {(sectionProvided, sectionSnapshot) => (
                    <Card
                      ref={sectionProvided.innerRef}
                      {...sectionProvided.draggableProps}
                      className={cn(
                        "transition-all duration-200",
                        sectionSnapshot.isDragging && "shadow-lg rotate-2",
                        draggedSection === sectionId && "opacity-50"
                      )}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <div 
                              {...sectionProvided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                            {sectionId === 'default' ? 'Standard Widgets' : `Seksjon: ${sectionId}`}
                            <Badge variant="secondary">{sectionWidgets.length}</Badge>
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <Droppable droppableId={sectionId} type="WIDGET">
                          {(widgetProvided, widgetSnapshot) => (
                            <div
                              ref={widgetProvided.innerRef}
                              {...widgetProvided.droppableProps}
                              className={cn(
                                "space-y-3 min-h-[100px]",
                                widgetSnapshot.isDraggingOver && "bg-primary/5 rounded-lg p-2"
                              )}
                            >
                              {sectionWidgets.map((widget, index) => (
                                <Draggable 
                                  key={widget.id} 
                                  draggableId={widget.id} 
                                  index={index}
                                >
                                  {(widgetDragProvided, widgetDragSnapshot) => (
                                    <div
                                      ref={widgetDragProvided.innerRef}
                                      {...widgetDragProvided.draggableProps}
                                      className={cn(
                                        "bg-card border rounded-lg p-3 transition-all duration-200",
                                        widgetDragSnapshot.isDragging && "shadow-lg scale-105 rotate-1 z-50",
                                        widgetDragSnapshot.isDragging && "bg-background"
                                      )}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div
                                          {...widgetDragProvided.dragHandleProps}
                                          className="cursor-grab active:cursor-grabbing p-1"
                                        >
                                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium">{widget.title}</h4>
                                            <Badge variant="outline" className="text-xs">
                                              {widget.type}
                                            </Badge>
                                          </div>
                                          {!widgetDragSnapshot.isDragging && (
                                            <div className="max-h-32 overflow-hidden">
                                              <WidgetRenderer widget={widget} />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {widgetProvided.placeholder}
                              
                              {sectionWidgets.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                  <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  <p>Dra widgets hit eller legg til nye</p>
                                </div>
                              )}
                            </div>
                          )}
                        </Droppable>
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}