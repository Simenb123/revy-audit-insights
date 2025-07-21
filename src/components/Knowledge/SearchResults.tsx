
import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeArticle } from '@/types/knowledge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import KnowledgeLayout from './KnowledgeLayout';
import KnowledgeArticleCard from './KnowledgeArticleCard';
import { useFavoriteArticles } from '@/hooks/knowledge/useFavoriteArticles';

const searchArticles = async (query: string, types: string[], areas: string[]) => {
  const searchQuery = `%${query}%`;

  let db = supabase
    .from('knowledge_articles')
    .select(
      `
      *,
      category:knowledge_categories(name),
      article_subject_areas(subject_area_id),
      article_tags:knowledge_article_tags(
        id,
        tag:tags(*)
      )
    `
    )
    .eq('status', 'published')
    .limit(20);

  if (query) {
    db = db.or(`title.ilike.${searchQuery},summary.ilike.${searchQuery}`);
  }
  if (types.length) {
    db = db.in('content_type_id', types);
  }
  if (areas.length) {
    db = db.in('article_subject_areas.subject_area_id', areas);
  }

  const { data, error } = await db;

  if (error) throw error;
  
  return (data || []).map(article => ({
    ...article,
    article_tags: article.article_tags?.map((at: any) => at.tag) || []
  }));
};

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const types = (searchParams.get('types') || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);
  const areas = (searchParams.get('areas') || '')
    .split(',')
    .map(a => a.trim())
    .filter(Boolean);

  const { toggleFavorite, isFavorite } = useFavoriteArticles();

  const { data: articles, isLoading, error } = useQuery({
    queryKey: ['knowledge-search', query, types.join(','), areas.join(',')],
    queryFn: () => searchArticles(query, types, areas),
    enabled: !!query || types.length > 0 || areas.length > 0,
  });

  if (!query && types.length === 0 && areas.length === 0) {
    return (
      <KnowledgeLayout title="Søk i kunnskapsbasen">
        <div className="text-center p-8">
          <p className="text-muted-foreground">
            Bruk søkefeltet i venstre meny for å finne artikler.
          </p>
        </div>
      </KnowledgeLayout>
    );
  }

  const title = query ? `Søkeresultater for: "${query}"` : 'Filtrerte artikler';

  return (
    <KnowledgeLayout title={title}>
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}
      
      {error && (
        <div className="text-destructive">
          Kunne ikke hente søkeresultater: {error.message}
        </div>
      )}
      
      {!isLoading && !error && (
        <>
          {articles && articles.length > 0 ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">Fant {articles.length} artikler.</p>
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
            <div className="text-center p-8 border rounded-lg">
              <h2 className="text-xl font-semibold">Ingen resultater</h2>
              <p className="text-muted-foreground mt-2">
                {query
                  ? `Vi fant dessverre ingen artikler som matchet søket ditt for "${query}".`
                  : 'Vi fant dessverre ingen artikler som matchet de valgte filtrene.'}
              </p>
              <p className="text-muted-foreground mt-1">
                Prøv et annet søkeord eller naviger via kategoriene til venstre.
              </p>
            </div>
          )}
        </>
      )}
    </KnowledgeLayout>
  );
};

export default SearchResults;
