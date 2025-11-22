import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePerformanceMonitor, useOperationTiming } from '../usePerformanceMonitor';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => 1000),
  getEntriesByType: vi.fn(() => [
    {
      loadEventEnd: 2000,
      fetchStart: 1000,
      domContentLoadedEventEnd: 1500
    }
  ]),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024 // 50MB
  }
};

global.performance = mockPerformance as any;

describe('usePerformanceMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformance.now.mockReturnValue(1000);
  });

  it('måler initial render time', async () => {
    const { result } = renderHook(() => usePerformanceMonitor('TestComponent'));
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.metrics.renderTime).toBeGreaterThanOrEqual(0);
  });

  it('måler memory usage', async () => {
    const { result } = renderHook(() => usePerformanceMonitor('TestComponent'));
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.metrics.memoryUsage).toBeDefined();
    expect(result.current.metrics.memoryUsage).toBeGreaterThan(0);
  });

  it('viser warning ved slow render (>100ms)', async () => {
    // Mock slow render
    let callCount = 0;
    mockPerformance.now.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? 1000 : 1150; // 150ms render time
    });

    const { result } = renderHook(() => usePerformanceMonitor('SlowComponent'));
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.warnings.length).toBeGreaterThan(0);
    expect(result.current.warnings[0]).toContain('Slow render');
  });

  it('viser warning ved høy memory usage (>100MB)', async () => {
    // Mock high memory usage
    mockPerformance.memory = {
      usedJSHeapSize: 150 * 1024 * 1024 // 150MB
    };

    const { result } = renderHook(() => usePerformanceMonitor('MemoryHeavyComponent'));
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.warnings.some(w => w.includes('memory'))).toBe(true);
  });
});

describe('useOperationTiming', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('måler operation duration', () => {
    const { result } = renderHook(() => useOperationTiming());
    
    mockPerformance.now.mockReturnValue(1000);
    result.current.startTimer('testOperation');
    
    mockPerformance.now.mockReturnValue(1050);
    const duration = result.current.endTimer('testOperation');
    
    expect(duration).toBe(50);
  });

  it('returnerer 0 for ukjent timer', () => {
    const { result } = renderHook(() => useOperationTiming());
    
    const duration = result.current.endTimer('unknownOperation');
    
    expect(duration).toBe(0);
  });

  it('sletter timer etter endTimer', () => {
    const { result } = renderHook(() => useOperationTiming());
    
    result.current.startTimer('testOperation');
    result.current.endTimer('testOperation');
    
    // Calling endTimer again should return 0
    const duration = result.current.endTimer('testOperation');
    expect(duration).toBe(0);
  });
});
