
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useKnowledgeStats = () => {
  return useQuery({
    queryKey: ['knowledge-stats'],
    queryFn: async () => {
      console.log('📊 [KNOWLEDGE_STATS] Fetching categories...');
      
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

      if (categoriesError) {
        console.error('📊 [KNOWLEDGE_STATS] Categories error:', categoriesError);
        throw categoriesError;
      }

      console.log('📊 [KNOWLEDGE_STATS] Categories fetched:', categories?.length);

      // Get article counts per category
      const categoriesWithCounts = await Promise.all(
        (categories || []).map(async (category) => {
          console.log('📊 [KNOWLEDGE_STATS] Counting articles for:', category.name);
          
          const { count, error: countError } = await supabase
            .from('knowledge_articles')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('status', 'published');

          if (countError) {
            console.error('📊 [KNOWLEDGE_STATS] Count error for category', category.name, ':', countError);
            throw countError;
          }

          console.log('📊 [KNOWLEDGE_STATS] Article count for', category.name, ':', count);

          return {
            ...category,
            article_count: count || 0
          };
        })
      );

      console.log('📊 [KNOWLEDGE_STATS] Final result:', categoriesWithCounts);
      return categoriesWithCounts;
    },
    retry: 3,
    retryDelay: 1000
  });
};

export const useRecentArticles = (limit = 5) => {
  return useQuery({
    queryKey: ['recent-articles', limit],
    queryFn: async () => {
      console.log('📊 [RECENT_ARTICLES] Fetching recent articles...');
      
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select(`
          id,
          title,
          slug,
          summary,
          created_at,
          updated_at,
          category:knowledge_categories(name),
          content_type_entity:content_types(name, display_name)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('📊 [RECENT_ARTICLES] Error:', error);
        throw error;
      }

      console.log('📊 [RECENT_ARTICLES] Fetched:', data?.length, 'articles');
      return data;
    },
    retry: 3,
    retryDelay: 1000
  });
};

export const useTotalArticleCount = () => {
  return useQuery({
    queryKey: ['total-article-count'],
    queryFn: async () => {
      console.log('📊 [TOTAL_ARTICLES] Counting total articles...');
      
      const { count, error } = await supabase
        .from('knowledge_articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      if (error) {
        console.error('📊 [TOTAL_ARTICLES] Error:', error);
        throw error;
      }

      console.log('📊 [TOTAL_ARTICLES] Total count:', count);
      return count || 0;
    },
    retry: 3,
    retryDelay: 1000
  });
};
