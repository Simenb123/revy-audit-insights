
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Knowledge Article Tags
export const useArticleTags = (articleId?: string) => {
  return useQuery({
    queryKey: ['article-tags', articleId],
    queryFn: async () => {
      if (!articleId) return [];
      
      const { data, error } = await supabase
        .from('knowledge_article_tags')
        .select(`
          *,
          tag:tag_id (*)
        `)
        .eq('article_id', articleId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!articleId
  });
};

export const useConnectArticleTag = () => {
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['article-tags', variables.articleId] });
      toast.success('Tag koblet til artikkel');
    },
    onError: (error: any) => {
      toast.error('Feil ved kobling: ' + error.message);
    }
  });
};

export const useDisconnectArticleTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ articleId, tagId }: { articleId: string; tagId: string }) => {
      const { error } = await supabase
        .from('knowledge_article_tags')
        .delete()
        .eq('article_id', articleId)
        .eq('tag_id', tagId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['article-tags', variables.articleId] });
      toast.success('Tag fjernet fra artikkel');
    },
    onError: (error: any) => {
      toast.error('Feil ved fjerning: ' + error.message);
    }
  });
};

// Audit Action Tags
export const useActionTags = (actionId?: string) => {
  return useQuery({
    queryKey: ['action-tags', actionId],
    queryFn: async () => {
      if (!actionId) return [];
      
      const { data, error } = await supabase
        .from('audit_action_tags')
        .select(`
          *,
          tag:tag_id (*)
        `)
        .eq('action_template_id', actionId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!actionId
  });
};

export const useConnectActionTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ actionId, tagId }: { actionId: string; tagId: string }) => {
      const { data, error } = await supabase
        .from('audit_action_tags')
        .insert({ action_template_id: actionId, tag_id: tagId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['action-tags', variables.actionId] });
      toast.success('Tag koblet til handling');
    },
    onError: (error: any) => {
      toast.error('Feil ved kobling: ' + error.message);
    }
  });
};

export const useDisconnectActionTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ actionId, tagId }: { actionId: string; tagId: string }) => {
      const { error } = await supabase
        .from('audit_action_tags')
        .delete()
        .eq('action_template_id', actionId)
        .eq('tag_id', tagId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['action-tags', variables.actionId] });
      toast.success('Tag fjernet fra handling');
    },
    onError: (error: any) => {
      toast.error('Feil ved fjerning: ' + error.message);
    }
  });
};
