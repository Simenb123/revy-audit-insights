import { useEffect, useRef } from 'react';
import { useWidgetManager } from '@/contexts/WidgetManagerContext';
import { GRID_ROW_HEIGHT, GRID_DEFAULT_MAX_ROWS } from '@/components/ReportBuilder/gridConfig';

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
  const debounceIdRef = useRef<number | null>(null);
  const shrinkTimerRef = useRef<number | null>(null);
  const pendingShrinkRowsRef = useRef<number | null>(null);
  const opts = { minRows: 1, maxRows: GRID_DEFAULT_MAX_ROWS, enabled: true, ...options };

  useEffect(() => {
    if (!opts.enabled) return;
    const el = containerRef.current;
    if (!el) return;

    const DEBOUNCE_MS = 120;
    const SHRINK_DELAY_MS = 400;

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

    const commitRows = (rows: number) => {
      if (lastRowsRef.current === rows) return;
      const current = layouts.find(l => l.i === widgetId);
      if (current && current.h === rows) {
        lastRowsRef.current = rows;
        return;
      }
      const next = layouts.map(l => (l.i === widgetId ? { ...l, h: rows } : l));
      lastRowsRef.current = rows;
      updateLayout(next);
    };

    const handleMeasure = () => {
      const rows = computeRows();
      if (!rows) return;
      const last = lastRowsRef.current;

      if (last == null) {
        commitRows(rows);
        return;
      }

      if (rows > last) {
        // Growth: apply immediately and cancel any pending shrink
        if (shrinkTimerRef.current) {
          clearTimeout(shrinkTimerRef.current);
          shrinkTimerRef.current = null;
          pendingShrinkRowsRef.current = null;
        }
        commitRows(rows);
        return;
      }

      if (rows === last || rows === last - 1) {
        // Ignore no-op or tiny shrink to avoid oscillation
        return;
      }

      // Larger shrink requested (>= 2 rows). Debounce it to ensure stability.
      if (pendingShrinkRowsRef.current !== rows) {
        pendingShrinkRowsRef.current = rows;
        if (shrinkTimerRef.current) {
          clearTimeout(shrinkTimerRef.current);
        }
        shrinkTimerRef.current = window.setTimeout(() => {
          // Re-verify target after delay
          const verified = computeRows();
          const finalRows = verified;
          const currentLast = lastRowsRef.current ?? finalRows;
          if (finalRows <= currentLast - 2) {
            commitRows(finalRows);
          }
          pendingShrinkRowsRef.current = null;
          if (shrinkTimerRef.current) {
            clearTimeout(shrinkTimerRef.current);
            shrinkTimerRef.current = null;
          }
        }, SHRINK_DELAY_MS);
      }
    };

    const scheduleMeasure = () => {
      if (debounceIdRef.current) {
        clearTimeout(debounceIdRef.current);
      }
      debounceIdRef.current = window.setTimeout(handleMeasure, DEBOUNCE_MS);
    };

    // Initial measure after paint
    const raf = requestAnimationFrame(handleMeasure);

    // Observe content changes
    const ro = new ResizeObserver(() => scheduleMeasure());
    ro.observe(el);

    // Also respond to font/viewport changes
    window.addEventListener('resize', scheduleMeasure);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
      if (debounceIdRef.current) {
        clearTimeout(debounceIdRef.current);
        debounceIdRef.current = null;
      }
      if (shrinkTimerRef.current) {
        clearTimeout(shrinkTimerRef.current);
        shrinkTimerRef.current = null;
      }
      pendingShrinkRowsRef.current = null;
    };
    // Important: depend on layouts length but not the entire object to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetId, containerRef, layouts.length, opts.enabled, opts.minRows, opts.maxRows]);
}
