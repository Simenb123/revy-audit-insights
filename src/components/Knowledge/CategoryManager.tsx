import { logger } from '@/utils/logger';
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
import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/types/classification';
import { Folder, FolderOpen, Edit, Trash2, Plus, Move, AlertTriangle, ChevronRight, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

const CategoryManager = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['knowledge-categories-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      return data as Category[];
    }
  });

  const { data: articles = [] } = useQuery({
    queryKey: ['articles-by-category', selectedCategory?.id],
    queryFn: async () => {
      if (!selectedCategory?.id) return [];
      
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('id, title, status, category_id')
        .eq('category_id', selectedCategory.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedCategory?.id
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (category: Partial<Category> & { id: string }) => {
      const cleanCategory = {
        name: category.name,
        description: category.description,
        parent_category_id: category.parent_category_id === 'none' ? null : category.parent_category_id,
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
    mutationFn: async (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => {
      const cleanCategory = {
        name: category.name,
        description: category.description,
        parent_category_id: category.parent_category_id === 'none' ? null : category.parent_category_id,
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
      logger.log(`=== STARTING DELETE PROCESS FOR CATEGORY: ${categoryId} ===`);
      
      try {
        // Step 1: Get detailed category info
        const { data: categoryData, error: categoryError } = await supabase
          .from('knowledge_categories')
          .select('id, name, parent_category_id')
          .eq('id', categoryId)
          .single();
        
        if (categoryError) {
          logger.error('Error fetching category:', categoryError);
          throw new Error(`Kunne ikke hente kategoriinformasjon: ${categoryError.message}`);
        }
        
        logger.log('Category to delete:', categoryData);
        
        // Step 2: Check articles with explicit query
        logger.log('Checking for articles in category...');
        const { data: articlesData, error: articlesError, count: articlesCount } = await supabase
          .from('knowledge_articles')
          .select('id, title, category_id', { count: 'exact', head: true })
          .eq('category_id', categoryId);
        
        if (articlesError) {
          logger.error('Error checking articles:', articlesError);
          throw new Error(`Feil ved sjekk av artikler: ${articlesError.message}`);
        }
        
        logger.log(`Found ${articlesCount} articles:`, articlesData);
        
        if (articlesCount && articlesCount > 0) {
          throw new Error(`Kan ikke slette kategori som inneholder ${articlesCount} artikler. Flytt eller slett artiklene først.`);
        }
        
        // Step 3: Check subcategories with explicit query
        logger.log('Checking for subcategories...');
        const { data: subcategoriesData, error: subcategoriesError, count: subcategoriesCount } = await supabase
          .from('knowledge_categories')
          .select('id, name, parent_category_id', { count: 'exact' })
          .eq('parent_category_id', categoryId);
        
        if (subcategoriesError) {
          logger.error('Error checking subcategories:', subcategoriesError);
          throw new Error(`Feil ved sjekk av underkategorier: ${subcategoriesError.message}`);
        }
        
        logger.log(`Found ${subcategoriesCount} subcategories:`, subcategoriesData);
        
        if (subcategoriesCount && subcategoriesCount > 0) {
          throw new Error(`Kan ikke slette kategori som har ${subcategoriesCount} underkategorier. Flytt eller slett underkategoriene først.`);
        }
        
        // Step 4: Perform the actual deletion
        logger.log(`Category ${categoryId} is empty, proceeding with deletion...`);
        
        const { error: deleteError } = await supabase
          .from('knowledge_categories')
          .delete()
          .eq('id', categoryId);
        
        if (deleteError) {
          logger.error('Delete operation failed:', deleteError);
          throw new Error(`Sletting feilet: ${deleteError.message}`);
        }
        
        logger.log(`Successfully deleted category ${categoryId}`);
        return { success: true, categoryId };
        
      } catch (error) {
        logger.error('Delete process failed:', error);
        throw error;
      }
    },
    onSuccess: (result) => {
      logger.log('Delete mutation successful:', result);
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories-all'] });
      toast.success('Kategori slettet successfully!');
      setSelectedCategory(null);
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      logger.error('Delete mutation error:', error);
      toast.error(`Feil ved sletting: ${error.message}`);
      setIsDeleteDialogOpen(false);
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

  const deleteEmptySubcategoriesMutation = useMutation({
    mutationFn: async (parentCategoryId: string) => {
      logger.log(`Deleting empty subcategories for parent: ${parentCategoryId}`);
      
      const { data: subcategories, error: subcategoriesError } = await supabase
        .from('knowledge_categories')
        .select('id, name')
        .eq('parent_category_id', parentCategoryId);
      
      if (subcategoriesError) throw subcategoriesError;
      if (!subcategories) return 0;
      
      let deletedCount = 0;
      for (const subcat of subcategories) {
        logger.log(`Checking subcategory: ${subcat.name} (${subcat.id})`);
        
        // Check if subcategory has articles
        const { data: articles, error: articlesError } = await supabase
          .from('knowledge_articles')
          .select('id')
          .eq('category_id', subcat.id);
        
        if (articlesError) {
          logger.error(`Error checking articles for category ${subcat.name}:`, articlesError);
          continue;
        }
        
        // Check if subcategory has its own subcategories
        const { data: nestedSubcategories, error: nestedError } = await supabase
          .from('knowledge_categories')
          .select('id')
          .eq('parent_category_id', subcat.id);
        
        if (nestedError) {
          logger.error(`Error checking nested subcategories for ${subcat.name}:`, nestedError);
          continue;
        }
        
        const hasArticles = articles && articles.length > 0;
        const hasNestedCategories = nestedSubcategories && nestedSubcategories.length > 0;
        
        logger.log(`Category ${subcat.name}: articles=${hasArticles}, nested=${hasNestedCategories}`);
        
        // Only delete if truly empty (no articles and no subcategories)
        if (!hasArticles && !hasNestedCategories) {
          logger.log(`Deleting empty category: ${subcat.name}`);
          
          const { error: deleteError } = await supabase
            .from('knowledge_categories')
            .delete()
            .eq('id', subcat.id);
          
          if (deleteError) {
            logger.error(`Error deleting category ${subcat.name}:`, deleteError);
          } else {
            deletedCount++;
            logger.log(`Successfully deleted empty category: ${subcat.name}`);
          }
        } else {
          logger.log(`Skipping category ${subcat.name} - not empty`);
        }
      }
      
      return deletedCount;
    },
    onSuccess: (deletedCount) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories-all'] });
      if (deletedCount > 0) {
        toast.success(`${deletedCount} tomme underkategorier slettet`);
      } else {
        toast.info('Ingen tomme underkategorier funnet');
      }
    },
    onError: (error: Error) => {
      logger.error('Delete empty subcategories error:', error);
      toast.error('Feil ved sletting av underkategorier: ' + error.message);
    }
  });

  const buildCategoryTree = (categories: Category[], parentId: string | null = null): Category[] => {
    return categories
      .filter(cat => cat.parent_category_id === parentId)
      .sort((a, b) => a.display_order - b.display_order)
      .map(cat => ({
        ...cat,
        children: buildCategoryTree(categories, cat.id)
      }));
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategoryTree = (categories: Category[], depth: number = 0) => {
    return categories.map((category) => {
      const hasChildren = category.children && category.children.length > 0;
      const isExpanded = expandedCategories.has(category.id);
      const isSelected = selectedCategory?.id === category.id;
      
      // Count articles in this specific category
      const articlesInCategory = selectedCategory?.id === category.id ? articles.length : 0;
      
      // Check if category is empty (no articles and no subcategories)
      const isEmpty = !hasChildren && articlesInCategory === 0;
      
      return (
        <div key={category.id} className="w-full">
          <div 
            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors hover:bg-accent/50 ${
              isSelected ? 'bg-accent border border-primary/20' : ''
            }`}
            style={{ marginLeft: `${depth * 24}px` }}
            onClick={() => setSelectedCategory(category)}
          >
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCategory(category.id);
                }}
                className="p-1 hover:bg-accent rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            
            {!hasChildren && <div className="w-6" />}
            
            {hasChildren ? (
              <FolderOpen className="h-4 w-4 text-blue-600" />
            ) : (
              <Folder className="h-4 w-4 text-gray-500" />
            )}
            
            <span className={`flex-1 ${isSelected ? 'font-semibold text-primary' : ''}`}>
              {category.name}
            </span>
            
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                {category.display_order}
              </Badge>
              {isEmpty && (
                <Badge variant="secondary" className="text-xs text-orange-600">
                  Tom
                </Badge>
              )}
            </div>
          </div>
          
          {hasChildren && isExpanded && (
            <div className="mt-1">
              {renderCategoryTree(category.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const getSelectedCategoryDetails = () => {
    if (!selectedCategory) return null;
    
    logger.log('Getting details for selected category:', selectedCategory);
    
    const subcategories = categories.filter(c => c.parent_category_id === selectedCategory.id);
    const articlesCount = articles.length;
    const isEmpty = subcategories.length === 0 && articlesCount === 0;
    
    logger.log(`Selected category details:`, {
      id: selectedCategory.id,
      name: selectedCategory.name,
      subcategoriesCount: subcategories.length,
      articlesCount,
      isEmpty,
      canDelete: isEmpty
    });
    
    // Count empty subcategories (no articles and no nested subcategories)
    const emptySubcategories = subcategories.filter(sub => {
      const hasNestedSubcategories = categories.some(c => c.parent_category_id === sub.id);
      return !hasNestedSubcategories;
    });
    
    const hasEmptySubcategories = emptySubcategories.length > 0;
    
    return {
      subcategories,
      articlesCount,
      isEmpty,
      hasEmptySubcategories,
      emptySubcategoriesCount: emptySubcategories.length,
      canDelete: isEmpty
    };
  };

  if (isLoading) {
    return <div className="p-6">Laster kategorier...</div>;
  }

  const categoryTree = buildCategoryTree(categories);
  const flatCategories = categories.filter(cat => cat.id !== selectedCategory?.id);
  const selectedDetails = getSelectedCategoryDetails();

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
        <CardContent className="space-y-2">
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Hovedkategorier</h4>
            <p className="text-sm text-blue-700">
              1. Revisjon • 2. Regnskap • 3. Skatt • 4. Annet
            </p>
          </div>
          
          <div className="space-y-1">
            {renderCategoryTree(categoryTree)}
          </div>
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
                  onClick={() => {
                    logger.log('Delete button clicked for category:', selectedCategory);
                    const details = getSelectedCategoryDetails();
                    logger.log('Can delete?', details?.canDelete);
                    if (details?.canDelete) {
                      setIsDeleteDialogOpen(true);
                    } else {
                      toast.error('Kategorien kan ikke slettes fordi den ikke er tom');
                    }
                  }}
                  disabled={!selectedDetails?.canDelete}
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
                
                {selectedDetails && (
                  <>
                    <div>
                      <Label className="font-semibold">Statistikk</Label>
                      <div className="space-y-1 text-sm">
                        <p>Artikler: {selectedDetails.articlesCount}</p>
                        <p>Underkategorier: {selectedDetails.subcategories.length}</p>
                        <p>Status: {selectedDetails.isEmpty ? 'Tom' : 'Inneholder data'}</p>
                      </div>
                    </div>
                    
                    {selectedDetails.hasEmptySubcategories && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <h4 className="font-medium text-orange-900 mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Tomme underkategorier funnet
                        </h4>
                        <p className="text-sm text-orange-700 mb-3">
                          Denne kategorien har {selectedDetails.emptySubcategoriesCount} underkategorier som kan være tomme.
                        </p>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => deleteEmptySubcategoriesMutation.mutate(selectedCategory.id)}
                          disabled={deleteEmptySubcategoriesMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {deleteEmptySubcategoriesMutation.isPending ? 'Sletter...' : 'Slett tomme underkategorier'}
                        </Button>
                      </div>
                    )}
                    
                    {!selectedDetails.canDelete && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">
                          Kategorien kan ikke slettes fordi den inneholder artikler eller underkategorier.
                        </p>
                      </div>
                    )}
                  </>
                )}
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

      {/* Enhanced Delete Dialog */}
      {selectedCategory && selectedDetails && (
        <ConfirmDeleteDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={() => {
            logger.log('Confirm delete clicked for category:', selectedCategory.id);
            deleteCategoryMutation.mutate(selectedCategory.id);
          }}
          title="Slett kategori"
          itemName={selectedCategory.name}
          itemType="kategori"
          usageCount={selectedDetails.articlesCount + selectedDetails.subcategories.length}
          consequences={[
            ...(selectedDetails.articlesCount > 0 ? [`${selectedDetails.articlesCount} artikler vil miste sin kategori`] : []),
            ...(selectedDetails.subcategories.length > 0 ? [`${selectedDetails.subcategories.length} underkategorier må flyttes eller slettes først`] : []),
            'Handlingen kan ikke angres'
          ]}
        />
      )}
    </div>
  );
};

const CategoryForm = ({ 
  category, 
  onSubmit, 
  onCancel, 
  categories
}: {
  category?: Category;
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  categories: Category[];
}) => {
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

const MoveArticlesForm = ({ 
  fromCategory, 
  categories, 
  onSubmit 
}: {
  fromCategory: Category;
  categories: Category[];
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
