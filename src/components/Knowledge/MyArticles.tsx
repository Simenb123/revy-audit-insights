
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { KnowledgeArticle } from '@/types/knowledge';
import { Plus, Edit, Eye, Clock } from 'lucide-react';

const MyArticles = () => {
  const { session } = useAuth();

  const { data: articles, isLoading } = useQuery({
    queryKey: ['my-knowledge-articles', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select(`
          *,
          category:knowledge_categories(name)
        `)
        .eq('author_id', session.user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as (KnowledgeArticle & { category: { name: string } })[];
    },
    enabled: !!session?.user?.id
  });

  if (isLoading) {
    return <div>Laster mine artikler...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mine artikler</h1>
        <Button asChild>
          <Link to="/fag/ny-artikkel">
            <Plus className="w-4 h-4 mr-2" />
            Ny artikkel
          </Link>
        </Button>
      </div>

      {articles && articles.length > 0 ? (
        <div className="space-y-3">
          {articles.map((article) => (
            <Card key={article.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant={
                          article.status === 'published' ? 'default' : 
                          article.status === 'draft' ? 'secondary' : 'outline'
                        }
                        className="text-xs"
                      >
                        {article.status === 'published' ? 'Publisert' : 
                         article.status === 'draft' ? 'Utkast' : 'Arkivert'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {article.category?.name}
                      </Badge>
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
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {article.view_count} visninger
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Oppdatert {new Date(article.updated_at).toLocaleDateString('nb-NO')}
                      </span>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/fag/rediger/${article.id}`}>
                      <Edit className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Du har ikke skrevet noen artikler ennå.</p>
            <Button asChild>
              <Link to="/fag/ny-artikkel">
                <Plus className="w-4 h-4 mr-2" />
                Skriv din første artikkel
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyArticles;
