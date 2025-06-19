import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeCategory } from '@/types/knowledge';
import { toast } from 'sonner';
import ConfirmDeleteDialog from '../ConfirmDeleteDialog';
import CategoryTree from './CategoryTree';
import CategoryDetails from './CategoryDetails';
import CategoryForm from './CategoryForm';
import BulkDeleteDialog from './BulkDeleteDialog';
import MoveArticlesForm from './MoveArticlesForm';

const CategoryManager = () => {
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | null>(null);
  const [editingCategory, setEditingCategory] = useState<KnowledgeCategory | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading, refetch: refetchCategories } = useQuery({
    queryKey: ['knowledge-categories-all'],
    queryFn: async () => {
      console.log('=== FETCHING ALL CATEGORIES ===');
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('*')
        .order('display_order');
      
      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
      
      console.log('Fetched categories:', data?.length || 0, 'categories');
      console.log('Categories data:', data);
      return data as KnowledgeCategory[];
    }
  });

  const { data: articles = [] } = useQuery({
    queryKey: ['articles-by-category', selectedCategory?.id],
    queryFn: async () => {
      if (!selectedCategory?.id) return [];
      
      console.log(`=== FETCHING ARTICLES FOR CATEGORY: ${selectedCategory.id} ===`);
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('id, title, status, tags, category_id')
        .eq('category_id', selectedCategory.id);
      
      if (error) {
        console.error('Error fetching articles:', error);
        throw error;
      }
      
      console.log(`Fetched ${data?.length || 0} articles for category ${selectedCategory.id}`);
      return data;
    },
    enabled: !!selectedCategory?.id
  });

  // Enhanced cache invalidation helper
  const invalidateAllCaches = async () => {
    console.log('=== INVALIDATING ALL CACHES ===');
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories-all'] }),
      queryClient.invalidateQueries({ queryKey: ['articles-by-category'] })
    ]);
    console.log('Cache invalidation complete');
  };

  const updateCategoryMutation = useMutation({
    mutationFn: async (category: Partial<KnowledgeCategory> & { id: string }) => {
      console.log('=== STARTING CATEGORY UPDATE ===');
      console.log('Update data:', category);
      
      const cleanCategory = {
        name: category.name,
        description: category.description,
        parent_category_id: category.parent_category_id === 'none' ? null : category.parent_category_id,
        display_order: category.display_order,
        icon: category.icon,
        applicable_phases: category.applicable_phases as ("engagement" | "planning" | "execution" | "conclusion")[] | null
      };

      console.log('Clean category data for update:', cleanCategory);

      const { data, error } = await supabase
        .from('knowledge_categories')
        .update(cleanCategory)
        .eq('id', category.id)
        .select()
        .single();
      
      if (error) {
        console.error('Update error:', error);
        throw error;
      }
      
      console.log('Update successful:', data);
      return data;
    },
    onSuccess: async (updatedCategory) => {
      console.log('=== UPDATE SUCCESS ===');
      console.log('Updated category:', updatedCategory);
      
      await invalidateAllCaches();
      toast.success('Kategori oppdatert');
      setEditingCategory(null);
      
      // Update selected category if it was the one being edited
      if (selectedCategory?.id === updatedCategory.id) {
        setSelectedCategory(updatedCategory);
      }
    },
    onError: (error: Error) => {
      console.error('=== UPDATE ERROR ===');
      console.error('Update category error:', error);
      toast.error(`Feil ved oppdatering: ${error.message}`);
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (category: Omit<KnowledgeCategory, 'id' | 'created_at' | 'updated_at'>) => {
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
    onSuccess: async () => {
      await invalidateAllCaches();
      toast.success('Kategori opprettet');
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      console.error('Create category error:', error);
      toast.error(`Feil ved opprettelse: ${error.message}`);
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      console.log(`=== STARTING SIMPLE DELETE FOR CATEGORY: ${categoryId} ===`);
      
      const { error, count } = await supabase
        .from('knowledge_categories')
        .delete({ count: 'exact' })
        .eq('id', categoryId);
      
      if (error) {
        console.error('Delete operation failed:', error);
        throw new Error(`Sletting feilet: ${error.message}`);
      }
      
      console.log(`Delete successful: ${count || 0} rows deleted`);
      return { success: true, categoryId, deletedCount: count || 0 };
    },
    onSuccess: async (result) => {
      console.log('=== DELETE SUCCESS ===');
      console.log('Delete result:', result);
      
      // Simple cache refresh
      await queryClient.invalidateQueries({ queryKey: ['knowledge-categories-all'] });
      await queryClient.invalidateQueries({ queryKey: ['articles-by-category'] });
      
      toast.success('Kategori slettet!');
      
      // Clear selected category if it was deleted
      if (selectedCategory?.id === result.categoryId) {
        setSelectedCategory(null);
      }
      
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      console.error('Delete mutation error:', error);
      toast.error(`Feil ved sletting: ${error.message}`);
      setIsDeleteDialogOpen(false);
    }
  });

  const moveArticlesMutation = useMutation({
    mutationFn: async ({ fromCategoryId, toCategoryId }: { fromCategoryId: string; toCategoryId: string }) => {
      console.log(`Moving articles from ${fromCategoryId} to ${toCategoryId}`);
      const { error, count } = await supabase
        .from('knowledge_articles')
        .update({ category_id: toCategoryId })
        .eq('category_id', fromCategoryId)
        .select('id', { count: 'exact' });
      
      if (error) throw error;
      console.log(`Moved ${count || 0} articles`);
      return { movedCount: count || 0 };
    },
    onSuccess: async (result) => {
      await invalidateAllCaches();
      toast.success(`${result.movedCount} artikler flyttet`);
      setIsMoveDialogOpen(false);
    },
    onError: (error: Error) => {
      console.error('Move articles error:', error);
      toast.error(`Feil ved flytting: ${error.message}`);
    }
  });

  const deleteEmptySubcategoriesMutation = useMutation({
    mutationFn: async (parentCategoryId: string) => {
      console.log(`=== DELETING EMPTY SUBCATEGORIES FOR PARENT: ${parentCategoryId} ===`);
      
      // Get all subcategories
      const { data: subcategories, error: subcategoriesError } = await supabase
        .from('knowledge_categories')
        .select('id, name')
        .eq('parent_category_id', parentCategoryId);
      
      if (subcategoriesError) throw subcategoriesError;
      if (!subcategories || subcategories.length === 0) {
        console.log('No subcategories found');
        return 0;
      }
      
      console.log(`Found ${subcategories.length} subcategories to check:`, subcategories);
      
      let deletedCount = 0;
      const emptyCategories: string[] = [];
      
      // Check each subcategory
      for (const subcat of subcategories) {
        console.log(`Checking subcategory: ${subcat.name} (${subcat.id})`);
        
        // Check for articles
        const { data: articles, error: articlesError, count: articlesCount } = await supabase
          .from('knowledge_articles')
          .select('id', { count: 'exact' })
          .eq('category_id', subcat.id);
        
        if (articlesError) {
          console.error(`Error checking articles for ${subcat.name}:`, articlesError);
          continue;
        }
        
        // Check for nested subcategories
        const { data: nestedSubs, error: nestedError, count: nestedCount } = await supabase
          .from('knowledge_categories')
          .select('id', { count: 'exact' })
          .eq('parent_category_id', subcat.id);
        
        if (nestedError) {
          console.error(`Error checking nested categories for ${subcat.name}:`, nestedError);
          continue;
        }
        
        const isEmpty = (articlesCount || 0) === 0 && (nestedCount || 0) === 0;
        console.log(`Category ${subcat.name}: articles=${articlesCount || 0}, nested=${nestedCount || 0}, isEmpty=${isEmpty}`);
        
        if (isEmpty) {
          emptyCategories.push(subcat.id);
        }
      }
      
      // Delete all empty categories in batch
      if (emptyCategories.length > 0) {
        console.log(`Deleting ${emptyCategories.length} empty categories:`, emptyCategories);
        
        const { error: deleteError, count: actualDeleted } = await supabase
          .from('knowledge_categories')
          .delete({ count: 'exact' })
          .in('id', emptyCategories);
        
        if (deleteError) {
          console.error('Batch delete error:', deleteError);
          throw deleteError;
        }
        
        deletedCount = actualDeleted || 0;
        console.log(`Successfully deleted ${deletedCount} empty categories`);
      }
      
      return deletedCount;
    },
    onSuccess: async (deletedCount) => {
      console.log('=== BATCH DELETE SUCCESS ===');
      await queryClient.invalidateQueries({ queryKey: ['knowledge-categories-all'] });
      await queryClient.invalidateQueries({ queryKey: ['articles-by-category'] });
      
      if (deletedCount > 0) {
        toast.success(`${deletedCount} tomme underkategorier slettet`);
      } else {
        toast.info('Ingen tomme underkategorier funnet');
      }
    },
    onError: (error: Error) => {
      console.error('Delete empty subcategories error:', error);
      toast.error(`Feil ved sletting av underkategorier: ${error.message}`);
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      console.log(`=== STARTING BULK DELETE PROCESS FOR CATEGORY: ${categoryId} ===`);
      
      try {
        // Get category details
        const { data: categoryData, error: categoryError } = await supabase
          .from('knowledge_categories')
          .select('id, name, parent_category_id')
          .eq('id', categoryId)
          .single();
        
        if (categoryError) throw new Error(`Failed to get category: ${categoryError.message}`);
        
        // Get all subcategory IDs recursively
        const subcategoryIds = getSubcategoryIds(categoryId);
        const allCategoryIds = [categoryId, ...subcategoryIds];
        
        console.log(`Will delete categories: ${allCategoryIds.length} total`);
        console.log('Category IDs:', allCategoryIds);
        
        // Delete all articles in these categories
        const { error: articlesError, count: articlesDeleted } = await supabase
          .from('knowledge_articles')
          .delete({ count: 'exact' })
          .in('category_id', allCategoryIds);
        
        if (articlesError) throw new Error(`Failed to delete articles: ${articlesError.message}`);
        
        console.log(`Deleted ${articlesDeleted || 0} articles`);
        
        // Delete all categories (subcategories first, then parent)
        const { error: categoriesError, count: categoriesDeleted } = await supabase
          .from('knowledge_categories')
          .delete({ count: 'exact' })
          .in('id', allCategoryIds);
        
        if (categoriesError) throw new Error(`Failed to delete categories: ${categoriesError.message}`);
        
        console.log(`Deleted ${categoriesDeleted || 0} categories`);
        
        return { 
          success: true, 
          articlesDeleted: articlesDeleted || 0,
          categoriesDeleted: categoriesDeleted || 0
        };
        
      } catch (error) {
        console.error('Bulk delete process failed:', error);
        throw error;
      }
    },
    onSuccess: async (result) => {
      await invalidateAllCaches();
      toast.success(`Bulk delete completed: ${result.categoriesDeleted} kategorier og ${result.articlesDeleted} artikler slettet`);
      setSelectedCategory(null);
      setIsBulkDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      console.error('Bulk delete mutation error:', error);
      toast.error(`Feil ved bulk sletting: ${error.message}`);
      setIsBulkDeleteDialogOpen(false);
    }
  });

  const getSubcategoryIds = (parentId: string): string[] => {
    const subcategories = categories.filter(c => c.parent_category_id === parentId);
    let allIds: string[] = [];
    
    subcategories.forEach(sub => {
      allIds.push(sub.id);
      allIds = [...allIds, ...getSubcategoryIds(sub.id)];
    });
    
    return allIds;
  };

  const buildCategoryTree = (categories: KnowledgeCategory[], parentId: string | null = null): KnowledgeCategory[] => {
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

  const getSelectedCategoryDetails = () => {
    if (!selectedCategory) return null;
    
    console.log('Getting details for selected category:', selectedCategory);
    
    const subcategories = categories.filter(c => c.parent_category_id === selectedCategory.id);
    const articlesCount = articles.length;
    const isEmpty = subcategories.length === 0 && articlesCount === 0;
    
    console.log(`Selected category details:`, {
      id: selectedCategory.id,
      name: selectedCategory.name,
      subcategoriesCount: subcategories.length,
      articlesCount,
      isEmpty,
      canDelete: isEmpty
    });
    
    // Count empty subcategories
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

  const handleManualRefresh = async () => {
    console.log('=== MANUAL REFRESH TRIGGERED ===');
    toast.info('Oppdaterer kategorier...');
    
    try {
      await queryClient.removeQueries({ queryKey: ['knowledge-categories-all'] });
      await queryClient.removeQueries({ queryKey: ['articles-by-category'] });
      await invalidateAllCaches();
      await refetchCategories();
      toast.success('Kategorier oppdatert');
    } catch (error) {
      console.error('Manual refresh error:', error);
      toast.error('Feil ved oppdatering');
    }
  };

  const handleDeleteEmptySubcategories = () => {
    if (!selectedCategory) return;
    deleteEmptySubcategoriesMutation.mutate(selectedCategory.id);
  };

  if (isLoading) {
    return <div className="p-6">Laster kategorier...</div>;
  }

  const flatCategories = categories.filter(cat => cat.id !== selectedCategory?.id);
  const selectedDetails = getSelectedCategoryDetails();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      {/* Category Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Kategoristruktur</span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleManualRefresh}
                disabled={deleteCategoryMutation.isPending || deleteEmptySubcategoriesMutation.isPending}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Oppdater
              </Button>
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
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Hovedkategorier</h4>
            <p className="text-sm text-blue-700">
              1. Revisjon • 2. Regnskap • 3. Skatt • 4. Annet
            </p>
          </div>
          
          <div className="mb-2 text-sm text-muted-foreground flex items-center gap-2">
            <span>Totalt: {categories.length} kategorier</span>
            {(deleteCategoryMutation.isPending || deleteEmptySubcategoriesMutation.isPending || updateCategoryMutation.isPending) && (
              <div className="flex items-center gap-1 text-orange-600">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span className="text-xs">
                  {updateCategoryMutation.isPending ? 'Oppdaterer...' : 
                   deleteCategoryMutation.isPending ? 'Sletter...' : 'Sletter tomme...'}
                </span>
              </div>
            )}
          </div>
          
          <CategoryTree
            categories={categories}
            selectedCategory={selectedCategory}
            expandedCategories={expandedCategories}
            articlesCount={articles.length}
            onCategorySelect={setSelectedCategory}
            onToggleCategory={toggleCategory}
          />
        </CardContent>
      </Card>

      {/* Category Details */}
      <Card>
        <CardHeader>
          <CardTitle>Kategoridetails</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryDetails
            selectedCategory={selectedCategory}
            categories={categories}
            articles={articles}
            editingCategory={editingCategory}
            onEdit={setEditingCategory}
            onDelete={() => {
              console.log('Delete button clicked for category:', selectedCategory);
              const details = getSelectedCategoryDetails();
              console.log('Can delete?', details?.canDelete);
              if (details?.canDelete) {
                setIsDeleteDialogOpen(true);
              } else {
                toast.error('Kategorien kan ikke slettes fordi den ikke er tom');
              }
            }}
            onDeleteEmptySubcategories={handleDeleteEmptySubcategories}
            onMoveArticles={() => setIsMoveDialogOpen(true)}
            isDeleting={deleteCategoryMutation.isPending}
            isDeletingEmpty={deleteEmptySubcategoriesMutation.isPending}
          >
            {editingCategory ? (
              <CategoryForm 
                category={editingCategory}
                onSubmit={(data) => {
                  console.log('=== FORM SUBMIT TRIGGERED ===');
                  console.log('Form data:', data);
                  console.log('Editing category ID:', editingCategory.id);
                  updateCategoryMutation.mutate({ ...data, id: editingCategory.id });
                }}
                onCancel={() => setEditingCategory(null)}
                categories={flatCategories}
              />
            ) : null}
          </CategoryDetails>

          {selectedCategory && selectedDetails && selectedDetails.subcategories.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setIsBulkDeleteDialogOpen(true)}
                className="w-full"
                disabled={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? 'Sletter...' : 'Slett kategori og alt innhold'}
              </Button>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Sletter kategorien, alle underkategorier og artikler
              </p>
            </div>
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

      {/* Move Articles Dialog */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flytt artikler</DialogTitle>
          </DialogHeader>
          {selectedCategory && (
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
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialogs */}
      {selectedCategory && selectedDetails && (
        <>
          <ConfirmDeleteDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onConfirm={() => {
              console.log('Confirm delete clicked for category:', selectedCategory.id);
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

          <BulkDeleteDialog
            open={isBulkDeleteDialogOpen}
            onOpenChange={setIsBulkDeleteDialogOpen}
            onConfirm={() => bulkDeleteMutation.mutate(selectedCategory.id)}
            categoryName={selectedCategory.name}
            subcategoriesCount={selectedDetails.subcategories.length}
            articlesCount={selectedDetails.articlesCount}
          />
        </>
      )}
    </div>
  );
};

export default CategoryManager;
