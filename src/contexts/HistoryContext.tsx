import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { WidgetManagerContext, Widget, WidgetLayout } from '@/contexts/WidgetManagerContext';

interface HistoryState {
  widgets: Widget[];
  layouts: WidgetLayout[];
}

interface HistoryContextType {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  restore: () => boolean;
  hasHistory: boolean;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

const HISTORY_STORAGE_KEY = 'history-stack';

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
  const isInitial = useRef(true);
  const [hasHistory, setHasHistory] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(HISTORY_STORAGE_KEY);
  });

  useEffect(() => {
    if (isInitial.current) {
      lastState.current = { widgets, layouts };
      isInitial.current = false;
      return;
    }
    const prev = lastState.current;
    if (prev.widgets !== widgets || prev.layouts !== layouts) {
      setPast(p => [...p, prev]);
      setFuture([]);
      lastState.current = { widgets, layouts };
    }
  }, [widgets, layouts]);

  useEffect(() => {
    if (past.length === 0 && future.length === 0) return;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          HISTORY_STORAGE_KEY,
          JSON.stringify({ past, future, current: { widgets, layouts } })
        );
        setHasHistory(true);
      }
    } catch {
      // ignore
    }
  }, [past, future, widgets, layouts]);

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

  const restore = useCallback(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(HISTORY_STORAGE_KEY) : null;
      if (!raw) return false;
      const parsed = JSON.parse(raw) as { past: HistoryState[]; future: HistoryState[]; current: HistoryState };
      setPast(parsed.past || []);
      setFuture(parsed.future || []);
      setWidgets(parsed.current.widgets);
      setLayouts(parsed.current.layouts);
      lastState.current = parsed.current;
      return true;
    } catch {
      return false;
    }
  }, [setWidgets, setLayouts]);

  return (
    <HistoryContext.Provider
      value={{
        undo,
        redo,
        canUndo: past.length > 0,
        canRedo: future.length > 0,
        restore,
        hasHistory,
      }}
    >
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
