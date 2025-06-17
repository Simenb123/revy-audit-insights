
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Tags, Plus, Edit, Trash2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

const TagManager = () => {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isAddTagDialogOpen, setIsAddTagDialogOpen] = useState(false);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  
  const queryClient = useQueryClient();

  // Get all unique tags from articles
  const { data: allTags = [] } = useQuery({
    queryKey: ['all-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('tags')
        .eq('status', 'published');
      
      if (error) throw error;
      
      const tagSet = new Set<string>();
      data.forEach(article => {
        if (article.tags) {
          article.tags.forEach(tag => tagSet.add(tag));
        }
      });
      
      return Array.from(tagSet).sort();
    }
  });

  // Get articles with the selected tag
  const { data: articlesWithTag = [] } = useQuery({
    queryKey: ['articles-with-tag', selectedTag],
    queryFn: async () => {
      if (!selectedTag) return [];
      
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('id, title, tags, category:knowledge_categories(name)')
        .contains('tags', [selectedTag])
        .eq('status', 'published');
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTag
  });

  // Get all articles for tag management
  const { data: allArticles = [] } = useQuery({
    queryKey: ['all-articles-for-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('id, title, tags, category:knowledge_categories(name)')
        .eq('status', 'published');
      
      if (error) throw error;
      return data;
    }
  });

  const addTagToArticlesMutation = useMutation({
    mutationFn: async ({ tag, articleIds }: { tag: string; articleIds: string[] }) => {
      for (const articleId of articleIds) {
        const article = allArticles.find(a => a.id === articleId);
        if (article) {
          const currentTags = article.tags || [];
          if (!currentTags.includes(tag)) {
            const newTags = [...currentTags, tag];
            const { error } = await supabase
              .from('knowledge_articles')
              .update({ tags: newTags })
              .eq('id', articleId);
            
            if (error) throw error;
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tags'] });
      queryClient.invalidateQueries({ queryKey: ['articles-with-tag'] });
      queryClient.invalidateQueries({ queryKey: ['all-articles-for-tags'] });
      toast.success('Tag lagt til artikler');
      setIsAddTagDialogOpen(false);
      setSelectedArticles([]);
    }
  });

  const removeTagFromArticleMutation = useMutation({
    mutationFn: async ({ tag, articleId }: { tag: string; articleId: string }) => {
      const article = allArticles.find(a => a.id === articleId);
      if (article && article.tags) {
        const newTags = article.tags.filter(t => t !== tag);
        const { error } = await supabase
          .from('knowledge_articles')
          .update({ tags: newTags })
          .eq('id', articleId);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tags'] });
      queryClient.invalidateQueries({ queryKey: ['articles-with-tag'] });
      queryClient.invalidateQueries({ queryKey: ['all-articles-for-tags'] });
      toast.success('Tag fjernet fra artikkel');
    }
  });

  const standardizeTags = async () => {
    toast.info('Starter tag-standardisering...');
    
    const standardMappings = {
      // ISA standards
      'isa 230': 'ISA 230',
      'ISA230': 'ISA 230',
      'dokumentasjon': 'ISA 230',
      'revisjonsdokumentasjon': 'ISA 230',
      
      'isa 240': 'ISA 240',
      'misligheter': 'ISA 240',
      'svindel': 'ISA 240',
      
      'isa 315': 'ISA 315',
      'risikovurdering': 'ISA 315',
      'risiko': 'risiko',
      
      'isa 320': 'ISA 320',
      'vesentlighet': 'ISA 320',
      'materialitet': 'ISA 320',
      
      'isa 330': 'ISA 330',
      'responshandlinger': 'ISA 330',
      
      'isa 500': 'ISA 500',
      'revisjonsbevis': 'ISA 500',
      
      'isa 520': 'ISA 520',
      'analytiske handlinger': 'ISA 520',
      
      'isa 700': 'ISA 700',
      'revisjonsberetning': 'ISA 700',
      
      // Common revision terms
      'revisjon': 'revisjon',
      'kontroll': 'internkontroll',
      'internkontroll': 'internkontroll',
      'planlegging': 'planlegging',
      'gjennomføring': 'gjennomføring',
      'avslutning': 'avslutning',
      'kvalitet': 'kvalitetskontroll',
      'kvalitetskontroll': 'kvalitetskontroll',
      'etikk': 'etikk',
      'uavhengighet': 'uavhengighet'
    };

    let updatedCount = 0;
    
    for (const article of allArticles) {
      if (article.tags && article.tags.length > 0) {
        const standardizedTags = article.tags.map(tag => {
          const lowerTag = tag.toLowerCase();
          return standardMappings[lowerTag] || tag;
        });
        
        // Remove duplicates and sort
        const uniqueTags = Array.from(new Set(standardizedTags)).sort();
        
        if (JSON.stringify(uniqueTags) !== JSON.stringify(article.tags)) {
          const { error } = await supabase
            .from('knowledge_articles')
            .update({ tags: uniqueTags })
            .eq('id', article.id);
          
          if (error) {
            console.error('Error updating tags for article:', article.id, error);
          } else {
            updatedCount++;
          }
        }
      }
    }
    
    queryClient.invalidateQueries({ queryKey: ['all-tags'] });
    queryClient.invalidateQueries({ queryKey: ['articles-with-tag'] });
    queryClient.invalidateQueries({ queryKey: ['all-articles-for-tags'] });
    
    toast.success(`Standardiserte tags for ${updatedCount} artikler`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Tag Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Tags className="h-5 w-5" />
              Tag-oversikt
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={standardizeTags}>
                <Wand2 className="h-4 w-4 mr-1" />
                Standardiser
              </Button>
              <Dialog open={isAddTagDialogOpen} onOpenChange={setIsAddTagDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Legg til tag
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Legg til tag til artikler</DialogTitle>
                  </DialogHeader>
                  <AddTagForm 
                    articles={allArticles}
                    onSubmit={(data) => addTagToArticlesMutation.mutate(data)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {allTags.map((tag) => {
              const articleCount = allArticles.filter(article => 
                article.tags && article.tags.includes(tag)
              ).length;
              
              return (
                <div 
                  key={tag}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                    selectedTag === tag ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedTag(tag)}
                >
                  <Badge variant={selectedTag === tag ? "secondary" : "outline"}>
                    {tag}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {articleCount} artikkel{articleCount !== 1 ? 'er' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Articles with Selected Tag */}
      <Card>
        <CardHeader>
          <CardTitle>
            Artikler med tag{selectedTag && `: "${selectedTag}"`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedTag ? (
            articlesWithTag.length > 0 ? (
              <div className="space-y-3">
                {articlesWithTag.map((article) => (
                  <div key={article.id} className="p-3 border rounded">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{article.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Kategori: {article.category?.name || 'Ingen kategori'}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {article.tags?.map((tag) => (
                            <Badge 
                              key={tag} 
                              variant={tag === selectedTag ? "default" : "outline"}
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeTagFromArticleMutation.mutate({
                          tag: selectedTag,
                          articleId: article.id
                        })}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Ingen artikler funnet med denne tag-en</p>
            )
          ) : (
            <p className="text-muted-foreground">Velg en tag for å se relaterte artikler</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const AddTagForm = ({ 
  articles, 
  onSubmit 
}: {
  articles: any[];
  onSubmit: (data: { tag: string; articleIds: string[] }) => void;
}) => {
  const [tag, setTag] = useState('');
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tag && selectedArticles.length > 0) {
      onSubmit({ tag, articleIds: selectedArticles });
    }
  };

  const toggleArticle = (articleId: string) => {
    setSelectedArticles(prev => 
      prev.includes(articleId) 
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="tag">Tag</Label>
        <Input
          id="tag"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="f.eks. ISA 230, risiko, internkontroll"
          required
        />
      </div>
      
      <div>
        <Label>Velg artikler</Label>
        <div className="max-h-64 overflow-y-auto border rounded p-2 space-y-2">
          {articles.map((article) => (
            <div key={article.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={article.id}
                checked={selectedArticles.includes(article.id)}
                onChange={() => toggleArticle(article.id)}
                className="rounded"
              />
              <label 
                htmlFor={article.id} 
                className="text-sm cursor-pointer flex-1"
              >
                {article.title}
                <span className="text-muted-foreground ml-2">
                  ({article.category?.name || 'Ingen kategori'})
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={!tag || selectedArticles.length === 0}
      >
        Legg til tag ({selectedArticles.length} artikler)
      </Button>
    </form>
  );
};

export default TagManager;
