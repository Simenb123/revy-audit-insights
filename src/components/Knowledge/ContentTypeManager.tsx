import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff, Edit, Trash2 } from 'lucide-react';
import {
  useContentTypes,
  useCreateContentType,
  useUpdateContentType,
  useDeleteContentType,
  type ContentType
} from '@/hooks/knowledge/useContentTypes';
import EntityManager from './EntityManager';

const ContentTypeManager = () => {
  const { data: contentTypes = [], isLoading } = useContentTypes();
  const createContentType = useCreateContentType();
  const updateContentType = useUpdateContentType();
  const deleteContentType = useDeleteContentType();

  const handleSubmit = (form: FormData, editing: ContentType | null) => {
    const typeData = {
      name: form.get('name') as string,
      display_name: form.get('display_name') as string,
      description: (form.get('description') as string) || undefined,
      icon: (form.get('icon') as string) || undefined,
      color: form.get('color') as string,
      sort_order: parseInt(form.get('sort_order') as string) || 0,
      is_active: form.get('is_active') === 'on'
    };

    if (editing) {
      updateContentType.mutate({ id: editing.id, ...typeData });
    } else {
      createContentType.mutate(typeData);
    }
  };

  const handleDelete = (item: ContentType) => {
    deleteContentType.mutate(item.id);
  };

  const renderFormFields = (item: ContentType | null) => (
    <>
      <div>
        <Label htmlFor="name">Navn (teknisk)</Label>
        <Input id="name" name="name" defaultValue={item?.name || ''} required placeholder="f.eks. fagartikkel" />
      </div>
      <div>
        <Label htmlFor="display_name">Visningsnavn</Label>
        <Input id="display_name" name="display_name" defaultValue={item?.display_name || ''} required placeholder="f.eks. Fagartikkel" />
      </div>
      <div>
        <Label htmlFor="description">Beskrivelse</Label>
        <Input id="description" name="description" defaultValue={item?.description || ''} placeholder="Kort beskrivelse av innholdstypen" />
      </div>
      <div>
        <Label htmlFor="icon">Ikon (Lucide-navn)</Label>
        <Input id="icon" name="icon" defaultValue={item?.icon || ''} placeholder="file-text" />
      </div>
      <div>
        <Label htmlFor="color">Farge</Label>
        <Input id="color" name="color" type="color" defaultValue={item?.color || '#3B82F6'} />
      </div>
      <div>
        <Label htmlFor="sort_order">Sorteringsrekkefølge</Label>
        <Input id="sort_order" name="sort_order" type="number" defaultValue={item?.sort_order || 0} />
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="is_active" name="is_active" defaultChecked={item?.is_active ?? true} />
        <Label htmlFor="is_active">Aktiv</Label>
      </div>
    </>
  );

  const renderItem = (item: ContentType, actions: { onEdit: () => void; onDelete: () => void }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
        <div className={!item.is_active ? 'opacity-50' : ''}>
          <div className="font-medium">{item.display_name}</div>
          <div className="text-sm text-muted-foreground">{item.description}</div>
        </div>
        <Badge variant={item.is_active ? 'default' : 'secondary'}>
          {item.is_active ? 'Aktiv' : 'Inaktiv'}
        </Badge>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => updateContentType.mutate({ id: item.id, is_active: !item.is_active })} disabled={updateContentType.isPending}>
          {item.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="sm" onClick={actions.onEdit}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={actions.onDelete} disabled={deleteContentType.isPending}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <EntityManager
      title="Innholdstyper"
      items={contentTypes}
      isLoading={isLoading}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      renderFormFields={renderFormFields}
      renderItem={renderItem}
      itemTypeLabel="innholdstype"
      getItemName={(item) => item.display_name}
    />
  );
};

export default ContentTypeManager;

