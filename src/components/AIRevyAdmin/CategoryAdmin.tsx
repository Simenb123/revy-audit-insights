import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { FolderTree, Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeCategory } from '@/types/knowledge';
import { toast } from 'sonner';
import CategoryForm from '@/components/Knowledge/CategoryManager/CategoryForm';
import CategoryTree from '@/components/Knowledge/CategoryManager/CategoryTree';
import ConfirmDeleteDialog from '@/components/Knowledge/ConfirmDeleteDialog';

const CategoryAdmin = () => {
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | null>(null);
  const [editingCategory, setEditingCategory] = useState<KnowledgeCategory | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
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
        .select('id, title, status, category_id')
        .eq('category_id', selectedCategory.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCategory?.id
  });

  const createCategory = useMutation({
    mutationFn: async (data: Omit<KnowledgeCategory, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('knowledge_categories').insert({
        name: data.name,
        description: data.description,
        parent_category_id: data.parent_category_id === 'none' ? null : data.parent_category_id,
        display_order: data.display_order,
        icon: data.icon
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories-all'] });
      toast.success('Kategori opprettet');
      setCreateOpen(false);
    },
    onError: (err: any) => toast.error('Feil ved opprettelse: ' + err.message)
  });

  const updateCategory = useMutation({
    mutationFn: async (updates: Partial<KnowledgeCategory> & { id: string }) => {
      const { error } = await supabase
        .from('knowledge_categories')
        .update({
          name: updates.name,
          description: updates.description,
          parent_category_id: updates.parent_category_id === 'none' ? null : updates.parent_category_id,
          display_order: updates.display_order,
          icon: updates.icon
        })
        .eq('id', updates.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories-all'] });
      toast.success('Kategori oppdatert');
      setEditingCategory(null);
    },
    onError: (err: any) => toast.error('Feil ved oppdatering: ' + err.message)
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('knowledge_categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-categories-all'] });
      toast.success('Kategori slettet');
      setSelectedCategory(null);
      setDeleteOpen(false);
    },
    onError: (err: any) => toast.error('Feil ved sletting: ' + err.message)
  });

  const toggleCategory = (id: string) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedCategories(newSet);
  };

  if (isLoading) {
    return <div>Laster kategorier...</div>;
  }

  const flatCategories = categories;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Kategoriadministrasjon
            </span>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ny kategori
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Opprett ny kategori</DialogTitle>
                </DialogHeader>
                <CategoryForm onSubmit={(d) => createCategory.mutate(d)} categories={flatCategories} />
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="structure" className="w-full">
            <TabsList>
              <TabsTrigger value="structure">Struktur</TabsTrigger>
              <TabsTrigger value="bulk-operations">Bulk Operasjoner</TabsTrigger>
              <TabsTrigger value="import-export">Import/Export</TabsTrigger>
            </TabsList>
            <TabsContent value="structure" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Kategoritre</h3>
                  <div className="border rounded-lg p-4 space-y-2 max-h-96 overflow-y-auto">
                    <CategoryTree
                      categories={flatCategories}
                      selectedCategory={selectedCategory}
                      expandedCategories={expandedCategories}
                      articlesCount={articles.length}
                      onCategorySelect={setSelectedCategory}
                      onToggleCategory={toggleCategory}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Kategoridetails</h3>
                  {selectedCategory ? (
                    editingCategory ? (
                      <CategoryForm
                        category={editingCategory}
                        onSubmit={(d) => updateCategory.mutate({ ...d, id: editingCategory.id })}
                        onCancel={() => setEditingCategory(null)}
                        categories={flatCategories.filter(c => c.id !== editingCategory.id)}
                      />
                    ) : (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            {selectedCategory.name}
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => setEditingCategory(selectedCategory)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => setDeleteOpen(true)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="font-semibold">Beskrivelse</Label>
                            <p className="text-sm text-muted-foreground">
                              {selectedCategory.description || 'Ingen beskrivelse'}
                            </p>
                          </div>
                          <div>
                            <Label className="font-semibold">Sortering</Label>
                            <p className="text-sm">{selectedCategory.display_order}</p>
                          </div>
                          <div>
                            <Label className="font-semibold">Ikon</Label>
                            <p className="text-sm">{selectedCategory.icon || 'Standard'}</p>
                          </div>
                          <div>
                            <Label className="font-semibold">Artikler</Label>
                            <p className="text-sm">{articles.length}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  ) : (
                    <Card>
                      <CardContent className="p-6 text-center text-muted-foreground">
                        Velg en kategori for å se detaljer
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="bulk-operations" className="space-y-4">
              <BulkOperationsPanel />
            </TabsContent>
            <TabsContent value="import-export" className="space-y-4">
              <ImportExportPanel />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {selectedCategory && (
        <ConfirmDeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={() => deleteCategory.mutate(selectedCategory.id)}
          title="Slett kategori"
          itemName={selectedCategory.name}
          itemType="kategori"
        />
      )}
    </div>
  );
};

const BulkOperationsPanel = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Bulk Operasjoner</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bulk Redigering</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full">
              Oppdater Sorteringsrekkefølge
            </Button>
            <Button variant="outline" className="w-full">
              Endre Overordnet Kategori
            </Button>
            <Button variant="outline" className="w-full">
              Oppdater Ikoner
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bulk Sletting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full">
              Slett Tomme Kategorier
            </Button>
            <Button variant="destructive" className="w-full">
              Slett Valgte Kategorier
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ImportExportPanel = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Import/Export</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full">
              Eksporter til Excel
            </Button>
            <Button variant="outline" className="w-full">
              Eksporter til JSON
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full">
              Importer fra Excel
            </Button>
            <Button variant="outline" className="w-full">
              Importer fra JSON
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CategoryAdmin;
