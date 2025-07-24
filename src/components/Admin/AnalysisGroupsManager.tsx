import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import EntityManager from '@/components/common/EntityManager';
import AnalysisGroupForm from './forms/AnalysisGroupForm';
import { 
  useAnalysisGroups, 
  useCreateAnalysisGroup, 
  useUpdateAnalysisGroup, 
  useDeleteAnalysisGroup,
  AnalysisGroup 
} from '@/hooks/useAnalysisGroups';
import { toast } from 'sonner';

const AnalysisGroupsManager = () => {
  const { data: groups = [], isLoading } = useAnalysisGroups();
  const createMutation = useCreateAnalysisGroup();
  const updateMutation = useUpdateAnalysisGroup();
  const deleteMutation = useDeleteAnalysisGroup();

  const handleCreate = async (data: any) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Analysegruppe opprettet');
    } catch (error) {
      toast.error('Feil ved opprettelse av analysegruppe');
      throw error;
    }
  };

  const handleUpdate = async (id: string, data: any) => {
    try {
      await updateMutation.mutateAsync({ id, ...data });
      toast.success('Analysegruppe oppdatert');
    } catch (error) {
      toast.error('Feil ved oppdatering av analysegruppe');
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Analysegruppe slettet');
    } catch (error) {
      toast.error('Feil ved sletting av analysegruppe');
      throw error;
    }
  };

  const renderGroupCard = (group: AnalysisGroup, actions: any) => (
    <Card key={group.id} className={`cursor-pointer border-2 ${
      actions.selected ? 'border-primary' : 'border-border'
    }`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{group.name}</CardTitle>
          <div className="flex items-center gap-2">
            {group.is_system_group && (
              <Badge variant="secondary">System</Badge>
            )}
            {group.category && (
              <Badge variant="outline">{group.category}</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-3">
          {group.description || 'Ingen beskrivelse'}
        </p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={actions.edit}
            disabled={group.is_system_group}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={actions.remove}
            disabled={group.is_system_group}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <EntityManager
      items={groups}
      isLoading={isLoading}
      itemKey={(group) => group.id}
      renderItem={renderGroupCard}
      FormComponent={AnalysisGroupForm}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      header={<CardTitle>Analysegrupper</CardTitle>}
    />
  );
};

export default AnalysisGroupsManager;