
import React, { useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTasks, Task } from '@/hooks/useTasks';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const STATUSES: Array<Task['status']> = ['todo', 'in_progress', 'blocked', 'on_hold', 'done'];

interface TaskBoardProps {
  teamId?: string;
  year: number;
  month?: number;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ teamId, year, month }) => {
  const { data: tasks = [] } = useTasks({ teamId });

  // Optional: filter tasks by selected period if due_date is set
  const filtered = useMemo(() => {
    if (!month) return tasks;
    return tasks.filter((t) => {
      if (!t.due_date) return true; // keep tasks without due date
      const d = new Date(t.due_date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
  }, [tasks, year, month]);

  const byStatus = useMemo(() => {
    const map: Record<string, Task[]> = {};
    STATUSES.forEach((s) => (map[s] = []));
    filtered.forEach((t) => {
      map[t.status]?.push(t);
    });
    return map;
  }, [filtered]);

  const handleDragEnd = (result: DropResult) => {
    // Drag-and-drop oppdatering av status kommer i neste steg
    return;
  };

  return (
    <Card className="md:col-span-3">
      <CardHeader>
        <CardTitle>Oppgaver (Kanban)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {STATUSES.map((status) => (
                <Droppable droppableId={status} key={status}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="rounded-md border bg-card"
                    >
                      <div className="px-3 py-2 border-b">
                        <div className="text-sm font-medium capitalize">{String(status).replace(/_/g, ' ')}</div>
                        <div className="text-xs text-muted-foreground">
                          {byStatus[status]?.length || 0} oppgaver · {Math.round((byStatus[status] || []).reduce((s, t) => s + (t.estimated_hours || 0), 0))} t
                        </div>
                      </div>
                      <div className="p-2 space-y-2 min-h-[120px]">
                        {(byStatus[status] || []).map((task, idx) => (
                          <Draggable draggableId={task.id} index={idx} key={task.id}>
                            {(dragProvided) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                className="rounded-md border bg-background p-2 shadow-sm"
                              >
                                <div className="text-sm font-medium line-clamp-2">{task.title}</div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  Estimat: {task.estimated_hours ?? 0} t
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskBoard;
