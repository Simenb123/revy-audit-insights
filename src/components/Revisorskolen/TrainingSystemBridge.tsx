import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link2, Brain, Users, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EmbeddedContextChat from '@/components/Revy/EmbeddedContextChat';
import { Client } from '@/types/revio';

interface TrainingSystemBridgeProps {
  selectedClientId?: string;
  onClientChange?: (clientId: string) => void;
}

const TrainingSystemBridge: React.FC<TrainingSystemBridgeProps> = ({
  selectedClientId,
  onClientChange
}) => {
  const { toast } = useToast();
  const [activeClient, setActiveClient] = useState<Client | null>(null);

  // Reuse existing clients query
  const { data: clients } = useQuery({
    queryKey: ['clients-bridge'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          name,
          industry
        `)
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  // Get AI Revy usage for training context
  const { data: aiUsage } = useQuery({
    queryKey: ['ai-usage-training-context', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return null;

      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select(`
          id,
          context_type,
          request_type,
          total_tokens,
          created_at
        `)
        .eq('client_id', selectedClientId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!selectedClientId
  });

  // Get training progress for selected client
  const { data: trainingProgress } = useQuery({
    queryKey: ['training-progress-bridge', selectedClientId],
    queryFn: async (): Promise<any[]> => {
      if (!selectedClientId) return [];

      try {
        const { data, error } = await (supabase as any)
          .from('training_runs')
          .select('id, status, total_score, current_budget, created_at, scenario_id')
          .eq('client_id', selectedClientId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching training progress:', error);
        return [];
      }
    },
    enabled: !!selectedClientId
  });

  // Get action insights for client
  const { data: actionInsights } = useQuery({
    queryKey: ['action-insights-bridge', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return null;

      const { data, error } = await supabase
        .from('audit_action_templates')
        .select(`
          id,
          name,
          subject_area,
          estimated_hours
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!selectedClientId
  });

  const handleClientSelect = (clientId: string) => {
    const client = clients?.find(c => c.id === clientId);
    if (client) {
      setActiveClient({
        ...client,
        user_id: '', // Will be set by context
        risk_level: 'medium', // Default value
        company_name: client.name // Use name as company_name
      } as Client);
      onClientChange?.(clientId);
    }
  };

  const generateTrainingContext = () => {
    if (!selectedClientId || !trainingProgress || !actionInsights) return '';

    const context = `
Klient: ${activeClient?.name}
Bransje: ${activeClient?.industry}
Risikoprofil: ${(activeClient as any)?.risk_level || 'medium'}

Treningsresultater:
${trainingProgress?.map(tp => `- Scenario #${tp.scenario_id}: ${tp.total_score || 0}% (${tp.status})`).join('\n') || 'Ingen data'}

Tilgjengelige revisjonshandlinger:
${actionInsights?.map(ai => `- ${ai.name}: ${ai.estimated_hours}t`).join('\n') || 'Ingen data'}

Relevant for videre opplæring og kvalitetsforbedring.
    `.trim();

    return context;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'active': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            System-integrering
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Velg klient</label>
              <Select value={selectedClientId} onValueChange={handleClientSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg en klient for integrering" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} ({client.industry})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedClientId && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Oversikt</TabsTrigger>
                  <TabsTrigger value="training">Trening</TabsTrigger>
                  <TabsTrigger value="ai-integration">AI-integrering</TabsTrigger>
                  <TabsTrigger value="insights">Innsikt</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">Klientinformasjon</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div>Navn: {activeClient?.name}</div>
                          <div>Bransje: {activeClient?.industry}</div>
                          <div>Risiko: {(activeClient as any)?.risk_level || 'medium'}</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4" />
                          <span className="font-medium">Treningsstatistikk</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div>Kjørte: {trainingProgress?.length || 0}</div>
                          <div>Gjennomsnitt: {
                            trainingProgress?.length ? 
                            Math.round(trainingProgress.reduce((acc, tp) => acc + (tp.total_score || 0), 0) / trainingProgress.length) + '%' : 
                            'N/A'
                          }</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="h-4 w-4" />
                          <span className="font-medium">AI-bruk</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div>Forespørsler: {aiUsage?.length || 0}</div>
                          <div>Tokens: {aiUsage?.reduce((acc, ai) => acc + ai.total_tokens, 0) || 0}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="training" className="mt-4">
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {trainingProgress?.map((training) => (
                        <Card key={training.id} className="border-border/50">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <h4 className="font-medium">
                                  Scenario #{training.scenario_id}
                                </h4>
                                <div className="text-sm text-muted-foreground">
                                  Score: {training.total_score || 0}% • Budsjett: {training.current_budget}
                                </div>
                              </div>
                              <Badge className={getStatusColor(training.status)}>
                                {training.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="ai-integration" className="mt-4">
                  {activeClient && (
                    <div className="h-[400px]">
                      <EmbeddedContextChat
                        client={activeClient}
                        context={generateTrainingContext()}
                        title="Trening & AI Assistanse"
                        height="400px"
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="insights" className="mt-4">
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {actionInsights?.map((insight) => (
                        <Card key={insight.id} className="border-border/50">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <h4 className="font-medium">
                                  {insight.name}
                                </h4>
                                <div className="text-sm text-muted-foreground">
                                  {insight.subject_area}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">
                                  {insight.estimated_hours}t
                                </div>
                                <Badge variant="secondary">
                                  Aktiv
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainingSystemBridge;