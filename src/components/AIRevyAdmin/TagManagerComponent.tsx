
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Tag, 
  Filter,
  Hash
} from 'lucide-react';
import createTaxonomyHooks from '@/hooks/knowledge/useTaxonomy';
import { type Tag as TagType } from '@/hooks/knowledge/useTags';

const {
  useTaxonomies: useTags,
  useCreateTaxonomy: useCreateTag,
  useUpdateTaxonomy: useUpdateTag,
  useDeleteTaxonomy: useDeleteTag,
} = createTaxonomyHooks<TagType>('tags', 'Tag');

const TagManagerComponent = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<TagType | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');

  const { data: tags = [], isLoading } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const categories = [
    'all',
    'isa-standard',
    'risk-level', 
    'audit-phase',
    'content-type',
    'subject-area',
    'custom'
  ];

  const categoryLabels = {
    'all': 'Alle kategorier',
    'isa-standard': 'ISA Standarder',
    'risk-level': 'Risikonivå',
    'audit-phase': 'Revisjonsfase',
    'content-type': 'Innholdstype',
    'subject-area': 'Emneområde',
    'custom': 'Tilpasset'
  };

  const filteredTags = tags.filter((tag: TagType) => {
    if (filterCategory === 'all') return true;
    return tag.category === filterCategory;
  });

  const handleCreateTag = async (formData: Omit<TagType, 'id' | 'created_at' | 'updated_at'>) => {
    await createTag.mutateAsync(formData);
    setCreateDialogOpen(false);
  };

  const handleEditTag = async (formData: Omit<TagType, 'id' | 'created_at' | 'updated_at'>) => {
    if (!selectedTag) return;
    await updateTag.mutateAsync({ id: selectedTag.id, ...formData });
    setEditDialogOpen(false);
    setSelectedTag(null);
  };

  const handleDeleteTag = async (tagId: string) => {
    await deleteTag.mutateAsync(tagId);
  };

  if (isLoading) {
    return <div>Laster tags...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tag Administrasjon
            </span>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ny Tag
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Opprett Tag</DialogTitle>
                </DialogHeader>
                <TagForm onSubmit={handleCreateTag} />
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filter */}
          <div className="flex gap-4 items-center mb-6">
            <Label htmlFor="filter">Filter:</Label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {categoryLabels[cat as keyof typeof categoryLabels]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline">
              {filteredTags.length} tags
            </Badge>
          </div>

          {/* Tags Grid */}
          <div className="grid gap-4">
              {filteredTags.map((tag: TagType) => (
              <TagCard 
                key={tag.id} 
                tag={tag} 
                onSelect={setSelectedTag}
                onEdit={() => {
                  setSelectedTag(tag);
                  setEditDialogOpen(true);
                }}
                onDelete={() => handleDeleteTag(tag.id)}
                selected={selectedTag?.id === tag.id}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rediger Tag</DialogTitle>
          </DialogHeader>
          <TagForm 
            tag={selectedTag} 
            onSubmit={handleEditTag} 
          />
        </DialogContent>
      </Dialog>

      {/* Tag Details */}
      {selectedTag && (
        <Card>
          <CardHeader>
            <CardTitle>Tag Detaljer</CardTitle>
          </CardHeader>
          <CardContent>
            <TagDetails tag={selectedTag} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const TagCard = ({ tag, onSelect, onEdit, onDelete, selected }: {
  tag: TagType;
  onSelect: (tag: TagType) => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
  selected: boolean;
}) => {
  return (
    <Card className={`cursor-pointer transition-colors hover:bg-accent/50 ${selected ? 'border-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1" onClick={() => onSelect(tag)}>
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
                <Badge variant="secondary" className="text-xs">
                  {tag.category}
                </Badge>
              )}
              {!tag.is_active && (
                <Badge variant="secondary" className="text-xs">
                  Inaktiv
                </Badge>
              )}
            </div>
            {tag.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {tag.description}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(tag.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TagForm = ({ tag, onSubmit }: { tag?: TagType | null; onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    name: tag?.name || '',
    display_name: tag?.display_name || '',
    description: tag?.description || '',
    color: tag?.color || '#6B7280',
    category: tag?.category || '',
    sort_order: tag?.sort_order || 0,
    is_active: tag?.is_active !== undefined ? tag.is_active : true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const colorOptions = [
    { value: '#3B82F6', label: 'Blå' },
    { value: '#EF4444', label: 'Rød' },
    { value: '#10B981', label: 'Grønn' },
    { value: '#F59E0B', label: 'Gul' },
    { value: '#8B5CF6', label: 'Lilla' },
    { value: '#EC4899', label: 'Rosa' },
    { value: '#6B7280', label: 'Grå' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">System navn</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="f.eks. isa-200"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="display_name">Visningsnavn</Label>
          <Input
            id="display_name"
            value={formData.display_name}
            onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Beskrivelse</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="category">Kategori</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Velg kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="isa-standard">ISA Standard</SelectItem>
              <SelectItem value="risk-level">Risikonivå</SelectItem>
              <SelectItem value="audit-phase">Revisjonsfase</SelectItem>
              <SelectItem value="content-type">Innholdstype</SelectItem>
              <SelectItem value="subject-area">Emneområde</SelectItem>
              <SelectItem value="custom">Tilpasset</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="color">Farge</Label>
          <Select 
            value={formData.color} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map((color) => (
                <SelectItem key={color.value} value={color.value}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: color.value }}
                    />
                    {color.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="sort_order">Sortering</Label>
          <Input
            id="sort_order"
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: Boolean(checked) }))}
        />
        <Label htmlFor="is_active">Aktiv</Label>
      </div>

      <div className="flex gap-2">
        <Button type="submit">
          {tag ? 'Oppdater' : 'Opprett'}
        </Button>
        <Button type="button" variant="outline">
          Avbryt
        </Button>
      </div>
    </form>
  );
};

const TagDetails = ({ tag }: { tag: TagType }) => {
  return (
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
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
            <span className="text-sm font-mono">{tag.color}</span>
          </div>
        </div>
        <div>
          <Label className="font-semibold">Status</Label>
          <p className="text-sm">
            {tag.is_active ? 'Aktiv' : 'Inaktiv'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TagManagerComponent;
