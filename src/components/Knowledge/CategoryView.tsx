
import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
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

  // Check if categoryId is a valid UUID format
  const isValidUUID = (str: string | undefined) => {
    if (!str) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const validCategoryId = isValidUUID(categoryId)

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['knowledge-category', categoryId],
    queryFn: async () => {
      if (!categoryId) throw new Error('Category ID is required')

      console.log('Fetching category:', categoryId)
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('*')
        .eq('id', categoryId)
        .single()

      if (error) {
        console.error('Error fetching category:', error)
        throw error
      }

      console.log('Category fetched:', data)
      return data as KnowledgeCategory
    },
    enabled: !!categoryId && validCategoryId
  })

  const { data: subcategories } = useQuery({
    queryKey: ['knowledge-subcategories', categoryId],
    queryFn: async () => {
      if (!categoryId || !validCategoryId) return []

      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('*')
        .eq('parent_category_id', categoryId)
        .order('display_order')

      if (error) throw error
      return data as KnowledgeCategory[]
    },
    enabled: !!categoryId && validCategoryId
  })

  const { data: articles = [], isLoading: isLoadingArticles } = useQuery({
    queryKey: ['knowledge-articles', categoryId],
    queryFn: async () => {
      if (!categoryId || !validCategoryId) return []

      const { data, error } = await supabase
        .from('knowledge_articles')
        .select(`
          *,
          category:knowledge_categories(name),
          content_type_entity:content_types(*),
          article_tags:knowledge_article_tags(
            id,
            tag:tags(*)
          )
        `)
        .eq('category_id', categoryId)
        .eq('status', 'published')

      if (error) throw error

      return (data || []).map(article => ({
        ...article,
        article_tags: article.article_tags?.map((at: any) => at.tag) || []
      }))
    },
    enabled: !!categoryId && validCategoryId
  })

  // If categoryId is not a valid UUID, redirect to knowledge base
  if (!validCategoryId) {
    console.warn('Invalid category ID format:', categoryId)
    return <Navigate to="/fag" replace />
  }

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
        <h2 className="text-lg font-semibold mb-4">Artikler i kategori</h2>
        {isLoadingArticles ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link key={article.id} to={`/fag/artikkel/${article.slug}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{article.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {article.summary || 'Ingen sammendrag tilgjengelig.'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {article.content_type_entity && (
                        <ContentTypeBadge contentType={article.content_type_entity} size="sm" />
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="w-3 h-3" />
                        {article.view_count}
                      </div>
                    </div>
                    {article.article_tags && article.article_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {article.article_tags.slice(0, 3).map((tag: any) => (
                          <Badge key={tag.id} variant="outline" className="text-xs">
                            {tag.display_name}
                          </Badge>
                        ))}
                        {article.article_tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{article.article_tags.length - 3}</Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Ingen artikler i denne kategorien ennå.</p>
            <Button asChild className="mt-4">
              <Link to="/fag/ny-artikkel" state={{ categoryId }}>
                <Plus className="w-4 h-4 mr-2" />
                Opprett første artikkel
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryView;
