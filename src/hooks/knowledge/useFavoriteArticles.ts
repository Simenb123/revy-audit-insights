import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { toast } from 'sonner';

export const useFavoriteArticles = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const { data: favoriteIds = [] } = useQuery({
    queryKey: ['user-favorites', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      
      const { data, error } = await supabase
        .from('knowledge_favorites')
        .select('article_id')
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      return data.map(f => f.article_id);
    },
    enabled: !!session?.user?.id,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (articleId: string) => {
      if (!session?.user?.id) throw new Error('Not authenticated');
      
      const isFavorite = favoriteIds.includes(articleId);
      
      if (isFavorite) {
        const { error } = await supabase
          .from('knowledge_favorites')
          .delete()
          .eq('user_id', session.user.id)
          .eq('article_id', articleId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('knowledge_favorites')
          .insert({
            user_id: session.user.id,
            article_id: articleId
          });
        
        if (error) throw error;
      }
    },
    onSuccess: (_, articleId) => {
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
      queryClient.invalidateQueries({ queryKey: ['my-favorites'] });
      
      const isFavorite = favoriteIds.includes(articleId);
      toast.success(isFavorite ? 'Fjernet fra favoritter' : 'Lagt til i favoritter');
    },
    onError: (error) => {
      toast.error('Kunne ikke oppdatere favoritter');
      console.error('Toggle favorite error:', error);
    },
  });

  const toggleFavorite = (articleId: string) => {
    toggleFavoriteMutation.mutate(articleId);
  };

  const isFavorite = (articleId: string) => {
    return favoriteIds.includes(articleId);
  };

  return {
    toggleFavorite,
    isFavorite,
    isLoading: toggleFavoriteMutation.isPending,
  };
};