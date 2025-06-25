
import React, { useState } from 'react';
import { Category } from '@/types/classification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CategoryFormProps {
  category?: Category;
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  categories: Category[];
}

const CategoryForm = ({ 
  category, 
  onSubmit, 
  onCancel, 
  categories 
}: CategoryFormProps) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    parent_category_id: category?.parent_category_id || 'none',
    display_order: category?.display_order || 0,
    icon: category?.icon || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      parent_category_id: formData.parent_category_id === 'none' ? null : formData.parent_category_id,
      display_order: Number(formData.display_order)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Navn</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Beskrivelse</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="parent">Overordnet kategori</Label>
        <Select 
          value={formData.parent_category_id} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, parent_category_id: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Velg overordnet kategori (valgfritt)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Ingen (hovedkategori)</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="order">Sorteringsrekkefølge</Label>
        <Input
          id="order"
          type="number"
          value={formData.display_order}
          onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
        />
      </div>

      <div>
        <Label htmlFor="icon">Ikon (valgfritt)</Label>
        <Select 
          value={formData.icon} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Velg ikon" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="folder">📁 Mappe</SelectItem>
            <SelectItem value="file-text">📄 Dokument</SelectItem>
            <SelectItem value="calculator">🧮 Kalkulator</SelectItem>
            <SelectItem value="shield-check">🛡️ Sikkerhet</SelectItem>
            <SelectItem value="scale">⚖️ Vekt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button type="submit">
          {category ? 'Oppdater' : 'Opprett'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Avbryt
          </Button>
        )}
      </div>
    </form>
  );
};

export default CategoryForm;
