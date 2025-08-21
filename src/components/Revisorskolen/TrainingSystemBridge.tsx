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

export const TrainingSystemBridge: React.FC<TrainingSystemBridgeProps> = ({
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
          industry,
          risk_profile,
          business_description
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
    queryFn: async () => {
      if (!selectedClientId) return null;

      const { data, error } = await supabase
        .from('training_runs')
        .select(`
          id,
          status,
          score,
          current_budget,
          created_at,
          training_scenarios (
            title,
            learning_objectives,
            risk_objectives
          )
        `)
        .eq('client_id', selectedClientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedClientId
  });

  // Get action insights for client
  const { data: actionInsights } = useQuery({
    queryKey: ['action-insights-bridge', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return null;

      const { data, error } = await supabase
        .from('audit_actions')
        .select(`
          id,
          status,
          estimated_hours,
          actual_hours,
          action_templates (
            name,
            subject_area
          )
        `)
        .eq('client_id', selectedClientId)
        .eq('status', 'completed')
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
        user_id: '' // Will be set by context
      } as Client);
      onClientChange?.(clientId);
    }
  };

  const generateTrainingContext = () => {
    if (!selectedClientId || !trainingProgress || !actionInsights) return '';

    const context = `
Klient: ${activeClient?.name}
Bransje: ${activeClient?.industry}
Risikoprofil: ${activeClient?.risk_profile}

Treningsresultater:
${trainingProgress.map(tp => `- ${tp.training_scenarios?.title}: ${tp.score}% (${tp.status})`).join('\n')}

Gjennomførte revisjonshandlinger:
${actionInsights.map(ai => `- ${ai.action_templates?.name}: ${ai.actual_hours || ai.estimated_hours}t`).join('\n')}

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
                          <div>Risiko: {activeClient?.risk_profile}</div>
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
                            Math.round(trainingProgress.reduce((acc, tp) => acc + tp.score, 0) / trainingProgress.length) + '%' : 
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
                                  {training.training_scenarios?.title}
                                </h4>
                                <div className="text-sm text-muted-foreground">
                                  Score: {training.score}% • Budsjett: {training.current_budget}
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
                                  {insight.action_templates?.name}
                                </h4>
                                <div className="text-sm text-muted-foreground">
                                  {insight.action_templates?.subject_area}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">
                                  {insight.actual_hours || insight.estimated_hours}t
                                </div>
                                <Badge variant="secondary">
                                  {insight.status}
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