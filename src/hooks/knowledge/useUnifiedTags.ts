
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UnifiedTag {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  color: string;
  category?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  usage_count?: number;
}

// Unified hook for all tags across the system
export const useUnifiedTags = (category?: string) => {
  return useQuery({
    queryKey: ['unified-tags', category],
    queryFn: async () => {
      let query = supabase
        .from('tags')
        .select('*')
        .eq('is_active', true)
        .order('category, sort_order, display_name');
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data: tags, error } = await query;
      
      if (error) throw error;
      
      // Get usage counts for each tag
      const tagsWithCounts = await Promise.all(
        tags.map(async (tag) => {
          // Count articles using this tag
          const { count: articleCount } = await supabase
            .from('knowledge_article_tags')
            .select('*', { count: 'exact', head: true })
            .eq('tag_id', tag.id);
          
          // Count audit actions using this tag
          const { count: actionCount } = await supabase
            .from('audit_action_tags')
            .select('*', { count: 'exact', head: true })
            .eq('tag_id', tag.id);
          
          return {
            ...tag,
            usage_count: (articleCount || 0) + (actionCount || 0)
          };
        })
      );
      
      return tagsWithCounts as UnifiedTag[];
    }
  });
};

// Create a new tag
export const useCreateTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tag: Omit<UnifiedTag, 'id' | 'created_at' | 'updated_at' | 'usage_count'>) => {
      const { data, error } = await supabase
        .from('tags')
        .insert(tag)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-tags'] });
      toast.success('Ny tag opprettet');
    },
    onError: (error: any) => {
      toast.error('Feil ved opprettelse: ' + error.message);
    }
  });
};

// Hook for legacy article tags (for backward compatibility)
export const useArticleTagsLegacy = (articleId?: string) => {
  return useQuery({
    queryKey: ['article-tags-legacy', articleId],
    queryFn: async () => {
      if (!articleId) return [];
      
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('tags')
        .eq('id', articleId)
        .single();
      
      if (error) throw error;
      return data?.tags || [];
    },
    enabled: !!articleId
  });
};

// Connect article to unified tag system
export const useConnectArticleToTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ articleId, tagId }: { articleId: string; tagId: string }) => {
      const { data, error } = await supabase
        .from('knowledge_article_tags')
        .insert({ article_id: articleId, tag_id: tagId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-tags'] });
      queryClient.invalidateQueries({ queryKey: ['article-tags'] });
      toast.success('Tag koblet til artikkel');
    },
    onError: (error: any) => {
      toast.error('Feil ved kobling: ' + error.message);
    }
  });
};

// Update article legacy tags
export const useUpdateArticleLegacyTags = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ articleId, tags }: { articleId: string; tags: string[] }) => {
      const { error } = await supabase
        .from('knowledge_articles')
        .update({ tags })
        .eq('id', articleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-tags-legacy'] });
      toast.success('Tags oppdatert');
    },
    onError: (error: any) => {
      toast.error('Feil ved oppdatering: ' + error.message);
    }
  });
};
