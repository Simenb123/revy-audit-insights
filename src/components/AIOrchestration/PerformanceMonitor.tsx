import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Cpu, Database, Zap, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

interface ComponentHealth {
  component: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  errorRate: number;
  lastCheck: Date;
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([
    { id: 'response-time', name: 'Gj.snitt Responstid', value: 245, unit: 'ms', status: 'good', trend: 'stable' },
    { id: 'throughput', name: 'AI-oppgaver/min', value: 12, unit: 'ops', status: 'good', trend: 'up' },
    { id: 'error-rate', name: 'Feilrate', value: 2.1, unit: '%', status: 'warning', trend: 'down' },
    { id: 'memory-usage', name: 'Minnebruk', value: 67, unit: '%', status: 'good', trend: 'stable' }
  ]);

  const [componentHealth, setComponentHealth] = useState<ComponentHealth[]>([
    { component: 'Document AI', status: 'healthy', responseTime: 189, errorRate: 1.2, lastCheck: new Date() },
    { component: 'Predictive Analytics', status: 'healthy', responseTime: 312, errorRate: 0.8, lastCheck: new Date() },
    { component: 'Benchmarking', status: 'degraded', responseTime: 567, errorRate: 3.4, lastCheck: new Date() },
    { component: 'Semantic Search', status: 'healthy', responseTime: 123, errorRate: 0.3, lastCheck: new Date() }
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshMetrics = async () => {
    setIsRefreshing(true);
    // Simulate API call to get real metrics
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update with simulated new values
    setMetrics(prev => prev.map(metric => ({
      ...metric,
      value: metric.value + (Math.random() - 0.5) * 10,
      trend: Math.random() > 0.5 ? 'up' : 'down'
    })));

    setComponentHealth(prev => prev.map(comp => ({
      ...comp,
      responseTime: comp.responseTime + (Math.random() - 0.5) * 50,
      errorRate: Math.max(0, comp.errorRate + (Math.random() - 0.5) * 1),
      lastCheck: new Date()
    })));

    setIsRefreshing(false);
  };

  useEffect(() => {
    const interval = setInterval(refreshMetrics, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
      case 'healthy': return 'text-green-600';
      case 'warning':
      case 'degraded': return 'text-yellow-600';
      case 'critical':
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'down': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  const overallHealth = componentHealth.every(c => c.status === 'healthy') ? 'healthy' :
                       componentHealth.some(c => c.status === 'down') ? 'critical' : 'degraded';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">AI-Ytelse Monitor</h2>
            <p className="text-muted-foreground">Sanntidsovervåking av AI-komponentenes ytelse</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={overallHealth === 'healthy' ? 'success' : overallHealth === 'critical' ? 'destructive' : 'secondary'}>
            {overallHealth === 'healthy' ? 'Alle systemer OK' : 
             overallHealth === 'critical' ? 'Kritiske problemer' : 'Redusert ytelse'}
          </Badge>
          <Button onClick={refreshMetrics} disabled={isRefreshing} variant="outline" size="sm">
            {isRefreshing ? 'Oppdaterer...' : 'Oppdater'}
          </Button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                <span className="text-lg">{getTrendIcon(metric.trend)}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>
                    {metric.value.toFixed(metric.id === 'error-rate' ? 1 : 0)}
                  </span>
                  <span className="text-sm text-muted-foreground">{metric.unit}</span>
                </div>
                <Progress 
                  value={metric.id === 'error-rate' ? 100 - metric.value : 
                         metric.id === 'memory-usage' ? metric.value : 
                         Math.min(100, (metric.value / (metric.id === 'response-time' ? 500 : 20)) * 100)} 
                  className="h-2" 
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Component Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Komponenthelse
          </CardTitle>
          <CardDescription>Status og ytelse for hver AI-komponent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {componentHealth.map((component) => (
              <div key={component.component} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(component.status)}
                  <div>
                    <div className="font-medium">{component.component}</div>
                    <div className="text-sm text-muted-foreground">
                      Sist sjekket: {component.lastCheck.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-medium">{component.responseTime}ms</div>
                    <div className="text-muted-foreground">Responstid</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{component.errorRate.toFixed(1)}%</div>
                    <div className="text-muted-foreground">Feilrate</div>
                  </div>
                  <Badge variant={
                    component.status === 'healthy' ? 'success' :
                    component.status === 'degraded' ? 'secondary' : 'destructive'
                  }>
                    {component.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Ytelse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Tilkoblinger</span>
                <span className="font-medium">23/100</span>
              </div>
              <Progress value={23} />
              <div className="flex justify-between items-center">
                <span>Query-tid (avg)</span>
                <span className="font-medium">45ms</span>
              </div>
              <Progress value={18} />
              <div className="flex justify-between items-center">
                <span>Cache hit rate</span>
                <span className="font-medium">87%</span>
              </div>
              <Progress value={87} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              AI-modeller
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>GPT-4o mini</span>
                <Badge variant="success">Aktiv</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Tokens brukt i dag: 42,341 / 100,000
              </div>
              <Progress value={42.3} />
              <div className="flex justify-between items-center">
                <span>Embedding-modell</span>
                <Badge variant="success">Aktiv</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Embeddings generert: 1,234
              </div>
              <Progress value={65} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};