
import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeArticle } from '@/types/knowledge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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

  const { data: articles, isLoading, error } = useQuery({
    queryKey: ['knowledge-search', query, types.join(','), areas.join(',')],
    queryFn: () => searchArticles(query, types, areas),
    enabled: !!query || types.length > 0 || areas.length > 0,
  });

  if (!query && types.length === 0 && areas.length === 0) {
    return (
        <div className="text-center p-8">
            <h1 className="text-xl font-semibold">Søk i kunnskapsbasen</h1>
            <p className="text-muted-foreground mt-2">
                Bruk søkefeltet i venstre meny for å finne artikler.
            </p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        {query ? (
          <>Søkeresultater for: <span className="text-primary">"{query}"</span></>
        ) : (
          'Filtrerte artikler'
        )}
      </h1>

      {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
      )}
      {error && <div className="text-destructive">Kunne ikke hente søkeresultater: {error.message}</div>}
      
      {!isLoading && !error && (
        <>
          {articles && articles.length > 0 ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">Fant {articles.length} artikler.</p>
              {articles.map((article) => (
                <Card key={article.id}>
                  <CardHeader>
                    <Link to={`/fag/artikkel/${article.slug}`} className="hover:underline">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="w-5 h-5 flex-shrink-0" />
                        <span>{article.title}</span>
                      </CardTitle>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 line-clamp-2">{article.summary || 'Ingen sammendrag.'}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {article.category?.name && <Badge variant="secondary">{article.category.name}</Badge>}
                      {article.article_tags?.map((tag: any) => <Badge key={tag.id} variant="outline">{tag.display_name}</Badge>)}
                    </div>
                  </CardContent>
                </Card>
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
    </div>
  );
};

export default SearchResults;
