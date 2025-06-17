import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { TreeView, TreeItem, TreeViewTrigger, TreeViewContent } from '@/components/ui/tree-view';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeCategory } from '@/types/knowledge';
import { Folder, FolderOpen, Edit, Trash2, Plus, Move, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';

const CategoryManager = () => {
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | null>(null);
  const [editingCategory, setEditingCategory] = useState<KnowledgeCategory | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['knowledge-categories-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      return data as KnowledgeCategory[];
    }
  });

  const { data: articles = [] } = useQuery({
    queryKey: ['articles-by-category', selectedCategory?.id],
    queryFn: async () => {
      if (!selectedCategory?.id) return [];
      
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('id, title, status, tags')
        .eq('category_id', selectedCategory.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCategory?.id
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (category: Partial<KnowledgeCategory> & { id: string }) => {
      const cleanCategory = {
        name: category.name,
        description: category.description,
        parent_category_id: category.parent_category_id,
        display_order: category.display_order,
        icon: category.icon,
        applicable_phases: category.applicable_phases as ("engagement" | "planning" | "execution" | "conclusion")[] | null
      };

      const { data, error } = await supabase
        .from('knowledge_categories')
        .update(cleanCategory)
        .eq('id', category.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories-all'] });
      toast.success('Kategori oppdatert');
      setEditingCategory(null);
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (category: Omit<KnowledgeCategory, 'id' | 'created_at' | 'updated_at'>) => {
      const cleanCategory = {
        name: category.name,
        description: category.description,
        parent_category_id: category.parent_category_id,
        display_order: category.display_order,
        icon: category.icon,
        applicable_phases: category.applicable_phases as ("engagement" | "planning" | "execution" | "conclusion")[] | null
      };

      const { data, error } = await supabase
        .from('knowledge_categories')
        .insert(cleanCategory)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories-all'] });
      toast.success('Kategori opprettet');
      setIsCreateDialogOpen(false);
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const { data: articlesInCategory } = await supabase
        .from('knowledge_articles')
        .select('id')
        .eq('category_id', categoryId);
      
      if (articlesInCategory && articlesInCategory.length > 0) {
        throw new Error('Kan ikke slette kategori som inneholder artikler');
      }

      const { error } = await supabase
        .from('knowledge_categories')
        .delete()
        .eq('id', categoryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories-all'] });
      toast.success('Kategori slettet');
      setSelectedCategory(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const moveArticlesMutation = useMutation({
    mutationFn: async ({ fromCategoryId, toCategoryId }: { fromCategoryId: string; toCategoryId: string }) => {
      const { error } = await supabase
        .from('knowledge_articles')
        .update({ category_id: toCategoryId })
        .eq('category_id', fromCategoryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles-by-category'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories-all'] });
      toast.success('Artikler flyttet');
      setIsMoveDialogOpen(false);
    }
  });

  const buildCategoryTree = (categories: KnowledgeCategory[], parentId: string | null = null): KnowledgeCategory[] => {
    return categories
      .filter(cat => cat.parent_category_id === parentId)
      .sort((a, b) => a.display_order - b.display_order)
      .map(cat => ({
        ...cat,
        children: buildCategoryTree(categories, cat.id)
      }));
  };

  const renderCategoryTree = (categories: KnowledgeCategory[]) => {
    return categories.map((category) => (
      <TreeItem key={category.id} value={category.id}>
        <TreeViewTrigger>
          <div 
            className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer"
            onClick={() => setSelectedCategory(category)}
          >
            {category.children && category.children.length > 0 ? (
              <FolderOpen className="h-4 w-4" />
            ) : (
              <Folder className="h-4 w-4" />
            )}
            <span className={selectedCategory?.id === category.id ? 'font-semibold text-primary' : ''}>
              {category.name}
            </span>
            <Badge variant="outline" className="ml-auto text-xs">
              {category.display_order}
            </Badge>
          </div>
        </TreeViewTrigger>
        {category.children && category.children.length > 0 && (
          <TreeViewContent>
            {renderCategoryTree(category.children)}
          </TreeViewContent>
        )}
      </TreeItem>
    ));
  };

  if (isLoading) {
    return <div className="p-6">Laster kategorier...</div>;
  }

  const categoryTree = buildCategoryTree(categories);
  const flatCategories = categories.filter(cat => cat.id !== selectedCategory?.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      {/* Category Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Kategoristruktur</span>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Ny
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Opprett ny kategori</DialogTitle>
                </DialogHeader>
                <CategoryForm 
                  onSubmit={(data) => createCategoryMutation.mutate(data)}
                  categories={flatCategories}
                />
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Hovedkategorier</h4>
            <p className="text-sm text-blue-700">
              1. Revisjon • 2. Regnskap • 3. Skatt • 4. Annet
            </p>
          </div>
          <TreeView>
            {renderCategoryTree(categoryTree)}
          </TreeView>
        </CardContent>
      </Card>

      {/* Category Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Kategoridetails</span>
            {selectedCategory && (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setEditingCategory(selectedCategory)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Move className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Flytt artikler</DialogTitle>
                    </DialogHeader>
                    <MoveArticlesForm 
                      fromCategory={selectedCategory}
                      categories={flatCategories}
                      onSubmit={(toCategoryId) => 
                        moveArticlesMutation.mutate({
                          fromCategoryId: selectedCategory.id,
                          toCategoryId
                        })
                      }
                    />
                  </DialogContent>
                </Dialog>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => deleteCategoryMutation.mutate(selectedCategory.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedCategory ? (
            editingCategory ? (
              <CategoryForm 
                category={editingCategory}
                onSubmit={(data) => updateCategoryMutation.mutate({ ...data, id: editingCategory.id })}
                onCancel={() => setEditingCategory(null)}
                categories={flatCategories}
              />
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="font-semibold">Navn</Label>
                  <p>{selectedCategory.name}</p>
                </div>
                {selectedCategory.description && (
                  <div>
                    <Label className="font-semibold">Beskrivelse</Label>
                    <p>{selectedCategory.description}</p>
                  </div>
                )}
                <div>
                  <Label className="font-semibold">Sorteringsrekkefølge</Label>
                  <p>{selectedCategory.display_order}</p>
                </div>
                {selectedCategory.parent_category_id && (
                  <div>
                    <Label className="font-semibold">Overordnet kategori</Label>
                    <p>{categories.find(c => c.id === selectedCategory.parent_category_id)?.name}</p>
                  </div>
                )}
                <div>
                  <Label className="font-semibold">Antall artikler</Label>
                  <p>{articles.length}</p>
                </div>
              </div>
            )
          ) : (
            <p className="text-muted-foreground">Velg en kategori for å se detaljer</p>
          )}
        </CardContent>
      </Card>

      {/* Articles in Category */}
      <Card>
        <CardHeader>
          <CardTitle>Artikler i kategori</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedCategory ? (
            articles.length > 0 ? (
              <div className="space-y-2">
                {articles.map((article) => (
                  <div key={article.id} className="p-3 border rounded">
                    <div className="font-medium">{article.title}</div>
                    <div className="text-sm text-muted-foreground">
                      Status: {article.status}
                    </div>
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {article.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Ingen artikler i denne kategorien</p>
            )
          ) : (
            <p className="text-muted-foreground">Velg en kategori for å se artikler</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const CategoryForm = ({ 
  category, 
  onSubmit, 
  onCancel, 
  categories 
}: {
  category?: KnowledgeCategory;
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  categories: KnowledgeCategory[];
}) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    parent_category_id: category?.parent_category_id || '',
    display_order: category?.display_order || 0,
    icon: category?.icon || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      parent_category_id: formData.parent_category_id || null,
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
            <SelectItem value="">Ingen (hovedkategori)</SelectItem>
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

const MoveArticlesForm = ({ 
  fromCategory, 
  categories, 
  onSubmit 
}: {
  fromCategory: KnowledgeCategory;
  categories: KnowledgeCategory[];
  onSubmit: (toCategoryId: string) => void;
}) => {
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

export default CategoryManager;
