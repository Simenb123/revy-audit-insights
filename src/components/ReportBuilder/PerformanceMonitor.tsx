import React from 'react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, HardDrive, Zap } from 'lucide-react';

interface PerformanceMonitorProps {
  componentName?: string;
  showWarnings?: boolean;
  className?: string;
}

export function PerformanceMonitor({ 
  componentName = 'ReportBuilder', 
  showWarnings = true,
  className 
}: PerformanceMonitorProps) {
  const { metrics, isLoading, warnings } = usePerformanceMonitor(componentName);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Performance Metrics */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="text-xs">
          <Clock className="w-3 h-3 mr-1" />
          Load: {metrics.loadTime.toFixed(0)}ms
        </Badge>
        
        <Badge variant="outline" className="text-xs">
          <Zap className="w-3 h-3 mr-1" />
          Render: {metrics.renderTime.toFixed(0)}ms
        </Badge>
        
        {metrics.memoryUsage && (
          <Badge variant="outline" className="text-xs">
            <HardDrive className="w-3 h-3 mr-1" />
            Memory: {metrics.memoryUsage.toFixed(1)}MB
          </Badge>
        )}
        
        {metrics.navigationTime && (
          <Badge variant="outline" className="text-xs">
            <Activity className="w-3 h-3 mr-1" />
            DOM: {metrics.navigationTime.toFixed(0)}ms
          </Badge>
        )}
      </div>

      {/* Performance Warnings */}
      {showWarnings && warnings.length > 0 && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-xs">
            <strong>Performance Issues:</strong>
            <ul className="list-disc list-inside mt-1">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}