import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Edit, Trash2 } from 'lucide-react';
import EntityManager from '../EntityManager';
import {
  useKnowledgeCategories,
  useCreateKnowledgeCategory,
  useUpdateKnowledgeCategory,
  useDeleteKnowledgeCategory
} from '@/hooks/knowledge/useKnowledgeCategories';
import type { KnowledgeCategory } from '@/types/knowledge';

const CategoryEntityManager = EntityManager<KnowledgeCategory>;

const CategoryManager = () => {
  return (
    <CategoryEntityManager
      title="Kategori Administrasjon"
      useEntities={useKnowledgeCategories}
      useCreate={useCreateKnowledgeCategory}
      useUpdate={useUpdateKnowledgeCategory}
      useDelete={useDeleteKnowledgeCategory}
      createButtonLabel="Ny Kategori"
      renderCard={(cat, handlers) => (
        <CategoryCard
          category={cat}
          onSelect={handlers.onSelect}
          onEdit={handlers.onEdit}
          onDelete={() => handlers.onDelete(cat.id)}
          selected={handlers.selected}
        />
      )}
      renderForm={(cat, onSubmit) => (
        <CategoryForm category={cat} onSubmit={onSubmit} />
      )}
      renderDetails={(cat) => <CategoryDetails category={cat} />}
    />
  );
};

const CategoryCard = ({ category, onSelect, onEdit, onDelete, selected }: {
  category: KnowledgeCategory;
  onSelect: (c: KnowledgeCategory) => void;
  onEdit: () => void;
  onDelete: () => void;
  selected: boolean;
}) => (
  <Card className={`cursor-pointer transition-colors hover:bg-accent/50 ${selected ? 'border-primary' : ''}`}>
    <CardContent className="p-4 flex justify-between">
      <div onClick={() => onSelect(category)} className="flex-1">
        <h4 className="font-semibold">{category.name}</h4>
        {category.description && (
          <p className="text-sm text-muted-foreground">{category.description}</p>
        )}
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

const CategoryForm = ({ category, onSubmit }: { category?: KnowledgeCategory | null; onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    display_order: category?.display_order || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Navn</Label>
        <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="description">Beskrivelse</Label>
        <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="order">Sortering</Label>
        <Input id="order" type="number" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })} />
      </div>
      <Button type="submit">{category ? 'Oppdater' : 'Opprett'}</Button>
    </form>
  );
};

const CategoryDetails = ({ category }: { category: KnowledgeCategory }) => (
  <div className="space-y-2">
    <p className="text-sm">ID: {category.id}</p>
    <p className="text-sm">Navn: {category.name}</p>
    {category.description && <p className="text-sm">{category.description}</p>}
  </div>
);

export default CategoryManager;
