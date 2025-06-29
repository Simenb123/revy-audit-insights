
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FolderTree, 
  Plus, 
  Edit, 
  Trash2, 
  MoveUp, 
  MoveDown,
  ArrowRight,
  Folder,
  FolderOpen
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import type { AuditPhase } from '@/types/revio';
import type { Category as BaseCategory } from '@/types/classification';

interface Category extends Omit<BaseCategory, 'applicable_phases' | 'children'> {
  article_count: number;
  children?: Category[];
  applicable_phases?: string[] | null;
}

interface CategoryFormData {
  name: string;
  description: string;
  icon: string;
  parent_category_id: string;
  display_order: number;
  applicable_phases: string[];
}

const ImprovedCategoryManager = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['improved-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('*')
        .order('parent_category_id NULLS FIRST, display_order, name');
      
      if (error) throw error;
      
      // Get article counts for each category
      const categoriesWithCounts = await Promise.all(
        data.map(async (category) => {
          const { count } = await supabase
            .from('knowledge_articles')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('status', 'published');
          
          return {
            ...category,
            article_count: count || 0,
            slug: category.slug || category.id
          };
        })
      );
      
      // Build hierarchy
      const categoryMap = new Map<string, Category>();
      const rootCategories: Category[] = [];
      
      categoriesWithCounts.forEach(cat => {
        categoryMap.set(cat.id, { ...cat, children: [] });
      });
      
      categoriesWithCounts.forEach(cat => {
        const category = categoryMap.get(cat.id)!;
        if (cat.parent_category_id) {
          const parent = categoryMap.get(cat.parent_category_id);
          if (parent) {
            parent.children!.push(category);
          }
        } else {
          rootCategories.push(category);
        }
      });
      
      return rootCategories;
    }
  });

  const createCategory = useMutation({
    mutationFn: async (categoryData: CategoryFormData) => {
      // Convert applicable_phases to match database enum values
      const mappedPhases = categoryData.applicable_phases.map(phase => {
        if (phase === 'completion') return 'conclusion';
        if (phase === 'risk_assessment') return 'planning';
        if (phase === 'overview') return 'engagement';
        return phase;
      });

      const dbData: Database['public']['Tables']['knowledge_categories']['Insert'] = {
        name: categoryData.name,
        description: categoryData.description || null,
        icon: categoryData.icon || null,
        parent_category_id: categoryData.parent_category_id || null,
        display_order: categoryData.display_order,
        applicable_phases: mappedPhases as Database['public']['Enums']['audit_phase'][]
      };
      
      const { data, error } = await supabase
        .from('knowledge_categories')
        .insert(dbData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['improved-categories'] });
      toast.success('Kategori opprettet');
      setCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error('Feil ved opprettelse: ' + error.message);
    }
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CategoryFormData> & { id: string }) => {
      // Convert applicable_phases to match database enum values
      const mappedPhases = updates.applicable_phases?.map(phase => {
        if (phase === 'completion') return 'conclusion';
        if (phase === 'risk_assessment') return 'planning';
        if (phase === 'overview') return 'engagement';
        return phase;
      });

      const dbUpdates: Database['public']['Tables']['knowledge_categories']['Update'] = {
        name: updates.name,
        description: updates.description || null,
        icon: updates.icon || null,
        parent_category_id: updates.parent_category_id || null,
        display_order: updates.display_order,
        applicable_phases: mappedPhases as Database['public']['Enums']['audit_phase'][] | null
      };
      
      const { data, error } = await supabase
        .from('knowledge_categories')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['improved-categories'] });
      toast.success('Kategori oppdatert');
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error('Feil ved oppdatering: ' + error.message);
    }
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      // Check if category has articles
      const { count } = await supabase
        .from('knowledge_articles')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id);
      
      if (count && count > 0) {
        throw new Error(`Kan ikke slette kategori med ${count} artikler. Flytt artiklene først.`);
      }
      
      // Check if category has subcategories
      const { count: subCount } = await supabase
        .from('knowledge_categories')
        .select('*', { count: 'exact', head: true })
        .eq('parent_category_id', id);
      
      if (subCount && subCount > 0) {
        throw new Error(`Kan ikke slette kategori med ${subCount} underkategorier. Flytt de først.`);
      }
      
      const { error } = await supabase
        .from('knowledge_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['improved-categories'] });
      toast.success('Kategori slettet');
    },
    onError: (error: any) => {
      toast.error('Feil ved sletting: ' + error.message);
    }
  });

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategoryTree = (categories: Category[], level = 0) => {
    return categories.map((category) => (
      <div key={category.id} className="space-y-1">
        <div 
          className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-accent/50 ${
            selectedCategory?.id === category.id ? 'bg-accent' : ''
          }`}
          style={{ marginLeft: `${level * 20}px` }}
          onClick={() => setSelectedCategory(category)}
        >
          {category.children && category.children.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleCategory(category.id);
              }}
            >
              {expandedCategories.has(category.id) ? (
                <FolderOpen className="h-4 w-4" />
              ) : (
                <Folder className="h-4 w-4" />
              )}
            </Button>
          )}
          
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">{category.name}</span>
              {category.parent_category_id && (
                <Badge variant="outline" className="text-xs">Underkategori</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{category.article_count} artikler</Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCategory(category);
                  setEditDialogOpen(true);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteCategory.mutate(category.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {category.children && 
         category.children.length > 0 && 
         expandedCategories.has(category.id) && (
          <div>
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (isLoading) {
    return <div>Laster kategorier...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Kategoristruktur
            </span>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ny kategori
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Opprett kategori</DialogTitle>
                </DialogHeader>
                <CategoryForm 
                  onSubmit={(data) => createCategory.mutate(data)}
                  categories={categories}
                />
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {renderCategoryTree(categories)}
          </div>
        </CardContent>
      </Card>

      {selectedCategory && (
        <Card>
          <CardHeader>
            <CardTitle>Kategoriinformasjon</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryDetails 
              category={selectedCategory} 
              onEdit={() => setEditDialogOpen(true)}
            />
          </CardContent>
        </Card>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rediger kategori</DialogTitle>
          </DialogHeader>
          <CategoryForm 
            category={selectedCategory}
            onSubmit={(data) => updateCategory.mutate({ id: selectedCategory!.id, ...data })}
            categories={categories}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

const CategoryForm = ({ 
  category, 
  onSubmit, 
  categories 
}: { 
  category?: Category | null; 
  onSubmit: (data: CategoryFormData) => void;
  categories: Category[];
}) => {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: category?.name || '',
    description: category?.description || '',
    icon: category?.icon || '',
    parent_category_id: category?.parent_category_id || '',
    display_order: category?.display_order || 0,
    applicable_phases: category?.applicable_phases || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const flattenCategories = (cats: Category[]): Category[] => {
    return cats.reduce((acc: Category[], cat) => {
      acc.push(cat);
      if (cat.children) {
        acc.push(...flattenCategories(cat.children));
      }
      return acc;
    }, []);
  };

  const allCategories = flattenCategories(categories);

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
        <Label htmlFor="parent_category">Overordnet kategori</Label>
        <Select 
          value={formData.parent_category_id} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, parent_category_id: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Velg overordnet kategori (valgfritt)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Ingen (rot-kategori)</SelectItem>
            {allCategories
              .filter(cat => cat.id !== category?.id)
              .map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.parent_category_id ? `→ ${cat.name}` : cat.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="display_order">Sorteringsrekkefølge</Label>
        <Input
          id="display_order"
          type="number"
          value={formData.display_order}
          onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
        />
      </div>

      <Button type="submit">
        {category ? 'Oppdater' : 'Opprett'}
      </Button>
    </form>
  );
};

const CategoryDetails = ({ 
  category, 
  onEdit 
}: { 
  category: Category; 
  onEdit: () => void;
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{category.name}</h3>
        <Button onClick={onEdit} variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Rediger
        </Button>
      </div>
      
      {category.description && (
        <p className="text-sm text-muted-foreground">{category.description}</p>
      )}
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <Label className="font-semibold">Artikler:</Label>
          <p>{category.article_count || 0}</p>
        </div>
        <div>
          <Label className="font-semibold">Sortering:</Label>
          <p>{category.display_order}</p>
        </div>
        <div>
          <Label className="font-semibold">Type:</Label>
          <p>{category.parent_category_id ? 'Underkategori' : 'Hovedkategori'}</p>
        </div>
        <div>
          <Label className="font-semibold">Underkategorier:</Label>
          <p>{category.children?.length || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default ImprovedCategoryManager;
