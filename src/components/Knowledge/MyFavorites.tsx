
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { 
  Clock, 
  StarOff,
  Heart
} from 'lucide-react';

const MyFavorites = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: favorites, isLoading } = useQuery({
    queryKey: ['my-favorites', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      
      const { data, error } = await supabase
        .from('knowledge_favorites')
        .select(`
          *,
          article:knowledge_articles(
            id,
            title,
            slug,
            summary,
            status,
            view_count,
            published_at,
            created_at,
            category:knowledge_categories(name)
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (favoriteId: string) => {
      const { error } = await supabase
        .from('knowledge_favorites')
        .delete()
        .eq('id', favoriteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-favorites', session?.user?.id] });
    }
  });

  if (isLoading) {
    return <div className="space-y-4">Laster favoritter...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Heart className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Mine favoritter</h2>
      </div>

      <div className="space-y-4">
        {favorites?.map((favorite) => (
          <Card key={favorite.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link to={`/fag/artikkel/${favorite.article.slug}`} className="block">
                    <h3 className="font-medium hover:text-primary transition-colors mb-1">
                      {favorite.article.title}
                    </h3>
                    {favorite.article.summary && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {favorite.article.summary}
                      </p>
                    )}
                  </Link>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {favorite.article.category?.name}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(favorite.article.published_at || favorite.article.created_at).toLocaleDateString('nb-NO')}
                    </span>
                    {favorite.article.status === 'published' && (
                      <span className="text-xs text-muted-foreground">
                        {favorite.article.view_count} visninger
                      </span>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFavoriteMutation.mutate(favorite.id)}
                  disabled={removeFavoriteMutation.isPending}
                >
                  <StarOff className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {favorites?.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Du har ikke lagt til noen favoritter ennå.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Klikk på stjerne-ikonet på artikler for å legge dem til i favoritter.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyFavorites;
