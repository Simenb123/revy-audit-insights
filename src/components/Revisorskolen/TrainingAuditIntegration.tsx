import React, { useState } from 'react';
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

const TrainingAuditIntegration: React.FC<TrainingAuditIntegrationProps> = ({
  clientId
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get audit action templates
  const { data: templates } = useQuery({
    queryKey: ['action-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_action_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Get training runs  
  const { data: trainingRuns } = useQuery({
    queryKey: ['training-runs'], 
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_runs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
  
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const [newScenario, setNewScenario] = useState({
    name: '',
    description: '',
    estimated_hours: 2,
    complexity_level: 'intermediate',
    subject_area: 'sales'
  });

  const restartTraining = (runId: string) => {
    toast({
      title: "Trening startet på nytt",
      description: "Treningsscenarioet kjører på nytt."
    });
  };

  const createNewScenario = () => {
    toast({
      title: "Scenario opprettet", 
      description: "Nytt treningsscenario er opprettet."
    });
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
          <Tabs defaultValue="templates" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="templates">Maler</TabsTrigger>
              <TabsTrigger value="runs">Resultater</TabsTrigger>
              <TabsTrigger value="create">Opprett</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {templates?.map((template: any) => (
                    <Card key={template.id} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold">{template.name}</h3>
                            <p className="text-sm text-muted-foreground">{template.description || 'Ingen beskrivelse'}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{template.subject_area}</Badge>
                              <Badge variant="secondary">{template.risk_level}</Badge>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            Bruk i trening
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="runs" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {trainingRuns?.map((run: any) => (
                    <Card key={run.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">
                            Scenario #{run.scenario_id}
                          </Badge>  
                          <div className={`w-3 h-3 rounded-full ${(run.total_score || 0) > 80 ? 'bg-green-500' : (run.total_score || 0) > 60 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{run.total_score || 0}%</div>
                          <div className="text-xs text-muted-foreground">Score</div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>Status:</span>
                            <span className="font-medium">{run.status || 'Ukjent'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Budsjett brukt:</span>
                            <span className="font-medium">{((run.current_budget || 0) / 100)}%</span>
                            <span>Tid brukt:</span>
                            <span className="font-medium">{run.time_spent_minutes || 0}min</span>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedRun(run)}
                            >
                              Se Detaljer
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => restartTraining(run.id)}
                            >
                              Kjør Igjen
                            </Button>
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

export default TrainingAuditIntegration;