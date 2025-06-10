
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { KnowledgeFavorite } from '@/types/knowledge';
import { Heart, Clock, Eye } from 'lucide-react';

const MyFavorites = () => {
  const { session } = useAuth();

  const { data: favorites, isLoading } = useQuery({
    queryKey: ['my-knowledge-favorites', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      
      const { data, error } = await supabase
        .from('knowledge_favorites')
        .select(`
          *,
          article:knowledge_articles(
            *,
            category:knowledge_categories(name)
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (KnowledgeFavorite & { 
        article: any & { category: { name: string } } 
      })[];
    },
    enabled: !!session?.user?.id
  });

  if (isLoading) {
    return <div>Laster favoritter...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Heart className="w-5 h-5 text-red-500" />
        <h1 className="text-2xl font-bold">Mine favoritter</h1>
      </div>

      {favorites && favorites.length > 0 ? (
        <div className="space-y-3">
          {favorites.map((favorite) => (
            <Card key={favorite.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {favorite.article?.category?.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Lagt til {new Date(favorite.created_at).toLocaleDateString('nb-NO')}
                      </span>
                    </div>
                    
                    <Link to={`/fag/artikkel/${favorite.article?.slug}`} className="block">
                      <h3 className="font-medium hover:text-primary transition-colors">
                        {favorite.article?.title}
                      </h3>
                      {favorite.article?.summary && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {favorite.article.summary}
                        </p>
                      )}
                    </Link>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {favorite.article?.view_count} visninger
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(favorite.article?.published_at || favorite.article?.created_at).toLocaleDateString('nb-NO')}
                      </span>
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
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Du har ikke lagt til noen favoritter ennå.</p>
            <p className="text-sm text-muted-foreground">
              Klikk på stjerne-ikonet på artikler du vil lagre som favoritter.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyFavorites;
