import { useEffect, useState, useRef } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
  navigationTime?: number;
}

interface PerformanceData {
  metrics: PerformanceMetrics;
  isLoading: boolean;
  warnings: string[];
}

export function usePerformanceMonitor(componentName?: string): PerformanceData {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [warnings, setWarnings] = useState<string[]>([]);
  const startTime = useRef(performance.now());
  const renderStartTime = useRef(performance.now());

  useEffect(() => {
    const measurePerformance = () => {
      try {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const loadTime = navigation ? navigation.loadEventEnd - navigation.fetchStart : 0;
        const renderTime = performance.now() - renderStartTime.current;
        
        // Memory usage (if supported)
        const memory = (performance as any).memory;
        const memoryUsage = memory ? memory.usedJSHeapSize / 1024 / 1024 : undefined;
        
        const newMetrics: PerformanceMetrics = {
          loadTime,
          renderTime,
          memoryUsage,
          navigationTime: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : undefined
        };

        setMetrics(newMetrics);

        // Performance warnings
        const newWarnings: string[] = [];
        if (renderTime > 100) {
          newWarnings.push(`Slow render detected: ${renderTime.toFixed(2)}ms`);
        }
        if (loadTime > 3000) {
          newWarnings.push(`Slow page load: ${(loadTime / 1000).toFixed(2)}s`);
        }
        if (memoryUsage && memoryUsage > 100) {
          newWarnings.push(`High memory usage: ${memoryUsage.toFixed(2)}MB`);
        }

        setWarnings(newWarnings);
        setIsLoading(false);

        // Log performance data in development
        if (process.env.NODE_ENV === 'development' && componentName) {
          console.log(`[Performance] ${componentName}:`, newMetrics);
          if (newWarnings.length > 0) {
            console.warn(`[Performance Warnings] ${componentName}:`, newWarnings);
          }
        }
      } catch (error) {
        console.error('Performance measurement error:', error);
        setIsLoading(false);
      }
    };

    // Measure after a short delay to ensure component is mounted
    const timer = setTimeout(measurePerformance, 100);

    return () => clearTimeout(timer);
  }, [componentName]);

  return {
    metrics,
    isLoading,
    warnings,
  };
}

// Hook for tracking specific operations
export function useOperationTiming() {
  const timers = useRef<Map<string, number>>(new Map());

  const startTimer = (operationName: string) => {
    timers.current.set(operationName, performance.now());
  };

  const endTimer = (operationName: string): number => {
    const startTime = timers.current.get(operationName);
    if (!startTime) {
      console.warn(`Timer '${operationName}' was not started`);
      return 0;
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    timers.current.delete(operationName);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Operation Timer] ${operationName}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  };

  return { startTimer, endTimer };
}