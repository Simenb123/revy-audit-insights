
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeCategory, KnowledgeArticle, ContentType } from '@/types/knowledge';
import ContentTypeBadge from './ContentTypeBadge';
import { Plus, Clock, Eye } from 'lucide-react';

const CategoryView = () => {
  const { categoryId } = useParams<{ categoryId: string }>();

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['knowledge-category', categoryId],
    queryFn: async () => {
      if (!categoryId) throw new Error('Category ID is required');
      
      console.log('Fetching category:', categoryId);
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('*')
        .eq('id', categoryId)
        .single();
      
      if (error) {
        console.error('Error fetching category:', error);
        throw error;
      }
      
      console.log('Category fetched:', data);
      return data as KnowledgeCategory;
    },
    enabled: !!categoryId
  });

  const { data: subcategories } = useQuery({
    queryKey: ['knowledge-subcategories', categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('*')
        .eq('parent_category_id', categoryId)
        .order('display_order');
      
      if (error) throw error;
      return data as KnowledgeCategory[];
    },
    enabled: !!categoryId
  });

  const { data: articles } = useQuery({
    queryKey: ['knowledge-articles', categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .eq('category_id', categoryId)
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as KnowledgeArticle[];
    },
    enabled: !!categoryId
  });

  if (categoryLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold">Kategori ikke funnet</h2>
          <p className="text-muted-foreground mt-2">Kategorien du leter etter eksisterer ikke.</p>
          <Button asChild className="mt-4">
            <Link to="/fag">Tilbake til fagområder</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/fag">Fagområder</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{category.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Category Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{category.name}</h1>
          {category.description && (
            <p className="text-muted-foreground mt-1">{category.description}</p>
          )}
        </div>
        <Button asChild>
          <Link to="/fag/ny-artikkel" state={{ categoryId }}>
            <Plus className="w-4 h-4 mr-2" />
            Ny artikkel
          </Link>
        </Button>
      </div>

      {/* Subcategories */}
      {subcategories && subcategories.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Underkategorier</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subcategories.map((subcategory) => (
              <Link key={subcategory.id} to={`/fag/kategori/${subcategory.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{subcategory.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {subcategory.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Articles */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Artikler</h2>
        {articles && articles.length > 0 ? (
          <div className="space-y-3">
            {articles.map((article) => (
              <Card key={article.id} className="hover:shadow-sm transition-shadow bg-card">
                <CardContent className="p-4">
                  <Link to={`/fag/artikkel/${article.slug}`} className="block">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-medium hover:text-primary transition-colors flex-1">
                        {article.title}
                      </h3>
                      {article.content_type && (
                        <ContentTypeBadge contentType={article.content_type as ContentType} />
                      )}
                    </div>
                    {article.summary && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {article.summary}
                      </p>
                    )}
                  </Link>
                  <div className="flex items-center gap-4 mt-3">
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex gap-1">
                        {article.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground ml-auto">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {article.view_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(article.published_at || article.created_at).toLocaleDateString('nb-NO')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Ingen artikler funnet i denne kategorien.</p>
              <Button asChild className="mt-3">
                <Link to="/fag/ny-artikkel" state={{ categoryId }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Opprett første artikkel
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CategoryView;
