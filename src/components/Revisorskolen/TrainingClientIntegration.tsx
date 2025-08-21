import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Building2, BookOpen, TrendingUp, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TrainingClientIntegrationProps {
  onSelectClient?: (clientId: string) => void;
}

export const TrainingClientIntegration: React.FC<TrainingClientIntegrationProps> = ({
  onSelectClient
}) => {
  const { toast } = useToast();

  // Reuse existing client query pattern
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients-for-training'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          name,
          industry,
          created_at,
          risk_profile
        `)
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  // Get training progress for clients
  const { data: trainingProgress } = useQuery({
    queryKey: ['client-training-progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_runs')
        .select(`
          id,
          status,
          current_budget,
          score,
          training_scenarios (
            title,
            company_name
          )
        `)
        .eq('status', 'completed');

      if (error) throw error;
      return data;
    }
  });

  // Get training recommendations based on client risk profiles
  const { data: recommendations } = useQuery({
    queryKey: ['training-recommendations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_scenarios')
        .select(`
          id,
          title,
          difficulty_level,
          learning_objectives,
          risk_objectives
        `)
        .eq('is_active', true)
        .order('difficulty_level');

      if (error) throw error;
      return data;
    }
  });

  const handleApplyTrainingToClient = async (clientId: string, scenarioId: string) => {
    try {
      // Reuse existing mutation pattern
      const { error } = await supabase
        .from('training_runs')
        .insert({
          client_id: clientId,
          scenario_id: scenarioId,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Treningsscenario tilordnet",
        description: "Treningsscenarioet er tilordnet klienten."
      });

      if (onSelectClient) {
        onSelectClient(clientId);
      }
    } catch (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke tilordne treningsscenario.",
        variant: "destructive"
      });
    }
  };

  if (isLoadingClients) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-pulse">Laster klienter...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Klient-integrering for Trening
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="clients" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="clients">Klienter</TabsTrigger>
              <TabsTrigger value="progress">Progresjon</TabsTrigger>
              <TabsTrigger value="recommendations">Anbefalinger</TabsTrigger>
            </TabsList>

            <TabsContent value="clients" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {clients?.map((client) => (
                    <Card key={client.id} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium">{client.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{client.industry}</span>
                              {client.risk_profile && (
                                <Badge variant="outline" className="text-xs">
                                  {client.risk_profile}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onSelectClient?.(client.id)}
                          >
                            <BookOpen className="h-4 w-4 mr-1" />
                            Velg for trening
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="progress" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {trainingProgress?.map((progress) => (
                    <Card key={progress.id} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium">
                              {progress.training_scenarios?.title}
                            </h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Poeng: {progress.score}
                              </span>
                              <Badge variant="secondary">
                                {progress.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              Budsjett: {progress.current_budget}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="recommendations" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {recommendations?.map((scenario) => (
                    <Card key={scenario.id} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{scenario.title}</h4>
                            <Badge 
                              variant={
                                scenario.difficulty_level === 'beginner' ? 'default' :
                                scenario.difficulty_level === 'intermediate' ? 'secondary' :
                                'destructive'
                              }
                            >
                              {scenario.difficulty_level}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <h5 className="text-sm font-medium mb-1">Læringsmål:</h5>
                              <div className="flex flex-wrap gap-1">
                                {scenario.learning_objectives?.slice(0, 3).map((objective, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {objective}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};