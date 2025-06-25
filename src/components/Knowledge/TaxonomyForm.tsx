import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

export interface TaxonomyData {
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
}

interface TaxonomyFormProps {
  initialData?: Partial<TaxonomyData>;
  onSubmit: (data: TaxonomyData) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

const TaxonomyForm: React.FC<TaxonomyFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Lagre',
}) => {
  const [formData, setFormData] = useState<TaxonomyData>({
    name: initialData?.name ?? '',
    display_name: initialData?.display_name ?? '',
    description: initialData?.description ?? '',
    icon: initialData?.icon ?? '',
    color: initialData?.color ?? '#3B82F6',
    sort_order: initialData?.sort_order ?? 0,
    is_active: initialData?.is_active ?? true,
  });

  const handleChange = (field: keyof TaxonomyData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Navn (teknisk)</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={e => handleChange('name', e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="display_name">Visningsnavn</Label>
        <Input
          id="display_name"
          value={formData.display_name}
          onChange={e => handleChange('display_name', e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Beskrivelse</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={e => handleChange('description', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="icon">Ikon (Lucide-navn)</Label>
        <Input
          id="icon"
          value={formData.icon}
          onChange={e => handleChange('icon', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="color">Farge</Label>
        <Input
          id="color"
          type="color"
          value={formData.color}
          onChange={e => handleChange('color', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="sort_order">Sorteringsrekkefølge</Label>
        <Input
          id="sort_order"
          type="number"
          value={formData.sort_order}
          onChange={e => handleChange('sort_order', parseInt(e.target.value) || 0)}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={!!formData.is_active}
          onCheckedChange={checked => handleChange('is_active', checked)}
        />
        <Label htmlFor="is_active">Aktiv</Label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Avbryt
          </Button>
        )}
      </div>
    </form>
  );
};

export default TaxonomyForm;
