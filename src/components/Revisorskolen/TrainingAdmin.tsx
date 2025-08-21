import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataTable from '@/components/ui/data-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  Settings,
  FileText
} from 'lucide-react';

interface TrainingScenario {
  id: string;
  title: string;
  description?: string;
  difficulty_level: string;
  learning_objectives: string[];
  risk_objectives: string[];
  company_name?: string;
  industry?: string;
  is_active: boolean;
  created_at: string;
}

interface ActionTemplate {
  id: string;
  name: string;
  description?: string;
  subject_area: string;
  action_type: string;
  procedures: string;
  estimated_hours?: number;
  risk_level: string;
  applicable_phases: string[];
  is_active: boolean;
  created_at: string;
}

const TrainingAdmin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreatingScenario, setIsCreatingScenario] = useState(false);
  const [isCreatingAction, setIsCreatingAction] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [newScenario, setNewScenario] = useState({
    title: '',
    description: '',
    difficulty_level: 'beginner',
    learning_objectives: [''],
    risk_objectives: [''],
    company_name: '',
    industry: ''
  });

  const [newAction, setNewAction] = useState({
    name: '',
    description: '',
    subject_area: 'sales',
    action_type: 'analytical',
    procedures: '',
    estimated_hours: 1,
    risk_level: 'medium',
    applicable_phases: ['planning']
  });

  // Fetch training scenarios
  const { data: scenarios, isLoading: scenariosLoading } = useQuery({
    queryKey: ['training-scenarios-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_scenarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TrainingScenario[];
    }
  });

  // Fetch action templates
  const { data: actionTemplates, isLoading: actionsLoading } = useQuery({
    queryKey: ['audit-action-templates-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_action_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ActionTemplate[];
    }
  });

  // Create scenario mutation
  const createScenarioMutation = useMutation({
    mutationFn: async (scenario: any) => {
      const { data, error } = await supabase
        .from('training_scenarios')
        .insert({
          ...scenario,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Scenario opprettet",
        description: "Det nye treningsscenariet er opprettet."
      });
      queryClient.invalidateQueries({ queryKey: ['training-scenarios-admin'] });
      setIsCreatingScenario(false);
      setNewScenario({
        title: '',
        description: '',
        difficulty_level: 'beginner',
        learning_objectives: [''],
        risk_objectives: [''],
        company_name: '',
        industry: ''
      });
    },
    onError: () => {
      toast({
        title: "Feil",
        description: "Kunne ikke opprette scenario.",
        variant: "destructive"
      });
    }
  });

  // Create action template mutation
  const createActionMutation = useMutation({
    mutationFn: async (action: any) => {
      const { data, error } = await supabase
        .from('audit_action_templates')
        .insert({
          ...action,
          is_active: true,
          sort_order: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Handlingsmal opprettet",
        description: "Den nye handlingsmalen er opprettet."
      });
      queryClient.invalidateQueries({ queryKey: ['audit-action-templates-admin'] });
      setIsCreatingAction(false);
      setNewAction({
        name: '',
        description: '',
        subject_area: 'sales',
        action_type: 'analytical',
        procedures: '',
        estimated_hours: 1,
        risk_level: 'medium',
        applicable_phases: ['planning']
      });
    },
    onError: () => {
      toast({
        title: "Feil",
        description: "Kunne ikke opprette handlingsmal.",
        variant: "destructive"
      });
    }
  });

  // Delete mutations
  const deleteScenarioMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('training_scenarios')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Scenario slettet",
        description: "Treningsscenariet er slettet."
      });
      queryClient.invalidateQueries({ queryKey: ['training-scenarios-admin'] });
    }
  });

  const deleteActionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('audit_action_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Handlingsmal slettet",
        description: "Handlingsmalen er slettet."
      });
      queryClient.invalidateQueries({ queryKey: ['audit-action-templates-admin'] });
    }
  });

  const handleCreateScenario = () => {
    const objectives = newScenario.learning_objectives.filter(obj => obj.trim() !== '');
    const riskObjectives = newScenario.risk_objectives.filter(obj => obj.trim() !== '');
    
    createScenarioMutation.mutate({
      ...newScenario,
      learning_objectives: objectives,
      risk_objectives: riskObjectives
    });
  };

  const handleCreateAction = () => {
    createActionMutation.mutate(newAction);
  };

  const scenarioColumns = [
    {
      key: 'title',
      header: 'Tittel',
      accessor: 'title' as keyof TrainingScenario,
      format: (value: any) => <div className="font-medium">{value}</div>
    },
    {
      key: 'difficulty_level',
      header: 'Vanskelighetsgrad',
      accessor: 'difficulty_level' as keyof TrainingScenario,
      format: (value: any) => <Badge variant="outline">{value}</Badge>
    },
    {
      key: 'company_name',
      header: 'Selskap',
      accessor: 'company_name' as keyof TrainingScenario,
      format: (value: any) => value || 'Generisk'
    },
    {
      key: 'is_active',
      header: 'Status',
      accessor: 'is_active' as keyof TrainingScenario,
      format: (value: any) => (
        <Badge variant={value ? 'success' : 'secondary'}>
          {value ? 'Aktiv' : 'Inaktiv'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Handlinger',
      accessor: (): null => null,
      format: (value: any, row: TrainingScenario) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditingItem(row)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => deleteScenarioMutation.mutate(row.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )
    }
  ];

  const actionColumns = [
    {
      key: 'name',
      header: 'Navn',
      accessor: 'name' as keyof ActionTemplate,
      format: (value: any) => <div className="font-medium">{value}</div>
    },
    {
      key: 'subject_area',
      header: 'Fagområde',
      accessor: 'subject_area' as keyof ActionTemplate,
      format: (value: any) => <Badge variant="outline">{value}</Badge>
    },
    {
      key: 'action_type',
      header: 'Type',
      accessor: 'action_type' as keyof ActionTemplate
    },
    {
      key: 'risk_level',
      header: 'Risikonivå',
      accessor: 'risk_level' as keyof ActionTemplate,
      format: (value: any) => (
        <Badge 
          variant={
            value === 'high' ? 'destructive' :
            value === 'medium' ? 'warning' : 'success'
          }
        >
          {value}
        </Badge>
      )
    },
    {
      key: 'estimated_hours',
      header: 'Timer',
      accessor: 'estimated_hours' as keyof ActionTemplate,
      format: (value: any) => `${value || 0}h`
    },
    {
      key: 'actions',
      header: 'Handlinger',
      accessor: (): null => null,
      format: (value: any, row: ActionTemplate) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditingItem(row)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => deleteActionMutation.mutate(row.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Revisorskolen Admin</h2>
        </div>
      </div>

      <Tabs defaultValue="scenarios" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scenarios">Treningsscenarioer</TabsTrigger>
          <TabsTrigger value="actions">Handlingsmaler</TabsTrigger>
          <TabsTrigger value="settings">Innstillinger</TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Treningsscenarioer
              </CardTitle>
              <Button onClick={() => setIsCreatingScenario(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nytt Scenario
              </Button>
            </CardHeader>
            <CardContent>
              {isCreatingScenario && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Opprett Nytt Scenario</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tittel</label>
                        <Input
                          value={newScenario.title}
                          onChange={(e) => setNewScenario(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Scenario tittel"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Vanskelighetsgrad</label>
                        <Select 
                          value={newScenario.difficulty_level} 
                          onValueChange={(value) => setNewScenario(prev => ({ ...prev, difficulty_level: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Nybegynner</SelectItem>
                            <SelectItem value="intermediate">Middels</SelectItem>
                            <SelectItem value="advanced">Avansert</SelectItem>
                            <SelectItem value="expert">Ekspert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Beskrivelse</label>
                      <Textarea
                        value={newScenario.description}
                        onChange={(e) => setNewScenario(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Beskriv scenariet"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Selskapsnavn</label>
                        <Input
                          value={newScenario.company_name}
                          onChange={(e) => setNewScenario(prev => ({ ...prev, company_name: e.target.value }))}
                          placeholder="Eksempel AS"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Bransje</label>
                        <Input
                          value={newScenario.industry}
                          onChange={(e) => setNewScenario(prev => ({ ...prev, industry: e.target.value }))}
                          placeholder="Teknologi"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleCreateScenario}>
                        Opprett Scenario
                      </Button>
                      <Button variant="outline" onClick={() => setIsCreatingScenario(false)}>
                        Avbryt
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <DataTable
                title="Treningsscenarioer"
                data={scenarios || []}
                columns={scenarioColumns}
                isLoading={scenariosLoading}
                searchPlaceholder="Søk scenarioer..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Handlingsmaler
              </CardTitle>
              <Button onClick={() => setIsCreatingAction(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ny Handlingsmal
              </Button>
            </CardHeader>
            <CardContent>
              {isCreatingAction && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Opprett Ny Handlingsmal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Navn</label>
                        <Input
                          value={newAction.name}
                          onChange={(e) => setNewAction(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Handlingsnavn"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Fagområde</label>
                        <Select 
                          value={newAction.subject_area} 
                          onValueChange={(value) => setNewAction(prev => ({ ...prev, subject_area: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sales">Salg</SelectItem>
                            <SelectItem value="payroll">Lønn</SelectItem>
                            <SelectItem value="operating_expenses">Driftskostnader</SelectItem>
                            <SelectItem value="inventory">Lager</SelectItem>
                            <SelectItem value="finance">Finans</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Beskrivelse</label>
                      <Textarea
                        value={newAction.description}
                        onChange={(e) => setNewAction(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Beskriv handlingen"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Prosedyrer</label>
                      <Textarea
                        value={newAction.procedures}
                        onChange={(e) => setNewAction(prev => ({ ...prev, procedures: e.target.value }))}
                        placeholder="Detaljerte prosedyrer for handlingen"
                        rows={4}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleCreateAction}>
                        Opprett Handlingsmal
                      </Button>
                      <Button variant="outline" onClick={() => setIsCreatingAction(false)}>
                        Avbryt
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <DataTable
                title="Handlingsmaler"
                data={actionTemplates || []}
                columns={actionColumns}
                isLoading={actionsLoading}
                searchPlaceholder="Søk handlingsmaler..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Systeminnstillinger</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Systeminnstillinger for Revisorskolen kommer snart.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrainingAdmin;