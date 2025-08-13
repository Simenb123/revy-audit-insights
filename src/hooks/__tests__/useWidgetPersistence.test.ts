import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWidgetPersistence } from '../useWidgetPersistence';
import type { Widget, WidgetLayout } from '@/contexts/WidgetManagerContext';

describe('useWidgetPersistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('separates stored widgets by client and year', () => {
    const widget: Widget = { id: 'w1', type: 'kpi', title: 'Test' };
    const layout: WidgetLayout = { i: 'l1', x: 0, y: 0, w: 1, h: 1, widgetId: 'w1' };

    const { result: first } = renderHook(() =>
      useWidgetPersistence('client-a', 2023)
    );

    act(() => first.current.save([widget], [layout]));

    const { result: second } = renderHook(() =>
      useWidgetPersistence('client-b', 2023)
    );
    expect(second.current.load()).toBeNull();

    const { result: third } = renderHook(() =>
      useWidgetPersistence('client-a', 2024)
    );
    expect(third.current.load()).toBeNull();

    expect(first.current.load()).toEqual({ widgets: [widget], layouts: [layout] });
  });
});

