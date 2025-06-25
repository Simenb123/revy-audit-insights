import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Edit, Trash2 } from 'lucide-react';
import EntityManager from '../EntityManager';
import {
  useTags,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
} from '@/hooks/knowledge/useTags';
import type { Tag } from '@/hooks/knowledge/useTags';

const TagEntityManager = EntityManager<Tag>;

const TagManager = () => {
  return (
    <TagEntityManager
      title="Tag Administrasjon"
      useEntities={useTags}
      useCreate={useCreateTag}
      useUpdate={useUpdateTag}
      useDelete={useDeleteTag}
      createButtonLabel="Ny Tag"
      renderCard={(tag, handlers) => (
        <TagCard
          tag={tag}
          onSelect={handlers.onSelect}
          onEdit={handlers.onEdit}
          onDelete={() => handlers.onDelete(tag.id)}
          selected={handlers.selected}
        />
      )}
      renderForm={(tag, onSubmit) => <TagForm tag={tag} onSubmit={onSubmit} />}
      renderDetails={(tag) => <TagDetails tag={tag} />}
    />
  );
};

const TagCard = ({ tag, onSelect, onEdit, onDelete, selected }: {
  tag: Tag;
  onSelect: (t: Tag) => void;
  onEdit: () => void;
  onDelete: () => void;
  selected: boolean;
}) => (
  <Card className={`cursor-pointer transition-colors hover:bg-accent/50 ${selected ? 'border-primary' : ''}`}>
    <CardContent className="p-4 flex justify-between">
      <div onClick={() => onSelect(tag)} className="flex-1">
        <h4 className="font-semibold">{tag.display_name}</h4>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
);

const TagForm = ({ tag, onSubmit }: { tag?: Tag | null; onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    name: tag?.name || '',
    display_name: tag?.display_name || '',
    description: tag?.description || '',
    color: tag?.color || '#6B7280',
    sort_order: tag?.sort_order || 0,
    is_active: tag?.is_active !== undefined ? tag.is_active : true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">System navn</Label>
          <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        </div>
        <div>
          <Label htmlFor="display_name">Visningsnavn</Label>
          <Input id="display_name" value={formData.display_name} onChange={(e) => setFormData({ ...formData, display_name: e.target.value })} required />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Beskrivelse</Label>
        <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="color">Farge</Label>
        <Input id="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="sort_order">Sortering</Label>
        <Input id="sort_order" type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} />
      </div>
      <div className="flex items-center space-x-2">
        <Input type="checkbox" id="active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
        <Label htmlFor="active">Aktiv</Label>
      </div>
      <Button type="submit">{tag ? 'Oppdater' : 'Opprett'}</Button>
    </form>
  );
};

const TagDetails = ({ tag }: { tag: Tag }) => (
  <div className="space-y-2 text-sm">
    <p>ID: {tag.id}</p>
    <p>Navn: {tag.name}</p>
    <p>Farge: {tag.color}</p>
  </div>
);

export default TagManager;
