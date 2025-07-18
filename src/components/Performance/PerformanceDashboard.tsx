import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { AlertTriangle, Zap, Clock, MemoryStick } from 'lucide-react';

export function PerformanceDashboard() {
  const { metrics, isLoading, warnings } = usePerformanceMonitor('PerformanceDashboard');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Loading metrics...</span>
              <Progress value={50} className="w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPerformanceScore = () => {
    let score = 100;
    if (metrics.renderTime > 100) score -= 20;
    if (metrics.loadTime > 3000) score -= 30;
    if (metrics.memoryUsage && metrics.memoryUsage > 100) score -= 25;
    return Math.max(0, score);
  };

  const score = getPerformanceScore();
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Overall Score */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {score}/100
          </div>
          <Progress value={score} className="mt-2" />
        </CardContent>
      </Card>

      {/* Load Time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Load Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.loadTime ? `${(metrics.loadTime / 1000).toFixed(2)}s` : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.loadTime > 3000 ? 'Needs improvement' : 'Good'}
          </p>
        </CardContent>
      </Card>

      {/* Render Time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Render Time</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.renderTime.toFixed(2)}ms
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.renderTime > 100 ? 'Slow' : 'Fast'}
          </p>
        </CardContent>
      </Card>

      {/* Memory Usage */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
          <MemoryStick className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.memoryUsage ? `${metrics.memoryUsage.toFixed(1)}MB` : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.memoryUsage && metrics.memoryUsage > 100 ? 'High' : 'Normal'}
          </p>
        </CardContent>
      </Card>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              Performance Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {warnings.map((warning, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="outline" className="text-yellow-600">
                    Warning
                  </Badge>
                  <span className="text-sm">{warning}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}