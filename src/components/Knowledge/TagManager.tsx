
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tags, Plus, Trash2, Wand2 } from 'lucide-react';
import createTaxonomyHooks from '@/hooks/knowledge/useTaxonomy';
import { Tag } from '@/hooks/knowledge/useTags';

const { useTaxonomies: useTags } = createTaxonomyHooks<Tag>('tags', 'Tag');
import { useArticleTags, useConnectArticleTag, useDisconnectArticleTag } from '@/hooks/knowledge/useTagConnections';
import { useArticlesWithRelations } from '@/hooks/knowledge/useArticleQueries';

const TagManager = () => {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  const { data: allTags = [] } = useTags();
  const { data: allArticles = [] } = useArticlesWithRelations();
  
  // Get articles that have the selected tag
  const articlesWithSelectedTag = allArticles.filter(article => 
    article.article_tags?.some(tag => tag.id === selectedTag)
  );

  const disconnectTagMutation = useDisconnectArticleTag();

  const handleRemoveTag = (articleId: string, tagId: string) => {
    disconnectTagMutation.mutate({ articleId, tagId });
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {allTags.map((tag) => {
              const articleCount = allArticles.filter(article => 
                article.article_tags?.some(at => at.id === tag.id)
              ).length;
              
              return (
                <div 
                  key={tag.id}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                    selectedTag === tag.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedTag(tag.id)}
                >
                  <Badge 
                    variant={selectedTag === tag.id ? "secondary" : "outline"}
                    style={{ backgroundColor: selectedTag === tag.id ? undefined : tag.color + '20', borderColor: tag.color }}
                  >
                    {tag.display_name}
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
            Artikler med tag{selectedTag && allTags.find(t => t.id === selectedTag) && `: "${allTags.find(t => t.id === selectedTag)?.display_name}"`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedTag ? (
            articlesWithSelectedTag.length > 0 ? (
              <div className="space-y-3">
                {articlesWithSelectedTag.map((article) => (
                  <div key={article.id} className="p-3 border rounded">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{article.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Kategori: {article.category?.name || 'Ingen kategori'}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {article.article_tags?.map((tag) => (
                            <Badge 
                              key={tag.id} 
                              variant={tag.id === selectedTag ? "default" : "outline"}
                              className="text-xs"
                              style={{ backgroundColor: tag.id === selectedTag ? undefined : tag.color + '20', borderColor: tag.color }}
                            >
                              {tag.display_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveTag(article.id, selectedTag)}
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

export default TagManager;
