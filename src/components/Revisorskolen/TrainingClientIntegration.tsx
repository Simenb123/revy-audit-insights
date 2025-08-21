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

// Fix database references and simplify
const TrainingClientIntegration: React.FC<TrainingClientIntegrationProps> = ({
  onSelectClient
}) => {
  const { toast } = useToast();

  // Get clients 
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients-for-training'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  // Get training progress
  const { data: trainingProgress } = useQuery({
    queryKey: ['client-training-progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_runs')
        .select('*')
        .eq('status', 'completed');

      if (error) throw error;
      return data;
    }
  });

  // Get training recommendations
  const { data: recommendations } = useQuery({
    queryKey: ['training-recommendations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_scenarios')
        .select('*')
        .eq('is_active', true)
        .order('difficulty_level');

      if (error) throw error;
      return data;
    }
  });

  const handleApplyTrainingToClient = async (clientId: string, scenarioId: string) => {
    try {
      const { error } = await supabase
        .from('training_runs')
        .insert({
          scenario_id: scenarioId,
          user_id: 'current-user', // Simplified for now
          current_budget: 100,
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
                              <span>{client.industry || 'Ukjent bransje'}</span>
                              <Badge variant="outline" className="text-xs">
                                Aktiv
                              </Badge>
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
                              Scenario #{progress.scenario_id}
                            </h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Poeng: {progress.total_score || 0}
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
                                <Badge variant="outline" className="text-xs">
                                  Grunnleggende revisjon
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Risikovurdering
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Dokumentasjon
                                </Badge>
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