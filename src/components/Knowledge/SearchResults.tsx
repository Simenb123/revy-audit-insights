
import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { 
  Search,
  Clock,
  Star,
  StarOff
} from 'lucide-react';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { session } = useAuth();
  
  const { data: results, isLoading } = useQuery({
    queryKey: ['search-articles', query],
    queryFn: async () => {
      if (!query.trim()) return [];
      
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select(`
          *,
          category:knowledge_categories(name)
        `)
        .eq('status', 'published')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,summary.ilike.%${query}%`)
        .order('view_count', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!query.trim()
  });

  if (!query.trim()) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Search className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Søk</h2>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Skriv inn et søkeord for å finne artikler.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <div className="space-y-4">Søker...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Search className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Søkeresultater</h2>
      </div>
      
      <div className="text-sm text-muted-foreground">
        {results?.length === 0 
          ? `Ingen resultater funnet for "${query}"`
          : `${results?.length} resultat${results?.length !== 1 ? 'er' : ''} for "${query}"`
        }
      </div>

      <div className="space-y-4">
        {results?.map((article) => (
          <Card key={article.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link to={`/fag/artikkel/${article.slug}`} className="block">
                    <h3 className="font-medium hover:text-primary transition-colors mb-1">
                      {article.title}
                    </h3>
                    {article.summary && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {article.summary}
                      </p>
                    )}
                  </Link>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {article.category?.name}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(article.published_at || article.created_at).toLocaleDateString('nb-NO')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {article.view_count} visninger
                    </span>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm">
                  <Star className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {results?.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Ingen artikler matcher søket ditt.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Prøv andre søkeord eller bla gjennom kategoriene.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
