import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Brain,
  AlertTriangle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const KPIWidgets = () => {
  // Fetch KPI data
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [clientsResult, actionsResult, documentsResult, aiUsageResult] = await Promise.all([
        supabase.from('clients').select('id, phase').eq('user_id', (await supabase.auth.getUser()).data.user?.id),
        supabase.from('client_audit_actions').select('id, status').limit(1000),
        supabase.from('client_documents_files').select('id').limit(1000),
        supabase.from('ai_usage_logs').select('id, estimated_cost_usd').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      const clients = clientsResult.data || [];
      const actions = actionsResult.data || [];
      const documents = documentsResult.data || [];
      const aiUsage = aiUsageResult.data || [];

      return {
        totalClients: clients.length,
        activeClients: clients.filter(c => c.phase === 'execution').length,
        completedActions: actions.filter(a => a.status === 'completed').length,
        pendingActions: actions.filter(a => a.status === 'in_progress' || a.status === 'not_started').length,
        totalDocuments: documents.length,
        aiUsageCount: aiUsage.length,
        aiCostLastMonth: aiUsage.reduce((sum, usage) => sum + (usage.estimated_cost_usd || 0), 0)
      };
    }
  });

  const kpis = [
    {
      title: 'Aktive klienter',
      value: stats?.activeClients || 0,
      total: stats?.totalClients || 0,
      description: 'Klienter i utføring',
      icon: Users,
      trend: '+12%',
      trendDirection: 'up' as const
    },
    {
      title: 'Fullførte handlinger',
      value: stats?.completedActions || 0,
      total: (stats?.completedActions || 0) + (stats?.pendingActions || 0),
      description: 'Denne måneden',
      icon: CheckCircle,
      trend: '+8%',
      trendDirection: 'up' as const
    },
    {
      title: 'Ventende oppgaver',
      value: stats?.pendingActions || 0,
      description: 'Krever oppmerksomhet',
      icon: Clock,
      trend: '-5%',
      trendDirection: 'down' as const,
      variant: stats?.pendingActions && stats.pendingActions > 10 ? 'warning' : 'default'
    },
    {
      title: 'Dokumenter',
      value: stats?.totalDocuments || 0,
      description: 'Totalt lastet opp',
      icon: FileText,
      trend: '+15%',
      trendDirection: 'up' as const
    },
    {
      title: 'AI-bruk',
      value: stats?.aiUsageCount || 0,
      description: 'Siste 30 dager',
      icon: Brain,
      trend: `$${(stats?.aiCostLastMonth || 0).toFixed(2)}`,
      trendDirection: 'neutral' as const
    }
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 w-4 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded animate-pulse mb-2" />
              <div className="h-3 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {kpis.map((kpi, index) => (
        <Card key={index} className={kpi.variant === 'warning' ? 'border-orange-200' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {kpi.title}
            </CardTitle>
            <kpi.icon className={`h-4 w-4 ${kpi.variant === 'warning' ? 'text-orange-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpi.value}
              {kpi.total && (
                <span className="text-sm text-muted-foreground ml-1">
                  / {kpi.total}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                {kpi.description}
              </p>
              <Badge 
                variant={
                  kpi.trendDirection === 'up' ? 'default' : 
                  kpi.trendDirection === 'down' ? 'secondary' : 
                  'outline'
                }
                className="text-xs"
              >
                {kpi.trendDirection === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                {kpi.trendDirection === 'down' && <TrendingUp className="h-3 w-3 mr-1 rotate-180" />}
                {kpi.trend}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default KPIWidgets;