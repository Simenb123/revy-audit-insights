import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
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
        .select('id, title, status, tags, category_id')
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories-all'] });
      toast.success('Kategori opprettet');
      setIsCreateDialogOpen(false);
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      console.log(`=== STARTING DELETE PROCESS FOR CATEGORY: ${categoryId} ===`);
      
      try {
        // Step 1: Get detailed category info
        const { data: categoryData, error: categoryError } = await supabase
          .from('knowledge_categories')
          .select('id, name, parent_category_id')
          .eq('id', categoryId)
          .single();
        
        if (categoryError) {
          console.error('Error fetching category:', categoryError);
          throw new Error(`Kunne ikke hente kategoriinformasjon: ${categoryError.message}`);
        }
        
        console.log('Category to delete:', categoryData);
        
        // Step 2: Check articles with explicit query
        console.log('Checking for articles in category...');
        const { data: articlesData, error: articlesError, count: articlesCount } = await supabase
          .from('knowledge_articles')
          .select('id, title, category_id', { count: 'exact' })
          .eq('category_id', categoryId);
        
        if (articlesError) {
          console.error('Error checking articles:', articlesError);
          throw new Error(`Feil ved sjekk av artikler: ${articlesError.message}`);
        }
        
        console.log(`Found ${articlesCount} articles:`, articlesData);
        
        if (articlesCount && articlesCount > 0) {
          throw new Error(`Kan ikke slette kategori som inneholder ${articlesCount} artikler. Flytt eller slett artiklene først.`);
        }
        
        // Step 3: Check subcategories with explicit query
        console.log('Checking for subcategories...');
        const { data: subcategoriesData, error: subcategoriesError, count: subcategoriesCount } = await supabase
          .from('knowledge_categories')
          .select('id, name, parent_category_id', { count: 'exact' })
          .eq('parent_category_id', categoryId);
        
        if (subcategoriesError) {
          console.error('Error checking subcategories:', subcategoriesError);
          throw new Error(`Feil ved sjekk av underkategorier: ${subcategoriesError.message}`);
        }
        
        console.log(`Found ${subcategoriesCount} subcategories:`, subcategoriesData);
        
        if (subcategoriesCount && subcategoriesCount > 0) {
          throw new Error(`Kan ikke slette kategori som har ${subcategoriesCount} underkategorier. Flytt eller slett underkategoriene først.`);
        }
        
        // Step 4: Perform the actual deletion
        console.log(`Category ${categoryId} is empty, proceeding with deletion...`);
        
        const { error: deleteError } = await supabase
          .from('knowledge_categories')
          .delete()
          .eq('id', categoryId);
        
        if (deleteError) {
          console.error('Delete operation failed:', deleteError);
          throw new Error(`Sletting feilet: ${deleteError.message}`);
        }
        
        console.log(`Successfully deleted category ${categoryId}`);
        return { success: true, categoryId };
        
      } catch (error) {
        console.error('Delete process failed:', error);
        throw error;
      }
    },
    onSuccess: (result) => {
      console.log('Delete mutation successful:', result);
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories-all'] });
      toast.success('Kategori slettet successfully!');
      setSelectedCategory(null);
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
      console.log(`Deleting empty subcategories for parent: ${parentCategoryId}`);
      
      const { data: subcategories, error: subcategoriesError } = await supabase
        .from('knowledge_categories')
        .select('id, name')
        .eq('parent_category_id', parentCategoryId);
      
      if (subcategoriesError) throw subcategoriesError;
      if (!subcategories) return 0;
      
      let deletedCount = 0;
      for (const subcat of subcategories) {
        console.log(`Checking subcategory: ${subcat.name} (${subcat.id})`);
        
        // Check if subcategory has articles
        const { data: articles, error: articlesError } = await supabase
          .from('knowledge_articles')
          .select('id')
          .eq('category_id', subcat.id);
        
        if (articlesError) {
          console.error(`Error checking articles for category ${subcat.name}:`, articlesError);
          continue;
        }
        
        // Check if subcategory has its own subcategories
        const { data: nestedSubcategories, error: nestedError } = await supabase
          .from('knowledge_categories')
          .select('id')
          .eq('parent_category_id', subcat.id);
        
        if (nestedError) {
          console.error(`Error checking nested subcategories for ${subcat.name}:`, nestedError);
          continue;
        }
        
        const hasArticles = articles && articles.length > 0;
        const hasNestedCategories = nestedSubcategories && nestedSubcategories.length > 0;
        
        console.log(`Category ${subcat.name}: articles=${hasArticles}, nested=${hasNestedCategories}`);
        
        // Only delete if truly empty (no articles and no subcategories)
        if (!hasArticles && !hasNestedCategories) {
          console.log(`Deleting empty category: ${subcat.name}`);
          
          const { error: deleteError } = await supabase
            .from('knowledge_categories')
            .delete()
            .eq('id', subcat.id);
          
          if (deleteError) {
            console.error(`Error deleting category ${subcat.name}:`, deleteError);
          } else {
            deletedCount++;
            console.log(`Successfully deleted empty category: ${subcat.name}`);
          }
        } else {
          console.log(`Skipping category ${subcat.name} - not empty`);
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
      console.error('Delete empty subcategories error:', error);
      toast.error('Feil ved sletting av underkategorier: ' + error.message);
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      console.log(`=== STARTING BULK DELETE PROCESS FOR CATEGORY: ${categoryId} ===`);
      
      try {
        // Step 1: Get detailed category info
        const { data: categoryData, error: categoryError } = await supabase
          .from('knowledge_categories')
          .select('id, name, parent_category_id')
          .eq('id', categoryId)
          .single();
        
        if (categoryError) {
          console.error('Error fetching category:', categoryError);
          throw new Error(`Kunne ikke hente kategoriinformasjon: ${categoryError.message}`);
        }
        
        console.log('Category to bulk delete:', categoryData);
        
        // Step 2: Get all subcategory IDs recursively
        const subcategoryIds = getSubcategoryIds(categoryId);
        console.log(`Subcategory IDs to delete:`, subcategoryIds);
        
        // Step 3: Delete all articles in the category and subcategories
        console.log('Deleting articles in category and subcategories...');
        const { error: articlesError } = await supabase
          .from('knowledge_articles')
          .delete()
          .in('category_id', [categoryId, ...subcategoryIds]);
        
        if (articlesError) {
          console.error('Error deleting articles:', articlesError);
          throw new Error(`Feil ved sletting av artikler: ${articlesError.message}`);
        }
        
        console.log('Articles deleted successfully.');
        
        // Step 4: Delete all subcategories
        console.log('Deleting subcategories...');
        const { error: subcategoriesError } = await supabase
          .from('knowledge_categories')
          .delete()
          .in('id', subcategoryIds);
        
        if (subcategoriesError) {
          console.error('Error deleting subcategories:', subcategoriesError);
          throw new Error(`Feil ved sletting av underkategorier: ${subcategoriesError.message}`);
        }
        
        console.log('Subcategories deleted successfully.');
        
        // Step 5: Delete the main category
        console.log('Deleting main category...');
        const { error: categoryDeleteError } = await supabase
          .from('knowledge_categories')
          .delete()
          .eq('id', categoryId);
        
        if (categoryDeleteError) {
          console.error('Error deleting main category:', categoryDeleteError);
          throw new Error(`Feil ved sletting av hovedkategori: ${categoryDeleteError.message}`);
        }
        
        console.log('Main category deleted successfully.');
        
        console.log(`Successfully bulk deleted category ${categoryId} and all its content.`);
        return { success: true };
        
      } catch (error) {
        console.error('Bulk delete process failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories-all'] });
      queryClient.invalidateQueries({ queryKey: ['articles-by-category'] });
      toast.success('Kategori og alt innhold slettet');
      setSelectedCategory(null);
      setIsBulkDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      console.error('Bulk delete mutation error:', error);
      toast.error(`Feil ved sletting: ${error.message}`);
      setIsBulkDeleteDialogOpen(false);
    }
  });

  const getSubcategoryIds = (parentId: string): string[] => {
    const subcategories = categories.filter(c => c.parent_category_id === parentId);
    let allIds: string[] = [parentId];
    
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
            onDeleteEmptySubcategories={() => deleteEmptySubcategoriesMutation.mutate(selectedCategory.id)}
            onMoveArticles={() => setIsMoveDialogOpen(true)}
          >
            {editingCategory ? (
              <CategoryForm 
                category={editingCategory}
                onSubmit={(data) => updateCategoryMutation.mutate({ ...data, id: editingCategory.id })}
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
              >
                Slett kategori og alt innhold
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
        <DialogTrigger asChild>
          {/* This trigger is hidden */}
        </DialogTrigger>
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
