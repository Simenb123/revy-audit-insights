import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PerformanceDashboard } from '@/components/Performance/PerformanceDashboard';
import { useDataCache } from '@/components/Optimization/DataCache';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PerformanceMonitoring() {
  const cache = useDataCache();
  const cacheStats = cache.getStats();
  const { metrics } = usePerformanceMonitor('PerformanceMonitoring');
  const { toast } = useToast();

  const handleClearCache = () => {
    cache.clear();
    toast({
      title: "Cache cleared",
      description: "All cached data has been removed.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Performance Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor application performance and optimize user experience
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cache">Cache Management</TabsTrigger>
          <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <PerformanceDashboard />
        </TabsContent>

        <TabsContent value="cache" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {cacheStats.size}/{cacheStats.maxSize}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cached entries
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hit Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(cacheStats.hitRate * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Cache effectiveness
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearCache}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Cache
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Load Time</span>
                    <Badge variant="outline">
                      {metrics.loadTime ? `${(metrics.loadTime / 1000).toFixed(2)}s` : 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Render Time</span>
                    <Badge variant="outline">
                      {metrics.renderTime.toFixed(2)}ms
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Memory Usage</span>
                    <Badge variant="outline">
                      {metrics.memoryUsage ? `${metrics.memoryUsage.toFixed(1)}MB` : 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Navigation Time</span>
                    <Badge variant="outline">
                      {metrics.navigationTime ? `${(metrics.navigationTime / 1000).toFixed(2)}s` : 'N/A'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimization Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {metrics.renderTime > 100 && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Slow rendering detected. Consider using virtual scrolling for large lists.
                      </p>
                    </div>
                  )}
                  {metrics.loadTime > 3000 && (
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <p className="text-sm text-orange-800 dark:text-orange-200">
                        Slow page load. Enable data caching and lazy loading.
                      </p>
                    </div>
                  )}
                  {metrics.memoryUsage && metrics.memoryUsage > 100 && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-sm text-red-800 dark:text-red-200">
                        High memory usage. Check for memory leaks and unused references.
                      </p>
                    </div>
                  )}
                  {metrics.renderTime <= 100 && metrics.loadTime <= 3000 && (!metrics.memoryUsage || metrics.memoryUsage <= 100) && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        Performance looks good! Keep monitoring for optimal user experience.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}