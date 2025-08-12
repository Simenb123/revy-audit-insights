import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { WidgetManagerContext, Widget, WidgetLayout, LayoutsByBreakpoint } from '@/contexts/WidgetManagerContext';

interface HistoryState {
  widgets: Widget[];
  layouts: LayoutsByBreakpoint;
}

interface HistoryContextType {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const manager = useContext(WidgetManagerContext);
  if (!manager) {
    return (
      <HistoryContext.Provider value={{ undo: () => {}, redo: () => {}, canUndo: false, canRedo: false }}>
        {children}
      </HistoryContext.Provider>
    );
  }
  const { widgets, layouts, setWidgets, setLayouts } = manager;
  const [past, setPast] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);
  const lastState = useRef<HistoryState>({ widgets, layouts });

  useEffect(() => {
    const prev = lastState.current;
    if (prev.widgets !== widgets || prev.layouts !== layouts) {
      setPast(p => [...p, prev]);
      setFuture([]);
      lastState.current = { widgets, layouts };
    }
  }, [widgets, layouts]);

  const undo = () => {
    setPast(past => {
      if (past.length === 0) return past;
      const previous = past[past.length - 1];
      setFuture(f => [...f, { widgets, layouts }]);
      setWidgets(previous.widgets);
      setLayouts(previous.layouts);
      lastState.current = previous;
      return past.slice(0, -1);
    });
  };

  const redo = () => {
    setFuture(future => {
      if (future.length === 0) return future;
      const next = future[future.length - 1];
      setPast(p => [...p, { widgets, layouts }]);
      setWidgets(next.widgets);
      setLayouts(next.layouts);
      lastState.current = next;
      return future.slice(0, -1);
    });
  };

  return (
    <HistoryContext.Provider value={{ undo, redo, canUndo: past.length > 0, canRedo: future.length > 0 }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return ctx;
}
