import { useCallback, useMemo } from 'react';
import type { Widget, WidgetLayout } from '@/contexts/WidgetManagerContext';

export function useWidgetPersistence(clientId?: string | null, year?: number) {
  const storageKey = useMemo(() => {
    if (clientId && year !== undefined) {
      return `widget-manager-state-${clientId}-${year}`;
    }
    return 'widget-manager-state';
  }, [clientId, year]);

  const load = useCallback(
    (): { widgets: Widget[]; layouts: WidgetLayout[] } | null => {
      try {
        const raw =
          typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
        if (!raw) return null;
        return JSON.parse(raw) as { widgets: Widget[]; layouts: WidgetLayout[] };
      } catch {
        return null;
      }
    },
    [storageKey]
  );

  const save = useCallback(
    (widgets: Widget[], layouts: WidgetLayout[]) => {
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, JSON.stringify({ widgets, layouts }));
        }
      } catch {
        // Ignore write errors
      }
    },
    [storageKey]
  );

  const clear = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  return { load, save, clear };
}

