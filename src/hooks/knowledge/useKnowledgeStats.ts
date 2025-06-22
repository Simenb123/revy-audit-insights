
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useKnowledgeStats = () => {
  return useQuery({
    queryKey: ['knowledge-stats'],
    queryFn: async () => {
      // Get categories with article counts
      const { data: categories, error: categoriesError } = await supabase
        .from('knowledge_categories')
        .select(`
          id,
          name,
          description
        `)
        .is('parent_category_id', null)
        .order('display_order');

      if (categoriesError) throw categoriesError;

      // Get article counts per category
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
          const { count, error: countError } = await supabase
            .from('knowledge_articles')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('status', 'published');

          if (countError) throw countError;

          return {
            ...category,
            article_count: count || 0
          };
        })
      );

      return categoriesWithCounts;
    }
  });
};

export const useRecentArticles = (limit = 5) => {
  return useQuery({
    queryKey: ['recent-articles', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select(`
          id,
          title,
          summary,
          created_at,
          updated_at,
          category:knowledge_categories(name),
          content_type_entity:content_types(name, display_name)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    }
  });
};

export const useTotalArticleCount = () => {
  return useQuery({
    queryKey: ['total-article-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('knowledge_articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      if (error) throw error;
      return count || 0;
    }
  });
};
