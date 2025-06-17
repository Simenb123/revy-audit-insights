
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ContentType {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

const ContentTypeManager = () => {
  const [editingType, setEditingType] = useState<ContentType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: contentTypes, isLoading } = useQuery({
    queryKey: ['content-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_types')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data as ContentType[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (type: Omit<ContentType, 'id'>) => {
      const { data, error } = await supabase
        .from('content_types')
        .insert(type)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-types'] });
      setIsDialogOpen(false);
      setEditingType(null);
      toast.success('Innholdstype opprettet');
    },
    onError: (error: any) => {
      toast.error('Feil ved oppretting: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (type: ContentType) => {
      const { data, error } = await supabase
        .from('content_types')
        .update(type)
        .eq('id', type.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-types'] });
      setIsDialogOpen(false);
      setEditingType(null);
      toast.success('Innholdstype oppdatert');
    },
    onError: (error: any) => {
      toast.error('Feil ved oppdatering: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('content_types')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-types'] });
      toast.success('Innholdstype slettet');
    },
    onError: (error: any) => {
      toast.error('Feil ved sletting: ' + error.message);
    }
  });

  const handleSubmit = (formData: FormData) => {
    const typeData = {
      name: formData.get('name') as string,
      display_name: formData.get('display_name') as string,
      description: formData.get('description') as string || null,
      icon: formData.get('icon') as string || null,
      color: formData.get('color') as string,
      sort_order: parseInt(formData.get('sort_order') as string) || 0,
      is_active: formData.get('is_active') === 'on'
    };

    if (editingType) {
      updateMutation.mutate({ ...typeData, id: editingType.id });
    } else {
      createMutation.mutate(typeData);
    }
  };

  const openDialog = (type?: ContentType) => {
    setEditingType(type || null);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div>Laster innholdstyper...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Innholdstyper</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Ny type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingType ? 'Rediger innholdstype' : 'Ny innholdstype'}
                </DialogTitle>
              </DialogHeader>
              <form action={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Navn (teknisk)</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingType?.name || ''}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="display_name">Visningsnavn</Label>
                  <Input
                    id="display_name"
                    name="display_name"
                    defaultValue={editingType?.display_name || ''}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Beskrivelse</Label>
                  <Input
                    id="description"
                    name="description"
                    defaultValue={editingType?.description || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="icon">Ikon</Label>
                  <Input
                    id="icon"
                    name="icon"
                    defaultValue={editingType?.icon || ''}
                    placeholder="file-text"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Farge</Label>
                  <Input
                    id="color"
                    name="color"
                    type="color"
                    defaultValue={editingType?.color || '#3B82F6'}
                  />
                </div>
                <div>
                  <Label htmlFor="sort_order">Sorteringsrekkefølge</Label>
                  <Input
                    id="sort_order"
                    name="sort_order"
                    type="number"
                    defaultValue={editingType?.sort_order || 0}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    name="is_active"
                    defaultChecked={editingType?.is_active ?? true}
                  />
                  <Label htmlFor="is_active">Aktiv</Label>
                </div>
                <Button type="submit" className="w-full">
                  {editingType ? 'Oppdater' : 'Opprett'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {contentTypes?.map((type) => (
            <div key={type.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: type.color }}
                />
                <div>
                  <div className="font-medium">{type.display_name}</div>
                  <div className="text-sm text-muted-foreground">{type.description}</div>
                </div>
                <Badge variant={type.is_active ? 'default' : 'secondary'}>
                  {type.is_active ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDialog(type)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(type.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentTypeManager;
