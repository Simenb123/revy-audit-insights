import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FileText, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TrainingAuditIntegrationProps {
  clientId?: string;
}

export const TrainingAuditIntegration: React.FC<TrainingAuditIntegrationProps> = ({
  clientId
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reuse existing action templates query pattern
  const { data: actionTemplates } = useQuery({
    queryKey: ['action-templates-for-training'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('action_templates')
        .select(`
          id,
          name,
          description,
          subject_area,
          estimated_hours,
          complexity_level,
          action_groups (
            name,
            color
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  // Get training scenarios that match audit actions
  const { data: trainingScenarios } = useQuery({
    queryKey: ['training-audit-scenarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_scenarios')
        .select(`
          id,
          title,
          learning_objectives,
          risk_objectives,
          difficulty_level
        `)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    }
  });

  // Get completed training runs with performance data
  const { data: completedTraining } = useQuery({
    queryKey: ['completed-training-performance', clientId],
    queryFn: async () => {
      const query = supabase
        .from('training_runs')
        .select(`
          id,
          score,
          current_budget,
          created_at,
          training_scenarios (
            title,
            learning_objectives,
            risk_objectives
          ),
          training_run_states (
            action_type,
            score_impact,
            created_at
          )
        `)
        .eq('status', 'completed');

      if (clientId) {
        query.eq('client_id', clientId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clientId
  });

  // Mutation to create audit action from training
  const createAuditActionMutation = useMutation({
    mutationFn: async ({ trainingRunId, actionTemplateId }: { trainingRunId: string, actionTemplateId: string }) => {
      const { data, error } = await supabase
        .from('audit_actions')
        .insert({
          template_id: actionTemplateId,
          client_id: clientId,
          status: 'pending',
          metadata: {
            source: 'training',
            training_run_id: trainingRunId
          }
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Revisjonshandling opprettet",
        description: "Revisjonshandlingen er opprettet basert på treningsresultater."
      });
      queryClient.invalidateQueries({ queryKey: ['audit-actions'] });
    },
    onError: () => {
      toast({
        title: "Feil",
        description: "Kunne ikke opprette revisjonshandling.",
        variant: "destructive"
      });
    }
  });

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRecommendedActions = (objectives: string[]) => {
    return actionTemplates?.filter(template => 
      objectives.some(obj => 
        template.description?.toLowerCase().includes(obj.toLowerCase()) ||
        template.name.toLowerCase().includes(obj.toLowerCase())
      )
    ) || [];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Trening til Revisjon - Integrering
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="performance" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="performance">Ytelse</TabsTrigger>
              <TabsTrigger value="recommendations">Anbefalinger</TabsTrigger>
              <TabsTrigger value="actions">Handlinger</TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {completedTraining?.map((training) => (
                    <Card key={training.id} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">
                              {training.training_scenarios?.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${getPerformanceColor(training.score)}`}>
                                {training.score}%
                              </span>
                              {training.score >= 80 ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <h5 className="text-sm font-medium mb-1">Risikomål oppnådd:</h5>
                              <div className="flex flex-wrap gap-1">
                                {training.training_scenarios?.risk_objectives?.map((objective, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {objective}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span>Budsjett brukt: {training.current_budget}</span>
                              <span>Handlinger: {training.training_run_states?.length || 0}</span>
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
                <div className="space-y-4">
                  {completedTraining?.map((training) => {
                    const recommendedActions = getRecommendedActions(
                      training.training_scenarios?.risk_objectives || []
                    );
                    
                    return (
                      <Card key={training.id} className="border-border/50">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">
                                Anbefalte handlinger for: {training.training_scenarios?.title}
                              </h4>
                              <Badge variant="secondary">
                                {recommendedActions.length} handlinger
                              </Badge>
                            </div>
                            
                            <div className="space-y-2">
                              {recommendedActions.slice(0, 3).map((action) => (
                                <div key={action.id} className="flex items-center justify-between p-2 border rounded">
                                  <div className="space-y-1">
                                    <div className="font-medium text-sm">{action.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {action.estimated_hours}h • {action.complexity_level}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => createAuditActionMutation.mutate({
                                      trainingRunId: training.id,
                                      actionTemplateId: action.id
                                    })}
                                    disabled={createAuditActionMutation.isPending}
                                  >
                                    <ArrowRight className="h-3 w-3 mr-1" />
                                    Opprett
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="actions" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {actionTemplates?.map((template) => (
                    <Card key={template.id} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium">{template.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{template.estimated_hours}h</span>
                              <Badge variant="outline" className="text-xs">
                                {template.complexity_level}
                              </Badge>
                              {template.action_groups && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs"
                                  style={{ 
                                    borderColor: template.action_groups.color,
                                    color: template.action_groups.color 
                                  }}
                                >
                                  {template.action_groups.name}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {template.description}
                            </p>
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