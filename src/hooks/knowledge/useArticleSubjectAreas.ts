
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useArticleSubjectAreas = (articleId?: string) => {
  return useQuery({
    queryKey: ['article-subject-areas', articleId],
    queryFn: async () => {
      if (!articleId) return [];
      
      const { data, error } = await supabase
        .from('article_subject_areas')
        .select(`
          *,
          subject_area:subject_areas(*)
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
      queryClient.invalidateQueries({ queryKey: ['articles-with-relations'] });
      toast.success('Emneområde koblet til artikkel');
    },
    onError: (error: any) => {
      toast.error('Feil ved kobling: ' + error.message);
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
      queryClient.invalidateQueries({ queryKey: ['articles-with-relations'] });
      toast.success('Emneområde fjernet fra artikkel');
    },
    onError: (error: any) => {
      toast.error('Feil ved fjerning: ' + error.message);
    }
  });
};
