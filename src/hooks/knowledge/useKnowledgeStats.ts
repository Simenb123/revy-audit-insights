import { logger } from '@/utils/logger';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useKnowledgeStats = () => {
  return useQuery({
    queryKey: ['knowledge-stats'],
    queryFn: async () => {
      logger.log('📊 [KNOWLEDGE_STATS] Starting to fetch categories...');
      
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
        logger.error('📊 [KNOWLEDGE_STATS] Categories error:', categoriesError);
        throw categoriesError;
      }

      logger.log('📊 [KNOWLEDGE_STATS] Raw categories data:', categories);

      if (!categories || categories.length === 0) {
        logger.log('📊 [KNOWLEDGE_STATS] No categories found, returning empty array');
        return [];
      }

      // Get article counts per category
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
          logger.log('📊 [KNOWLEDGE_STATS] Counting articles for category:', category.name);
          
          const { count, error: countError } = await supabase
            .from('knowledge_articles')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('status', 'published');

          if (countError) {
            logger.error('📊 [KNOWLEDGE_STATS] Count error for category', category.name, ':', countError);
            // Don't throw, just log and continue with 0 count
            return {
              ...category,
              article_count: 0
            };
          }

          logger.log('📊 [KNOWLEDGE_STATS] Article count for', category.name, ':', count);

          return {
            ...category,
            article_count: count || 0
          };
        })
      );

      logger.log('📊 [KNOWLEDGE_STATS] Final categories with counts:', categoriesWithCounts);
      return categoriesWithCounts;
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useRecentArticles = (limit = 5) => {
  return useQuery({
    queryKey: ['recent-articles', limit],
    queryFn: async () => {
      logger.log('📊 [RECENT_ARTICLES] Fetching recent articles, limit:', limit);
      
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
        logger.error('📊 [RECENT_ARTICLES] Error:', error);
        throw error;
      }

      logger.log('📊 [RECENT_ARTICLES] Fetched articles:', data?.length || 0);
      logger.log('📊 [RECENT_ARTICLES] Articles data:', data);
      return data || [];
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useTotalArticleCount = () => {
  return useQuery({
    queryKey: ['total-article-count'],
    queryFn: async () => {
      logger.log('📊 [TOTAL_ARTICLES] Counting total articles...');
      
      const { count, error } = await supabase
        .from('knowledge_articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      if (error) {
        logger.error('📊 [TOTAL_ARTICLES] Error:', error);
        throw error;
      }

      logger.log('📊 [TOTAL_ARTICLES] Total count:', count);
      return count || 0;
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
