import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeArticle } from '@/types/knowledge';
import { Search, Clock, Eye, Sparkles, FileCode } from 'lucide-react';

type ArticleWithCategoryAndSimilarity = KnowledgeArticle & { 
  category: { name: string } | null, 
  similarity?: number 
};

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = React.useState(query);

  const { data: results, isLoading, isError } = useQuery({
    queryKey: ['knowledge-search', query],
    queryFn: async () => {
      if (!query.trim()) return [];
      
      const { data, error } = await supabase
        .functions
        .invoke('knowledge-search', {
          body: { query: query.trim() }
        });
      
      if (error) throw error;
      return data as ArticleWithCategoryAndSimilarity[];
    },
    enabled: !!query.trim()
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm.trim() });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">Søk i kunnskapsbasen</h1>
        
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Søk med fullstendige setninger for best resultat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </form>
      </div>

      {query && (
        <div>
          <p className="text-muted-foreground mb-4">
            Søkeresultater for: <strong>{query}</strong>
            {results && ` (${results.length} treff)`}
          </p>

          {isLoading ? (
            <div className="text-center p-4">Søker...</div>
          ) : isError ? (
            <Card>
              <CardContent className="p-6 text-center text-destructive">
                <p>Noe gikk galt under søket. Prøv igjen.</p>
              </CardContent>
            </Card>
          ) : results && results.length > 0 ? (
            <div className="space-y-3">
              {results.map((article) => (
                <Card key={article.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {article.category?.name && (
                            <Badge variant="secondary" className="text-xs">
                              {article.category.name}
                            </Badge>
                          )}
                          {article.reference_code && (
                             <Badge variant="outline" className="text-xs font-mono">
                               <FileCode className="w-3 h-3 mr-1.5" />
                               {article.reference_code}
                             </Badge>
                          )}
                           {article.similarity && article.similarity > 0.72 && (
                             <Badge variant="default" className="text-xs bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Godt treff
                             </Badge>
                          )}
                        </div>
                        
                        <Link to={`/fag/artikkel/${article.slug}`} className="block">
                          <h3 className="font-medium hover:text-primary transition-colors">
                            {article.title}
                          </h3>
                          {article.summary && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {article.summary}
                            </p>
                          )}
                        </Link>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {article.view_count} visninger
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(article.published_at || article.created_at).toLocaleDateString('nb-NO')}
                          </span>
                          {article.tags && article.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {article.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Ingen artikler funnet som matcher søket ditt.</p>
                <p className="text-xs text-muted-foreground mt-2">Prøv å omformulere søket eller bruk andre ord.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchResults;
