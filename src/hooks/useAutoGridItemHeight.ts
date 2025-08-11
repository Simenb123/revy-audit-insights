import { useEffect, useRef } from 'react';
import { useWidgetManager } from '@/contexts/WidgetManagerContext';
import { GRID_ROW_HEIGHT } from '@/components/ReportBuilder/gridConfig';

/**
 * Automatically adjusts a react-grid-layout item's height (h) to fit its content.
 * Pass a ref to the element that contains the widget content – we read scrollHeight
 * so it also works when the container has a constrained height.
 */
export function useAutoGridItemHeight(
  widgetId: string,
  containerRef: React.RefObject<HTMLElement | null>,
  options?: {
    minRows?: number;
    maxRows?: number; // optional clamp to prevent runaway sizes
    enabled?: boolean;
  }
) {
  const { layouts, updateLayout } = useWidgetManager();
  const lastRowsRef = useRef<number | null>(null);
  const opts = { minRows: 1, enabled: true, ...options };

  useEffect(() => {
    if (!opts.enabled) return;
    const el = containerRef.current;
    if (!el) return;

    const computeRows = () => {
      // scrollHeight gives natural content height even if container is shorter
      const contentHeight = el.scrollHeight || el.offsetHeight || 0;
      // Convert pixel height to grid rows. RGL item height ~ h * rowHeight
      const requiredRows = Math.max(
        opts.minRows ?? 1,
        Math.ceil(contentHeight / GRID_ROW_HEIGHT)
      );
      const clampedRows = typeof opts.maxRows === 'number'
        ? Math.min(requiredRows, opts.maxRows)
        : requiredRows;
      return clampedRows;
    };

    const applyRows = (rows: number) => {
      if (lastRowsRef.current === rows) return;
      const next = layouts.map(l => (l.i === widgetId ? { ...l, h: rows } : l));
      // Avoid unnecessary state update if unchanged
      const current = layouts.find(l => l.i === widgetId);
      if (current && current.h === rows) {
        lastRowsRef.current = rows;
        return;
      }
      lastRowsRef.current = rows;
      updateLayout(next);
    };

    const handleMeasure = () => {
      const rows = computeRows();
      if (rows) applyRows(rows);
    };

    // Initial measure after paint
    const raf = requestAnimationFrame(handleMeasure);

    // Observe content changes
    const ro = new ResizeObserver(() => handleMeasure());
    ro.observe(el);

    // Also respond to font/viewport changes
    window.addEventListener('resize', handleMeasure);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', handleMeasure);
    };
    // Important: depend on layouts length but not the entire object to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetId, containerRef, layouts.length, opts.enabled, opts.minRows, opts.maxRows]);
}
