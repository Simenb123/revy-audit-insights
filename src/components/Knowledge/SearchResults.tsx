
import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useKnowledgeCategories } from '@/hooks/knowledge/useKnowledgeCategories';

const searchArticles = async (query: string, categoryId?: string | null) => {
  const searchQuery = `%${query}%`;

  let queryBuilder = supabase
    .from('knowledge_articles')
    .select(`
      *,
      category:knowledge_categories(name),
      article_tags:knowledge_article_tags(
        id,
        tag:tags(*)
      )
    `)
    .or(`title.ilike.${searchQuery},summary.ilike.${searchQuery}`)
    .eq('status', 'published');

  if (categoryId) {
    queryBuilder = queryBuilder.eq('category_id', categoryId);
  }

  const { data, error } = await queryBuilder.limit(20);

  if (error) throw error;
  
  return (data || []).map(article => ({
    ...article,
    article_tags: article.article_tags?.map((at: any) => at.tag) || []
  }));
};

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const categoryId = searchParams.get('category');
  const { data: categories } = useKnowledgeCategories();
  const categoryName = categories?.find(c => c.id === categoryId)?.name;

  const { data: articles, isLoading, error } = useQuery({
    queryKey: ['knowledge-search', query, categoryId],
    queryFn: () => searchArticles(query, categoryId),
    enabled: !!query || !!categoryId,
  });

  if (!query && !categoryId) {
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
        Søkeresultater
        {query ? (
          <> for: <span className="text-primary">"{query}"</span></>
        ) : categoryName ? (
          <> i <span className="text-primary">{categoryName}</span></>
        ) : null}
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
              <p className="text-muted-foreground">Fant {articles.length} resultat(er).</p>
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
                {query ? (
                  <p className="text-muted-foreground mt-2">
                    Vi fant dessverre ingen artikler som matchet søket ditt for "{query}".
                  </p>
                ) : categoryName ? (
                  <p className="text-muted-foreground mt-2">
                    Vi fant ingen artikler i kategorien "{categoryName}".
                  </p>
                ) : null}
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
