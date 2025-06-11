
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAIUsageStats, getFirmAIUsageStats } from '@/services/revyService';
import { useUserProfile } from '@/hooks/useUserProfile';
import { 
  DollarSign, 
  MessageSquare, 
  Clock, 
  TrendingUp,
  Brain,
  Users,
  BarChart3,
  Calendar
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

interface AIUsageStats {
  logs: any[];
  summary: {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    avgResponseTime: number;
    modelUsage: Record<string, number>;
    contextUsage: Record<string, number>;
  };
}

interface FirmUserStats {
  requests: number;
  cost: number;
  role: string;
}

const AIUsageDashboard = () => {
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week');
  const [personalStats, setPersonalStats] = useState<AIUsageStats | null>(null);
  const [firmStats, setFirmStats] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: userProfile } = useUserProfile();

  const isAdmin = userProfile?.userRole === 'admin';

  useEffect(() => {
    loadStats();
  }, [timeframe]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [personal, firm] = await Promise.all([
        getAIUsageStats(timeframe),
        isAdmin ? getFirmAIUsageStats(timeframe) : Promise.resolve(null)
      ]);
      
      setPersonalStats(personal);
      setFirmStats(firm);
    } catch (error) {
      console.error('Error loading AI usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(amount);
  };

  const getChartData = (logs: any[]) => {
    const dailyData = logs.reduce((acc, log) => {
      const date = new Date(log.created_at).toLocaleDateString('no-NO');
      if (!acc[date]) {
        acc[date] = { date, requests: 0, cost: 0, tokens: 0 };
      }
      acc[date].requests += 1;
      acc[date].cost += parseFloat(log.estimated_cost_usd);
      acc[date].tokens += log.total_tokens;
      return acc;
    }, {});

    return Object.values(dailyData).slice(-7); // Last 7 days
  };

  const getPieData = (usage: Record<string, number>) => {
    return Object.entries(usage).map(([key, value]) => ({
      name: key,
      value
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">AI-bruksstatistikk</h1>
        <div className="flex gap-2">
          {(['day', 'week', 'month'] as const).map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe(period)}
            >
              {period === 'day' ? 'Siste dag' : 
               period === 'week' ? 'Siste uke' : 'Siste måned'}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList>
          <TabsTrigger value="personal">Mine statistikker</TabsTrigger>
          {isAdmin && <TabsTrigger value="firm">Firmaoversikt</TabsTrigger>}
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          {personalStats && (
            <>
              {/* Personal Stats Cards */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Totalkostnad</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(personalStats.summary.totalCost)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Siste {timeframe === 'day' ? 'dag' : timeframe === 'week' ? 'uke' : 'måned'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Forespørsler</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{personalStats.summary.totalRequests}</div>
                    <p className="text-xs text-muted-foreground">
                      AI-samtaler
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tokens</CardTitle>
                    <Brain className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {personalStats.summary.totalTokens.toLocaleString('no-NO')}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Totalt forbrukt
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Responstid</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(personalStats.summary.avgResponseTime)}ms
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Gjennomsnitt
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Kostnad over tid</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={getChartData(personalStats.logs)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Kostnad']} />
                        <Line type="monotone" dataKey="cost" stroke="#8884d8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Modellbruk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getPieData(personalStats.summary.modelUsage)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getPieData(personalStats.summary.modelUsage).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Kontekstbruk</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getPieData(personalStats.summary.contextUsage)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="firm" className="space-y-6">
            {firmStats && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Firmastatistikk - Siste {timeframe === 'day' ? 'dag' : timeframe === 'week' ? 'uke' : 'måned'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {formatCurrency(firmStats.reduce((sum, log) => sum + parseFloat(log.estimated_cost_usd), 0))}
                        </div>
                        <p className="text-sm text-muted-foreground">Total kostnad</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{firmStats.length}</div>
                        <p className="text-sm text-muted-foreground">Forespørsler</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {new Set(firmStats.map(log => log.user_id)).size}
                        </div>
                        <p className="text-sm text-muted-foreground">Aktive brukere</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Bruk per bruker</h4>
                      {Object.entries(
                        firmStats.reduce((acc, log) => {
                          const userName = `${log.profiles?.first_name || ''} ${log.profiles?.last_name || ''}`.trim() || 'Ukjent bruker';
                          if (!acc[userName]) {
                            acc[userName] = { requests: 0, cost: 0, role: log.profiles?.user_role || 'unknown' };
                          }
                          acc[userName].requests += 1;
                          acc[userName].cost += parseFloat(log.estimated_cost_usd);
                          return acc;
                        }, {} as Record<string, FirmUserStats>)
                      )
                        .sort(([,a], [,b]) => b.cost - a.cost)
                        .slice(0, 10)
                        .map(([userName, stats]) => (
                          <div key={userName} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div>
                              <span className="font-medium">{userName}</span>
                              <span className="text-sm text-muted-foreground ml-2">({stats.role})</span>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{formatCurrency(stats.cost)}</div>
                              <div className="text-sm text-muted-foreground">{stats.requests} forespørsler</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default AIUsageDashboard;
