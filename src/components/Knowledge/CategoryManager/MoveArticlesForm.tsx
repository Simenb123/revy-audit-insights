
import React, { useState } from 'react';
import { Category } from '@/types/classification';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MoveArticlesFormProps {
  fromCategory: Category;
  categories: Category[];
  onSubmit: (toCategoryId: string) => void;
}

const MoveArticlesForm = ({ 
  fromCategory, 
  categories, 
  onSubmit 
}: MoveArticlesFormProps) => {
  const [toCategoryId, setToCategoryId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (toCategoryId) {
      onSubmit(toCategoryId);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p>Flytt alle artikler fra "{fromCategory.name}" til:</p>
      
      <div>
        <Label>Til kategori</Label>
        <Select value={toCategoryId} onValueChange={setToCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder="Velg målkategori" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={!toCategoryId}>
        Flytt artikler
      </Button>
    </form>
  );
};

export default MoveArticlesForm;
