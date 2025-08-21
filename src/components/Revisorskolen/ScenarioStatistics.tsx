import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import StandardDataTable, { StandardDataTableColumn } from '@/components/ui/standard-data-table';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Award,
  Target,
  FileText,
  BarChart3,
  Activity
} from 'lucide-react';

interface ScenarioStats {
  id: string;
  title: string;
  completions: number;
  averageScore: number;
  averageTime: number;
  successRate: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

interface UserPerformance {
  user_id: string;
  user_name: string;
  total_scenarios: number;
  average_score: number;
  total_time: number;
  completion_rate: number;
  badges_earned: number;
  last_activity: string;
}

export const ScenarioStatistics: React.FC = () => {
  // Gjennbruk av useQuery pattern fra eksisterende komponenter
  const { data: scenarioStats = [], isLoading: isLoadingStats } = useQuery({
    queryKey: ['scenario-statistics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_sessions')
        .select(`
          id,
          title,
          training_run_states (
            id,
            training_runs (
              id,
              status
            )
          )
        `);

      if (error) throw error;

      // Prosesser data til statistikk - gjennbruk av data processing pattern
      return data?.map(session => ({
        id: session.id,
        title: session.title,
        completions: session.training_run_states?.length || 0,
        averageScore: 75 + Math.random() * 20, // Mock data since columns don't exist yet
        averageTime: 45 + Math.random() * 30,
        successRate: 0.6 + Math.random() * 0.4,
        difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as any,
        category: 'Revisjonstesting'
      })) || [];
    }
  });

  const { data: userPerformance = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['user-performance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_runs')
        .select(`
          user_id,
          status
        `);

      if (error) throw error;

      // Mock data since profiles relation doesn't exist yet
      const mockUsers = [
        { user_name: 'Ola Nordmann', total_scenarios: 8, average_score: 85, completion_rate: 0.8, badges_earned: 3 },
        { user_name: 'Kari Hansen', total_scenarios: 12, average_score: 92, completion_rate: 0.9, badges_earned: 5 },
        { user_name: 'Per Jensen', total_scenarios: 6, average_score: 78, completion_rate: 0.7, badges_earned: 2 }
      ];

      return mockUsers.map(user => ({
        ...user,
        user_id: Math.random().toString(),
        total_time: Math.floor(Math.random() * 120) + 30,
        last_activity: new Date().toISOString()
      }));
    }
  });

  // Gjennbruk av StandardDataTable column pattern
  const scenarioColumns: StandardDataTableColumn<ScenarioStats>[] = [
    {
      key: 'title',
      header: 'Scenario',
      accessor: 'title',
      sortable: true,
      searchable: true
    },
    {
      key: 'completions',
      header: 'Gjennomføringer',
      accessor: 'completions',
      sortable: true,
      align: 'center'
    },
    {
      key: 'averageScore',
      header: 'Gj.snitt Score',
      accessor: 'averageScore',
      sortable: true,
      align: 'right',
      format: (value) => `${Math.round(value)}%`
    },
    {
      key: 'averageTime',
      header: 'Gj.snitt Tid',
      accessor: 'averageTime',
      sortable: true,
      align: 'right',
      format: (value) => `${Math.round(value)} min`
    },
    {
      key: 'successRate',
      header: 'Suksessrate',
      accessor: 'successRate',
      sortable: true,
      align: 'right',
      format: (value) => `${Math.round(value * 100)}%`
    },
    {
      key: 'difficulty',
      header: 'Vanskelighetsgrad',
      accessor: 'difficulty',
      sortable: true,
      format: (value) => (
        <Badge variant={value === 'easy' ? 'default' : value === 'medium' ? 'secondary' : 'destructive'}>
          {value === 'easy' ? 'Lett' : value === 'medium' ? 'Middels' : 'Vanskelig'}
        </Badge>
      )
    }
  ];

  const userColumns: StandardDataTableColumn<UserPerformance>[] = [
    {
      key: 'user_name',
      header: 'Bruker',
      accessor: 'user_name',
      sortable: true,
      searchable: true
    },
    {
      key: 'total_scenarios',
      header: 'Scenarioer',
      accessor: 'total_scenarios',
      sortable: true,
      align: 'center'
    },
    {
      key: 'average_score',
      header: 'Gj.snitt Score',
      accessor: 'average_score',
      sortable: true,
      align: 'right',
      format: (value) => `${Math.round(value)}%`
    },
    {
      key: 'completion_rate',
      header: 'Fullføringsrate',
      accessor: 'completion_rate',
      sortable: true,
      align: 'right',
      format: (value) => `${Math.round(value * 100)}%`
    },
    {
      key: 'badges_earned',
      header: 'Merker',
      accessor: 'badges_earned',
      sortable: true,
      align: 'center',
      format: (value) => (
        <Badge variant="outline" className="flex items-center gap-1">
          <Award className="w-3 h-3" />
          {value}
        </Badge>
      )
    },
    {
      key: 'last_activity',
      header: 'Sist aktiv',
      accessor: 'last_activity',
      sortable: true,
      format: (value) => formatDate(value)
    }
  ];

  // Gjennbruk av chart data pattern fra eksisterende komponenter
  const chartData = scenarioStats.map(scenario => ({
    name: scenario.title.length > 20 ? scenario.title.substring(0, 20) + '...' : scenario.title,
    score: scenario.averageScore,
    completions: scenario.completions,
    time: scenario.averageTime
  }));

  const difficultyData = [
    { name: 'Lett', value: scenarioStats.filter(s => s.difficulty === 'easy').length, color: '#10B981' },
    { name: 'Middels', value: scenarioStats.filter(s => s.difficulty === 'medium').length, color: '#F59E0B' },
    { name: 'Vanskelig', value: scenarioStats.filter(s => s.difficulty === 'hard').length, color: '#EF4444' }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards - gjennbruk av pattern fra Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Scenarioer</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scenarioStats.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 fra forrige måned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Gjennomføringer</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scenarioStats.reduce((acc, s) => acc + s.completions, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% fra forrige måned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gjennomsnittsscore</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(scenarioStats.reduce((acc, s) => acc + s.averageScore, 0) / scenarioStats.length || 0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              +3% fra forrige måned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Brukere</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userPerformance.length}</div>
            <p className="text-xs text-muted-foreground">
              +5 fra forrige måned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views - gjennbruk av pattern */}
      <Tabs defaultValue="scenarios" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scenarios">Scenariostatistikk</TabsTrigger>
          <TabsTrigger value="users">Brukerytelse</TabsTrigger>
          <TabsTrigger value="analytics">Analyser</TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart gjennbruk fra eksisterende komponenter */}
            <Card>
              <CardHeader>
                <CardTitle>Scenarioytelse</CardTitle>
                <CardDescription>Gjennomsnittsscore vs gjennomføringer</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="score" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vanskelighetsfordeling</CardTitle>
                <CardDescription>Fordeling av scenarioer etter vanskelighetsgrad</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={difficultyData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {difficultyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* StandardDataTable gjennbruk */}
          <Card>
            <CardHeader>
              <CardTitle>Detaljert Scenariostatistikk</CardTitle>
              <CardDescription>Fullstendig oversikt over alle scenarioer</CardDescription>
            </CardHeader>
            <CardContent>
              <StandardDataTable
                title="Scenarioer"
                data={scenarioStats}
                columns={scenarioColumns}
                isLoading={isLoadingStats}
                tableName="scenario-stats"
                exportFileName="scenario-statistikk"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Brukerytelse</CardTitle>
              <CardDescription>Oversikt over alle brukeres prestasjoner</CardDescription>
            </CardHeader>
            <CardContent>
              <StandardDataTable
                title="Brukere"
                data={userPerformance}
                columns={userColumns}
                isLoading={isLoadingUsers}
                tableName="user-performance"
                exportFileName="bruker-ytelse"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Trendanalyse</CardTitle>
                <CardDescription>Utviklingen over tid</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tidsfordeling</CardTitle>
                <CardDescription>Gjennomsnittlig tid per scenario</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="time" fill="hsl(var(--secondary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScenarioStatistics;