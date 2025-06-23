
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
      toast.success('Tag lagt til artikkel');
    },
    onError: (error: any) => {
      toast.error('Feil ved tilkobling av tag: ' + error.message);
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
      toast.error('Feil ved fjerning av tag: ' + error.message);
    }
  });
};

// Subject Area connections
export const useArticleSubjectAreas = (articleId?: string) => {
  return useQuery({
    queryKey: ['article-subject-areas', articleId],
    queryFn: async () => {
      if (!articleId) return [];
      
      const { data, error } = await supabase
        .from('article_subject_areas')
        .select(`
          *,
          subject_area:subject_area_id (*)
        `)
        .eq('article_id', articleId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!articleId
  });
};

export const useConnectArticleSubjectArea = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ articleId, subjectAreaId }: { articleId: string; subjectAreaId: string }) => {
      const { data, error } = await supabase
        .from('article_subject_areas')
        .insert({ article_id: articleId, subject_area_id: subjectAreaId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['article-subject-areas', variables.articleId] });
      toast.success('Emneområde lagt til artikkel');
    },
    onError: (error: any) => {
      toast.error('Feil ved tilkobling av emneområde: ' + error.message);
    }
  });
};

export const useDisconnectArticleSubjectArea = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ articleId, subjectAreaId }: { articleId: string; subjectAreaId: string }) => {
      const { error } = await supabase
        .from('article_subject_areas')
        .delete()
        .eq('article_id', articleId)
        .eq('subject_area_id', subjectAreaId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['article-subject-areas', variables.articleId] });
      toast.success('Emneområde fjernet fra artikkel');
    },
    onError: (error: any) => {
      toast.error('Feil ved fjerning av emneområde: ' + error.message);
    }
  });
};
