
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import createTaxonomyHooks from '@/hooks/knowledge/useTaxonomy';
import { ContentType } from '@/hooks/knowledge/useContentTypes';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

const {
  useTaxonomies: useContentTypes,
  useCreateTaxonomy: useCreateContentType,
  useUpdateTaxonomy: useUpdateContentType,
  useDeleteTaxonomy: useDeleteContentType,
} = createTaxonomyHooks<ContentType>('content_types', 'Innholdstype');

const ContentTypeManager = () => {
  const [editingType, setEditingType] = useState<ContentType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<ContentType | null>(null);

  const { data: contentTypes = [], isLoading } = useContentTypes();
  const createContentType = useCreateContentType();
  const updateContentType = useUpdateContentType();
  const deleteContentType = useDeleteContentType();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const typeData = {
      name: formData.get('name') as string,
      display_name: formData.get('display_name') as string,
      description: formData.get('description') as string || undefined,
      icon: formData.get('icon') as string || undefined,
      color: formData.get('color') as string,
      sort_order: parseInt(formData.get('sort_order') as string) || 0,
      is_active: formData.get('is_active') === 'on'
    };

    if (editingType) {
      updateContentType.mutate({ id: editingType.id, ...typeData });
    } else {
      createContentType.mutate(typeData);
    }

    setIsDialogOpen(false);
    setEditingType(null);
  };

  const handleDelete = (type: ContentType) => {
    setTypeToDelete(type);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (typeToDelete) {
      deleteContentType.mutate(typeToDelete.id);
    }
    setDeleteDialogOpen(false);
    setTypeToDelete(null);
  };

  const toggleActive = (type: ContentType) => {
    updateContentType.mutate({
      id: type.id,
      is_active: !type.is_active
    });
  };

  const openDialog = (type?: ContentType) => {
    setEditingType(type || null);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Laster innholdstyper...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
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
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Navn (teknisk)</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingType?.name || ''}
                      required
                      placeholder="f.eks. fagartikkel"
                    />
                  </div>
                  <div>
                    <Label htmlFor="display_name">Visningsnavn</Label>
                    <Input
                      id="display_name"
                      name="display_name"
                      defaultValue={editingType?.display_name || ''}
                      required
                      placeholder="f.eks. Fagartikkel"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Beskrivelse</Label>
                    <Input
                      id="description"
                      name="description"
                      defaultValue={editingType?.description || ''}
                      placeholder="Kort beskrivelse av innholdstypen"
                    />
                  </div>
                  <div>
                    <Label htmlFor="icon">Ikon (Lucide-navn)</Label>
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
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createContentType.isPending || updateContentType.isPending}
                  >
                    {editingType ? 'Oppdater' : 'Opprett'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
              {contentTypes.map((type: ContentType) => (
              <div key={type.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded" 
                    style={{ backgroundColor: type.color }}
                  />
                  <div className={!type.is_active ? 'opacity-50' : ''}>
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
                    onClick={() => toggleActive(type)}
                    disabled={updateContentType.isPending}
                  >
                    {type.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
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
                    onClick={() => handleDelete(type)}
                    disabled={deleteContentType.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {contentTypes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Ingen innholdstyper opprettet ennå.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Slett innholdstype"
        itemName={typeToDelete?.display_name || ''}
        itemType="innholdstype"
        consequences={[
          'Alle artikler av denne typen vil miste sin type-kobling',
          'Type-baserte filtreringer vil ikke lenger fungere for disse artiklene',
          'AI-Revy vil ikke kunne identifisere denne innholdstypen'
        ]}
      />
    </>
  );
};

export default ContentTypeManager;
