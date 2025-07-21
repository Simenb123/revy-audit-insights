
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { KnowledgeFavorite } from '@/types/knowledge';
import KnowledgeLayout from './KnowledgeLayout';
import KnowledgeArticleCard from './KnowledgeArticleCard';
import { useFavoriteArticles } from '@/hooks/knowledge/useFavoriteArticles';

const MyFavorites = () => {
  const { session } = useAuth();
  const { toggleFavorite, isFavorite } = useFavoriteArticles();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['my-favorites'],
    queryFn: async () => {
      if (!session?.user?.id) return [];

      const { data, error } = await supabase
        .from('knowledge_favorites')
        .select(`
          *,
          article:knowledge_articles(
            *,
            category:knowledge_categories(id, name),
            content_type_entity:content_types(id, name, display_name, color)
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as KnowledgeFavorite[];
    },
    enabled: !!session?.user?.id,
  });

  const actions = (
    <Link to="/fag">
      <Button variant="outline" className="flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" />
        Tilbake til fagstoff
      </Button>
    </Link>
  );

  return (
    <KnowledgeLayout
      title="Mine favoritter"
      actions={actions}
    >
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Ingen favoritter ennå</h3>
            <p className="text-muted-foreground mb-4">
              Merk artikler som favoritter for å finne dem raskt senere.
            </p>
            <Link to="/fag">
              <Button>
                <BookOpen className="w-4 h-4 mr-2" />
                Utforsk fagartikler
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {favorites.length} favorittartikler
            </h2>
          </div>

          {favorites.map((favorite) => (
            favorite.article && (
              <KnowledgeArticleCard
                key={favorite.id}
                article={favorite.article}
                onToggleFavorite={toggleFavorite}
                isFavorite={isFavorite(favorite.article.id)}
              />
            )
          ))}
        </div>
      )}
    </KnowledgeLayout>
  );
};

export default MyFavorites;
