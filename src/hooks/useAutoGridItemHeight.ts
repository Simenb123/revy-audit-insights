import { useCallback, useEffect, useRef } from 'react';
import { useWidgetManager } from '@/contexts/WidgetManagerContext';
import { GRID_ROW_HEIGHT, GRID_DEFAULT_MAX_ROWS } from '@/components/ReportBuilder/gridConfig';
import { GRID_MARGIN } from '@/components/ReportBuilder/gridConfig';

/**
 * Automatically adjusts a react-grid-layout item's height (h) to fit its content.
 * Pass a ref to the element that contains the widget content.
 *
 * Improvements:
 * - Measures the first non-absolute/fixed child to avoid counting overlays
 * - Uses rowHeight + vertical margin for accurate row math
 * - Debounced shrink, immediate growth
 * - Exposes fitToContent API and allows ignoring maxRows when explicitly requested
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

  const effectiveRow = GRID_ROW_HEIGHT + (Array.isArray(GRID_MARGIN) ? GRID_MARGIN[1] : 0);

  // Find the best element to measure inside the container
  const getContentElement = () => {
    const el = containerRef.current;
    if (!el) return null;
    // Prefer a direct child that isn't absolutely/fixed positioned
    const children = Array.from(el.children) as HTMLElement[];
    for (const child of children) {
      const style = window.getComputedStyle(child);
      if (style.display === 'none') continue;
      if (style.position === 'absolute' || style.position === 'fixed') continue;
      return child;
    }
    return el; // fallback to the container itself
  };

  const getContentHeight = () => {
    const target = getContentElement();
    if (!target) return 0;
    // scrollHeight handles overflowed content; offsetHeight is a fallback
    const h = Math.max(target.scrollHeight, target.offsetHeight, 0);
    return h;
  };

  const rowsFromHeight = (height: number, ignoreMax?: boolean) => {
    const minRows = Math.max(1, opts.minRows ?? 1);
    const rawRows = Math.ceil((height + (effectiveRow - GRID_ROW_HEIGHT)) / effectiveRow);
    const requiredRows = Math.max(minRows, rawRows);
    if (!ignoreMax && typeof opts.maxRows === 'number') {
      return Math.min(requiredRows, opts.maxRows);
    }
    return requiredRows;
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

  // Public API to force-fit the content height
  const fitToContent = useCallback((opts2?: { ignoreMaxRows?: boolean }) => {
    const height = getContentHeight();
    const rows = rowsFromHeight(height, Boolean(opts2?.ignoreMaxRows));
    commitRows(rows);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layouts, widgetId]);

  useEffect(() => {
    if (!opts.enabled) return;
    const el = containerRef.current;
    if (!el) return;

    const DEBOUNCE_MS = 120;
    const SHRINK_DELAY_MS = 400;

    const computeRows = () => {
      const contentHeight = getContentHeight();
      return rowsFromHeight(contentHeight);
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
    // Depend on stable primitives to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetId, containerRef, layouts.length, opts.enabled, opts.minRows, opts.maxRows]);

  return { fitToContent };
}

