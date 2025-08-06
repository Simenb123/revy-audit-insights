import { useCallback } from 'react';
import type { Widget, WidgetLayout } from '@/contexts/WidgetManagerContext';

const STORAGE_KEY = 'widget-manager-state';

export function useWidgetPersistence() {
  const load = useCallback((): { widgets: Widget[]; layouts: WidgetLayout[] } | null => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (!raw) return null;
      return JSON.parse(raw) as { widgets: Widget[]; layouts: WidgetLayout[] };
    } catch {
      return null;
    }
  }, []);

  const save = useCallback((widgets: Widget[], layouts: WidgetLayout[]) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ widgets, layouts }));
      }
    } catch {
      // Ignore write errors
    }
  }, []);

  const clear = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return { load, save, clear };
}

