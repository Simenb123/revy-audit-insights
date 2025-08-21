import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Server, 
  Users, 
  Database, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface MetricData {
  name: string;
  value: number;
  timestamp: string;
}

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  threshold: number;
}

const PerformanceMonitor = () => {
  const [realTimeData, setRealTimeData] = useState<MetricData[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // System metrics
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([
    {
      id: 'cpu',
      name: 'CPU Bruk',
      value: 45,
      unit: '%',
      status: 'good',
      trend: 'stable',
      threshold: 80
    },
    {
      id: 'memory',
      name: 'Minnebruk',
      value: 62,
      unit: '%',
      status: 'good',
      trend: 'up',
      threshold: 85
    },
    {
      id: 'disk',
      name: 'Disk I/O',
      value: 23,
      unit: 'MB/s',
      status: 'good',
      trend: 'down',
      threshold: 100
    },
    {
      id: 'network',
      name: 'Nettverkstrafikk',
      value: 156,
      unit: 'Mbps',
      status: 'warning',
      trend: 'up',
      threshold: 200
    }
  ]);

  // Mock response time data
  const responseTimeData = [
    { time: '00:00', value: 120 },
    { time: '04:00', value: 98 },
    { time: '08:00', value: 180 },
    { time: '12:00', value: 220 },
    { time: '16:00', value: 195 },
    { time: '20:00', value: 165 },
    { time: '24:00', value: 135 }
  ];

  // Mock user activity data
  const userActivityData = [
    { time: '00:00', active: 25, total: 120 },
    { time: '04:00', active: 15, total: 110 },
    { time: '08:00', active: 85, total: 180 },
    { time: '12:00', active: 145, total: 220 },
    { time: '16:00', active: 125, total: 195 },
    { time: '20:00', active: 95, total: 165 },
    { time: '24:00', active: 65, total: 135 }
  ];

  // Simulate real-time monitoring
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isMonitoring) {
      interval = setInterval(() => {
        const now = new Date();
        const newDataPoint: MetricData = {
          name: 'Response Time',
          value: Math.random() * 300 + 100,
          timestamp: now.toLocaleTimeString()
        };
        
        setRealTimeData(prev => [...prev.slice(-19), newDataPoint]);
        
        // Update system metrics
        setSystemMetrics(prev => prev.map(metric => ({
          ...metric,
          value: Math.max(0, metric.value + (Math.random() - 0.5) * 10),
          status: metric.value > metric.threshold ? 'critical' : 
                  metric.value > metric.threshold * 0.8 ? 'warning' : 'good'
        })));
      }, 2000);
    }
    
    return () => clearInterval(interval);
  }, [isMonitoring]);

  const getStatusIcon = (status: SystemMetric['status']) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getTrendIcon = (trend: SystemMetric['trend']) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-green-500" />;
      case 'stable': return <div className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: SystemMetric['status']) => {
    switch (status) {
      case 'good': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Performance Monitor</h2>
        </div>
        <Button
          onClick={() => setIsMonitoring(!isMonitoring)}
          variant={isMonitoring ? "destructive" : "default"}
        >
          {isMonitoring ? 'Stopp Overvåking' : 'Start Overvåking'}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Oversikt</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="users">Brukere</TabsTrigger>
          <TabsTrigger value="realtime">Sanntid</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="flex items-center p-6">
                <Server className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">System Status</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <p className="text-2xl font-bold">Online</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <Clock className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Oppetid</p>
                  <p className="text-2xl font-bold">99.8%</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <Users className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Aktive Brukere</p>
                  <p className="text-2xl font-bold">247</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <Database className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Responstid</p>
                  <p className="text-2xl font-bold">156ms</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Responstid Siste 24t</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Brukeraktivitet</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={userActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="total" stackId="1" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="active" stackId="1" stroke="#10b981" fill="#10b981" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system">
          <div className="grid gap-4">
            {systemMetrics.map((metric) => (
              <Card key={metric.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(metric.status)}
                    <div>
                      <h3 className="font-semibold">{metric.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold">
                          {metric.value.toFixed(1)}{metric.unit}
                        </span>
                        {getTrendIcon(metric.trend)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={metric.status === 'good' ? 'success' : 
                                  metric.status === 'warning' ? 'warning' : 'destructive'}>
                      {metric.status}
                    </Badge>
                    <div className="mt-2 w-32">
                      <Progress 
                        value={(metric.value / metric.threshold) * 100} 
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Grense: {metric.threshold}{metric.unit}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="text-center p-6">
                <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="text-2xl font-bold">1,247</p>
                <p className="text-sm text-muted-foreground">Totale Brukere</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center p-6">
                <Activity className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold">247</p>
                <p className="text-sm text-muted-foreground">Aktive Nå</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center p-6">
                <Clock className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                <p className="text-2xl font-bold">18.5min</p>
                <p className="text-sm text-muted-foreground">Gjennomsnittlig Sesjon</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Brukeraktivitet Over Tid</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={userActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="active" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realtime">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Sanntids Overvåking</CardTitle>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-sm text-muted-foreground">
                  {isMonitoring ? 'Live' : 'Stoppet'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {realTimeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={realTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Start overvåking for å se sanntidsdata</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceMonitor;