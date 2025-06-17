
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { useSubjectAreas, useCreateSubjectArea, useUpdateSubjectArea, useDeleteSubjectArea, SubjectArea } from '@/hooks/knowledge/useSubjectAreas';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

const SubjectAreaManager = () => {
  const [editingArea, setEditingArea] = useState<SubjectArea | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<SubjectArea | null>(null);

  const { data: subjectAreas = [], isLoading } = useSubjectAreas();
  const createSubjectArea = useCreateSubjectArea();
  const updateSubjectArea = useUpdateSubjectArea();
  const deleteSubjectArea = useDeleteSubjectArea();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const areaData = {
      name: formData.get('name') as string,
      display_name: formData.get('display_name') as string,
      description: formData.get('description') as string || undefined,
      icon: formData.get('icon') as string || undefined,
      color: formData.get('color') as string,
      sort_order: parseInt(formData.get('sort_order') as string) || 0,
      is_active: formData.get('is_active') === 'on'
    };

    if (editingArea) {
      updateSubjectArea.mutate({ id: editingArea.id, ...areaData });
    } else {
      createSubjectArea.mutate(areaData);
    }

    setIsDialogOpen(false);
    setEditingArea(null);
  };

  const handleDelete = (area: SubjectArea) => {
    setAreaToDelete(area);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (areaToDelete) {
      deleteSubjectArea.mutate(areaToDelete.id);
    }
    setDeleteDialogOpen(false);
    setAreaToDelete(null);
  };

  const toggleActive = (area: SubjectArea) => {
    updateSubjectArea.mutate({
      id: area.id,
      is_active: !area.is_active
    });
  };

  const openDialog = (area?: SubjectArea) => {
    setEditingArea(area || null);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Laster emneområder...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Emneområder</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nytt emne
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingArea ? 'Rediger emneområde' : 'Nytt emneområde'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Navn (teknisk)</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingArea?.name || ''}
                      required
                      placeholder="f.eks. revisjon"
                    />
                  </div>
                  <div>
                    <Label htmlFor="display_name">Visningsnavn</Label>
                    <Input
                      id="display_name"
                      name="display_name"
                      defaultValue={editingArea?.display_name || ''}
                      required
                      placeholder="f.eks. Revisjon"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Beskrivelse</Label>
                    <Input
                      id="description"
                      name="description"
                      defaultValue={editingArea?.description || ''}
                      placeholder="Kort beskrivelse av emneområdet"
                    />
                  </div>
                  <div>
                    <Label htmlFor="icon">Ikon (Lucide-navn)</Label>
                    <Input
                      id="icon"
                      name="icon"
                      defaultValue={editingArea?.icon || ''}
                      placeholder="shield-check"
                    />
                  </div>
                  <div>
                    <Label htmlFor="color">Farge</Label>
                    <Input
                      id="color"
                      name="color"
                      type="color"
                      defaultValue={editingArea?.color || '#10B981'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sort_order">Sorteringsrekkefølge</Label>
                    <Input
                      id="sort_order"
                      name="sort_order"
                      type="number"
                      defaultValue={editingArea?.sort_order || 0}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      name="is_active"
                      defaultChecked={editingArea?.is_active ?? true}
                    />
                    <Label htmlFor="is_active">Aktiv</Label>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createSubjectArea.isPending || updateSubjectArea.isPending}
                  >
                    {editingArea ? 'Oppdater' : 'Opprett'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {subjectAreas.map((area) => (
              <div key={area.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded" 
                    style={{ backgroundColor: area.color }}
                  />
                  <div className={!area.is_active ? 'opacity-50' : ''}>
                    <div className="font-medium">{area.display_name}</div>
                    <div className="text-sm text-muted-foreground">{area.description}</div>
                  </div>
                  <Badge variant={area.is_active ? 'default' : 'secondary'}>
                    {area.is_active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(area)}
                    disabled={updateSubjectArea.isPending}
                  >
                    {area.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDialog(area)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(area)}
                    disabled={deleteSubjectArea.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {subjectAreas.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Ingen emneområder opprettet ennå.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Slett emneområde"
        itemName={areaToDelete?.display_name || ''}
        itemType="emneområde"
        consequences={[
          'Alle artikler tilknyttet dette emneområdet vil miste koblingen',
          'Emne-baserte filtreringer vil ikke lenger fungere for disse artiklene',
          'AI-Revy vil ikke kunne identifisere dette emneområdet i søk'
        ]}
      />
    </>
  );
};

export default SubjectAreaManager;
