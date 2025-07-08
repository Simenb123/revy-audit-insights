
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { type Tag } from '@/hooks/knowledge/useTags';

interface TagFormProps {
  defaultValues?: Partial<Tag>;
  onSubmit: (data: Omit<Tag, 'id' | 'created_at' | 'updated_at'>) => void;
}

const TagForm = ({ defaultValues, onSubmit }: TagFormProps) => {
  const [formData, setFormData] = useState({
    name: defaultValues?.name || '',
    display_name: defaultValues?.display_name || '',
    description: defaultValues?.description || '',
    category: defaultValues?.category || '',
    color: defaultValues?.color || '#6B7280',
    sort_order: defaultValues?.sort_order || 0,
    is_active: defaultValues?.is_active !== undefined ? defaultValues.is_active : true
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
          {defaultValues ? 'Oppdater' : 'Opprett'}
        </Button>
      </div>
    </form>
  );
};

export default TagForm;
