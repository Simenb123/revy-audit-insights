import React from 'react';
import { Label } from '@/components/ui/label';

interface AutoMetricsViewerProps {
  metrics: any;
}

const AutoMetricsViewer: React.FC<AutoMetricsViewerProps> = ({ metrics }) => {
  return (
    <div className="space-y-2">
      <Label>Auto-metrics (lesevisning)</Label>
      <pre className="bg-muted rounded-md p-3 text-xs overflow-auto max-h-48">
        {JSON.stringify(metrics, null, 2)}
      </pre>
    </div>
  );
};

export default AutoMetricsViewer;
