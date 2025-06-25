import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Edit, Trash2 } from 'lucide-react';
import {
  useTags,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
  type Tag as TagType
} from '@/hooks/knowledge/useTags';
import EntityManager from '@/components/Knowledge/EntityManager';

const TagManagerComponent = () => {
  const { data: tags = [], isLoading } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const handleSubmit = (form: FormData, editing: TagType | null) => {
    const tagData = {
      name: form.get('name') as string,
      display_name: form.get('display_name') as string,
      description: (form.get('description') as string) || undefined,
      color: form.get('color') as string,
      category: (form.get('category') as string) || '',
      sort_order: parseInt(form.get('sort_order') as string) || 0,
      is_active: form.get('is_active') === 'on'
    };

    if (editing) {
      updateTag.mutate({ id: editing.id, ...tagData });
    } else {
      createTag.mutate(tagData);
    }
  };

  const handleDelete = (item: TagType) => {
    deleteTag.mutate(item.id);
  };

  const renderFormFields = (item: TagType | null) => (
    <>
      <div>
        <Label htmlFor="name">System navn</Label>
        <Input id="name" name="name" defaultValue={item?.name || ''} required placeholder="f.eks. isa-200" />
      </div>
      <div>
        <Label htmlFor="display_name">Visningsnavn</Label>
        <Input id="display_name" name="display_name" defaultValue={item?.display_name || ''} required />
      </div>
      <div>
        <Label htmlFor="description">Beskrivelse</Label>
        <Input id="description" name="description" defaultValue={item?.description || ''} />
      </div>
      <div>
        <Label htmlFor="category">Kategori</Label>
        <Input id="category" name="category" defaultValue={item?.category || ''} />
      </div>
      <div>
        <Label htmlFor="color">Farge</Label>
        <Input id="color" name="color" type="color" defaultValue={item?.color || '#6B7280'} />
      </div>
      <div>
        <Label htmlFor="sort_order">Sortering</Label>
        <Input id="sort_order" name="sort_order" type="number" defaultValue={item?.sort_order || 0} />
      </div>
      <div className="flex items-center space-x-2">
        <input type="checkbox" id="is_active" name="is_active" defaultChecked={item?.is_active ?? true} />
        <Label htmlFor="is_active">Aktiv</Label>
      </div>
    </>
  );

  const renderItem = (item: TagType, actions: { onEdit: () => void; onDelete: () => void }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <Badge variant="outline" style={{ backgroundColor: item.color + '20', borderColor: item.color, color: item.color }}>
          {item.display_name}
        </Badge>
        <span className="text-sm text-muted-foreground">{item.category}</span>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => updateTag.mutate({ id: item.id, is_active: !item.is_active })} disabled={updateTag.isPending}>
          {item.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="sm" onClick={actions.onEdit}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={actions.onDelete} disabled={deleteTag.isPending}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <EntityManager
      title="Tag Administrasjon"
      items={tags}
      isLoading={isLoading}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      renderFormFields={renderFormFields}
      renderItem={renderItem}
      itemTypeLabel="tag"
      getItemName={(item) => item.display_name}
    />
  );
};

export default TagManagerComponent;

