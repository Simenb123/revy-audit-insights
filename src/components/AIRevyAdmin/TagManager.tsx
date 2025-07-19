import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Hash, Plus, Tag as TagIcon, Edit, Trash2 } from 'lucide-react';
import EntityManager from '@/components/common/EntityManager';
import { useTags, useCreateTag, useUpdateTag, useDeleteTag, type Tag } from '@/hooks/knowledge/useTags';
import TagForm from './forms/TagForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const categories = [
  'all',
  'isa-standard',
  'risk-level',
  'audit-phase',
  'content-type',
  'subject-area',
  'custom'
];

const categoryLabels: Record<string, string> = {
  'all': 'Alle kategorier',
  'isa-standard': 'ISA Standarder',
  'risk-level': 'Risikonivå',
  'audit-phase': 'Revisjonsfase',
  'content-type': 'Innholdstype',
  'subject-area': 'Emneområde',
  'custom': 'Tilpasset'
};

const TagCard = ({ tag, actions }: { tag: Tag; actions: { select: () => void; edit: () => void; remove: () => void; selected: boolean } }) => (
  <Card className={`cursor-pointer transition-colors hover:bg-accent/50 ${actions.selected ? 'border-primary' : ''}`}>
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1" onClick={actions.select}>
          <div className="flex items-center gap-2 mb-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-semibold">{tag.display_name}</h4>
            <Badge
              variant="outline"
              style={{ backgroundColor: tag.color + '20', borderColor: tag.color, color: tag.color }}
            >
              {tag.name}
            </Badge>
            {tag.category && (
              <Badge variant="secondary" className="text-xs">{tag.category}</Badge>
            )}
            {!tag.is_active && (
              <Badge variant="secondary" className="text-xs">Inaktiv</Badge>
            )}
          </div>
          {tag.description && (
            <p className="text-sm text-muted-foreground mb-2">{tag.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={actions.edit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={actions.remove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

const TagDetails = ({ tag }: { tag: Tag }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label className="font-semibold">System navn</Label>
        <p className="text-sm font-mono bg-muted p-2 rounded">{tag.name}</p>
      </div>
      <div>
        <Label className="font-semibold">Visningsnavn</Label>
        <p className="text-sm">{tag.display_name}</p>
      </div>
    </div>
    <div>
      <Label className="font-semibold">Beskrivelse</Label>
      <p className="text-sm">{tag.description || 'Ingen beskrivelse'}</p>
    </div>
    <div className="grid grid-cols-3 gap-4">
      <div>
        <Label className="font-semibold">Kategori</Label>
        <p className="text-sm">{tag.category || 'Ingen kategori'}</p>
      </div>
      <div>
        <Label className="font-semibold">Farge</Label>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }} />
          <span className="text-sm font-mono">{tag.color}</span>
        </div>
      </div>
      <div>
        <Label className="font-semibold">Status</Label>
        <p className="text-sm">{tag.is_active ? 'Aktiv' : 'Inaktiv'}</p>
      </div>
    </div>
  </div>
);

const TagManager = () => {
  const [filterCategory, setFilterCategory] = useState('all');
  const { data: tags = [], isLoading } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const filteredTags = filterCategory === 'all' ? tags : tags.filter((tag: Tag) => tag.category === filterCategory);

  return (
    <EntityManager<Tag>
      items={filteredTags}
      isLoading={isLoading}
      itemKey={(t) => t.id}
      onCreate={async (data) => { await createTag.mutateAsync(data); }}
      onUpdate={async (id, data) => { await updateTag.mutateAsync({ id, ...data }); }}
      onDelete={async (id) => { await deleteTag.mutateAsync(id); }}
      FormComponent={({ item, onSubmit }) => (
        <TagForm defaultValues={item ?? undefined} onSubmit={onSubmit} />
      )}
      renderItem={(tag: Tag, actions) => (
        <TagCard tag={tag} actions={actions} />
      )}
      header={(
        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TagIcon className="h-5 w-5" />
              Tag Administrasjon
            </span>
            <Badge variant="outline">{filteredTags.length} tags</Badge>
          </div>
          <div className="flex gap-4 items-center">
            <Label htmlFor="filter">Filter:</Label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{categoryLabels[cat]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      footer={(item) => <TagDetails tag={item} />}
    />
  );
};

export default TagManager;
