
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Copy, Trash2, Move } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

interface Article {
  id: string;
  category_id: string;
  title: string;
  content: string;
  created_at: string;
}

const CategoryManager = () => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [moveToCategory, setMoveToCategory] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Category[];
    }
  });

  const { data: articles = [], isLoading: isArticlesLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*');

      if (error) throw error;
      return data as Article[];
    }
  });

  const createCategory = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from('knowledge_categories')
        .insert({ name: name, description: newCategoryDescription });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setNewCategoryName('');
      setNewCategoryDescription('');
      toast.success("Kategori opprettet", {
        description: "Ny kategori ble lagt til."
      });
    },
    onError: (error: any) => {
      toast.error("Feil ved opprettelse", {
        description: error.message
      });
    }
  });

  const deleteArticle = useMutation({
    mutationFn: async (articleId: string) => {
      const { error } = await supabase
        .from('knowledge_articles')
        .delete()
        .eq('id', articleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success("Artikkel slettet", {
        description: "Artikkelen ble fjernet."
      });
    },
    onError: (error: any) => {
      toast.error("Feil ved sletting", {
        description: error.message
      });
    }
  });

  const moveArticles = useMutation({
    mutationFn: async ({ articleIds, targetCategoryId }: { articleIds: string[], targetCategoryId: string }) => {
      const { error } = await supabase
        .from('knowledge_articles')
        .update({ category_id: targetCategoryId })
        .in('id', articleIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success("Artikler flyttet", {
        description: `${selectedArticles.length} artikler ble flyttet til ny kategori.`
      });
      setSelectedArticles([]);
      setMoveToCategory(null);
    },
    onError: (error: any) => {
      toast.error("Feil ved flytting", {
        description: error.message
      });
    }
  });

  const deleteCategory = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from('knowledge_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success("Kategori slettet", {
        description: "Kategorien ble fjernet."
      });
    },
    onError: (error: any) => {
      toast.error("Feil ved sletting", {
        description: error.message
      });
    }
  });

  const handleSelectArticle = (articleId: string) => {
    setSelectedArticles(prev => {
      if (prev.includes(articleId)) {
        return prev.filter(id => id !== articleId);
      } else {
        return [...prev, articleId];
      }
    });
  };

  const handleSelectAllArticles = () => {
    if (selectedArticles.length === articles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(articles.map(article => article.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedArticles.length === 0) return;

    const confirmed = window.confirm(`Er du sikker på at du vil slette ${selectedArticles.length} artikler?`);
    if (!confirmed) return;

    for (const articleId of selectedArticles) {
      await deleteArticle.mutateAsync(articleId);
    }

    setSelectedArticles([]);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const confirmed = window.confirm(`Er du sikker på at du vil slette denne kategorien?`);
    if (!confirmed) return;

    await deleteCategory.mutateAsync(categoryId);
  };

  const handleMoveArticles = () => {
    if (selectedArticles.length === 0 || !moveToCategory) return;
    
    moveArticles.mutate({
      articleIds: selectedArticles,
      targetCategoryId: moveToCategory
    });
  };

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Kategorier</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Ny kategori"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <Input
                type="text"
                placeholder="Beskrivelse (valgfritt)"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
              />
              <Button onClick={() => createCategory.mutate(newCategoryName)} disabled={createCategory.isPending}>
                Opprett
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Navn</TableHead>
                  <TableHead>Beskrivelse</TableHead>
                  <TableHead className="text-right">Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.description}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Slett
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Artikler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">
                    <Checkbox
                      checked={selectedArticles.length === articles.length && articles.length > 0}
                      onCheckedChange={handleSelectAllArticles}
                    />
                  </TableHead>
                  <TableHead>Tittel</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="w-[100px]">
                      <Checkbox
                        checked={selectedArticles.includes(article.id)}
                        onCheckedChange={() => handleSelectArticle(article.id)}
                      />
                    </TableCell>
                    <TableCell>{article.title}</TableCell>
                    <TableCell>
                      {categories.find(cat => cat.id === article.category_id)?.name || 'Ukategorisert'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => deleteArticle.mutate(article.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Slett
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between p-4">
              <div>
                {selectedArticles.length > 0 && (
                  <p className="text-sm text-gray-500">
                    {selectedArticles.length} artikler valgt
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {selectedArticles.length > 0 && (
                  <>
                    <Select onValueChange={setMoveToCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Flytt til kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleMoveArticles} disabled={!moveToCategory}>
                      <Move className="h-4 w-4 mr-2" />
                      Flytt
                    </Button>
                    <Button variant="destructive" onClick={handleBulkDelete}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Slett alle
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryManager;
