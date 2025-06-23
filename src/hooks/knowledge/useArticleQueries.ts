
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeArticle } from '@/types/knowledge';

export const useArticleWithRelations = (articleId: string) => {
  return useQuery({
    queryKey: ['article-with-relations', articleId],
    queryFn: async (): Promise<KnowledgeArticle | null> => {
      if (!articleId) return null;

      const { data, error } = await supabase
        .from('knowledge_articles')
        .select(`
          *,
          category:knowledge_categories(*),
          content_type_entity:content_types(*),
          subject_areas:article_subject_areas(
            id,
            subject_area:subject_areas(*)
          ),
          article_tags:knowledge_article_tags(
            id,
            tag:tags(*)
          )
        `)
        .eq('id', articleId)
        .single();

      if (error) {
        console.error('Error fetching article with relations:', error);
        throw error;
      }

      if (!data) return null;

      // Transform the data to match our interface
      return {
        ...data,
        subject_areas: data.subject_areas?.map((sa: any) => sa.subject_area) || [],
        article_tags: data.article_tags?.map((at: any) => at.tag) || [],
      };
    },
    enabled: !!articleId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useArticlesWithRelations = () => {
  return useQuery({
    queryKey: ['articles-with-relations'],
    queryFn: async (): Promise<KnowledgeArticle[]> => {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select(`
          *,
          category:knowledge_categories(*),
          content_type_entity:content_types(*),
          subject_areas:article_subject_areas(
            id,
            subject_area:subject_areas(*)
          ),
          article_tags:knowledge_article_tags(
            id,
            tag:tags(*)
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching articles with relations:', error);
        throw error;
      }

      // Transform the data to match our interface
      return (data || []).map(article => ({
        ...article,
        subject_areas: article.subject_areas?.map((sa: any) => sa.subject_area) || [],
        article_tags: article.article_tags?.map((at: any) => at.tag) || [],
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
