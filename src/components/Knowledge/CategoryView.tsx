import { logger } from '@/utils/logger';

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeCategory, KnowledgeArticle, ContentType } from '@/types/knowledge';
import ContentTypeBadge from './ContentTypeBadge';
import { Plus, Clock, Eye } from 'lucide-react';
import KnowledgeLayout from './KnowledgeLayout';
import KnowledgeArticleCard from './KnowledgeArticleCard';
import { useFavoriteArticles } from '@/hooks/knowledge/useFavoriteArticles';

const CategoryView = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const categoryIdentifier = categoryId;
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const { toggleFavorite, isFavorite } = useFavoriteArticles();

  // Check if categoryId is a valid UUID format
  const isValidUUID = (str: string | undefined) => {
    if (!str) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const validCategoryId = isValidUUID(categoryIdentifier);

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['knowledge-category', categoryIdentifier],
    queryFn: async () => {
      if (!categoryIdentifier) throw new Error('Category identifier is required');

      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('*')
        .eq(validCategoryId ? 'id' : 'name', categoryIdentifier)
        .single();

      if (error) {
        logger.error('Error fetching category:', error);
        throw error;
      }

      logger.log('Category fetched:', data);
      // Add slug property if missing
      return { ...(data as any), slug: (data as any).slug || data.id } as KnowledgeCategory;
    },
    enabled: !!categoryIdentifier
  });

  const { data: subcategories } = useQuery({
    queryKey: ['knowledge-subcategories', categoryIdentifier],
    queryFn: async () => {
      if (!category) return [];

      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('*')
        .eq('parent_category_id', category.id)
        .order('display_order');

      if (error) throw error;
      // Add slug property if missing for subcategories
      return (data || []).map(cat => ({ ...(cat as any), slug: (cat as any).slug || cat.id })) as KnowledgeCategory[];
    },
    enabled: !!category
  });

  const { data: articles = [], isLoading: isLoadingArticles } = useQuery({
    queryKey: ['knowledge-articles', categoryIdentifier],
    queryFn: async () => {
      if (!category) return [];

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
        .eq('category_id', category.id)
        .eq('status', 'published');

      if (error) throw error;

      return (data || []).map(article => ({
        ...article,
        article_tags: article.article_tags?.map((at: any) => at.tag) || []
      }));
    },
    enabled: !!category
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


  const actions = (
    <Button asChild>
      <Link to="/fag/ny-artikkel" state={{ categoryId: category?.id }}>
        <Plus className="w-4 h-4 mr-2" />
        Ny artikkel
      </Link>
    </Button>
  );

  return (
    <KnowledgeLayout 
      title={category.name}
      actions={actions}
    >
      {category.description && (
        <p className="text-muted-foreground -mt-2 mb-6">{category.description}</p>
      )}

      {/* Subcategories */}
      {subcategories && subcategories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Underkategorier</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subcategories.map((subcategory) => (
              <Link key={subcategory.id} to={`/fag/kategori/${subcategory.slug ?? subcategory.id}`}>
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
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="space-y-4">
            {articles.map((article) => (
              <KnowledgeArticleCard 
                key={article.id}
                article={article}
                onToggleFavorite={toggleFavorite}
                isFavorite={isFavorite(article.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Ingen artikler i denne kategorien ennå.</p>
            <Button asChild className="mt-4">
              <Link to="/fag/ny-artikkel" state={{ categoryId: category?.id }}>
                <Plus className="w-4 h-4 mr-2" />
                Opprett første artikkel
              </Link>
            </Button>
          </div>
        )}
      </div>
    </KnowledgeLayout>
  );
};

export default CategoryView;
