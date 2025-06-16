
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Users, MessageSquare, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const UsageAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    dailyUsage: [],
    modelUsage: [],
    contextUsage: [],
    totalCosts: 0,
    totalMessages: 0,
    activeUsers: 0,
    avgResponseTime: 0
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Get usage data from ai_usage_logs table
      const { data: usageData } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (usageData) {
        // Process daily usage
        const dailyUsage = processDailyUsage(usageData);
        
        // Process model usage
        const modelUsage = processModelUsage(usageData);
        
        // Process context usage
        const contextUsage = processContextUsage(usageData);
        
        // Calculate totals
        const totalCosts = usageData.reduce((sum, usage) => sum + (usage.estimated_cost_usd || 0), 0);
        const totalMessages = usageData.length;
        const activeUsers = new Set(usageData.map(u => u.user_id)).size;
        const avgResponseTime = usageData.reduce((sum, usage) => sum + (usage.response_time_ms || 0), 0) / usageData.length;

        setAnalytics({
          dailyUsage,
          modelUsage,
          contextUsage,
          totalCosts,
          totalMessages,
          activeUsers,
          avgResponseTime
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const processDailyUsage = (data: any[]) => {
    const daily = data.reduce((acc, usage) => {
      const date = new Date(usage.created_at).toLocaleDateString('no-NO');
      if (!acc[date]) {
        acc[date] = { date, messages: 0, cost: 0, tokens: 0 };
      }
      acc[date].messages += 1;
      acc[date].cost += usage.estimated_cost_usd || 0;
      acc[date].tokens += usage.total_tokens || 0;
      return acc;
    }, {});

    return Object.values(daily).slice(-14); // Last 14 days
  };

  const processModelUsage = (data: any[]) => {
    const models = data.reduce((acc, usage) => {
      const model = usage.model || 'unknown';
      if (!acc[model]) {
        acc[model] = { name: model, count: 0, cost: 0 };
      }
      acc[model].count += 1;
      acc[model].cost += usage.estimated_cost_usd || 0;
      return acc;
    }, {});

    return Object.values(models);
  };

  const processContextUsage = (data: any[]) => {
    const contexts = data.reduce((acc, usage) => {
      const context = usage.context_type || 'general';
      if (!acc[context]) {
        acc[context] = { name: context, value: 0 };
      }
      acc[context].value += 1;
      return acc;
    }, {});

    return Object.values(contexts);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total meldinger</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalMessages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Siste 30 dager</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive brukere</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Unike brukere</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalkostnad</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalCosts.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">OpenAI kostnader</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Responstid</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(analytics.avgResponseTime)}ms</div>
            <p className="text-xs text-muted-foreground">Gjennomsnitt</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daglig bruk</CardTitle>
            <CardDescription>Meldinger og kostnader siste 14 dager</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.dailyUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="messages" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modell-bruk</CardTitle>
            <CardDescription>Fordeling av AI-modeller</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.modelUsage}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.modelUsage.map((entry, index) => (
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
          <CardTitle>Kontekst-bruk</CardTitle>
          <CardDescription>Hvilke kontekster brukes mest</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.contextUsage} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Detaljert rapport</CardTitle>
              <CardDescription>Last ned full rapport som CSV</CardDescription>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Last ned rapport
            </Button>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};

export default UsageAnalytics;
