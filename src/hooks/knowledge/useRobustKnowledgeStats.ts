import { logger } from '@/utils/logger';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRobustKnowledgeStats = () => {
  return useQuery({
    queryKey: ['robust-knowledge-stats'],
    queryFn: async () => {
      logger.log('🔧 [ROBUST_KNOWLEDGE_STATS] Starting fetch...');
      
      try {
        // Get categories with fallback
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
          logger.error('🔧 [ROBUST_KNOWLEDGE_STATS] Categories error:', categoriesError);
          // Return empty array instead of throwing
          return [];
        }

        logger.log('🔧 [ROBUST_KNOWLEDGE_STATS] Categories found:', categories?.length || 0);

        if (!categories || categories.length === 0) {
          logger.log('🔧 [ROBUST_KNOWLEDGE_STATS] No categories, returning empty array');
          return [];
        }

        // Get article counts per category with error handling
        const categoriesWithCounts = await Promise.all(
          categories.map(async (category) => {
            try {
              logger.log('🔧 [ROBUST_KNOWLEDGE_STATS] Counting articles for:', category.name);
              
              const { count, error: countError } = await supabase
                .from('knowledge_articles')
                .select('*', { count: 'exact', head: true })
                .eq('category_id', category.id)
                .eq('status', 'published');

              if (countError) {
                logger.error('🔧 [ROBUST_KNOWLEDGE_STATS] Count error for', category.name, ':', countError);
                return {
                  ...category,
                  article_count: 0
                };
              }

              logger.log('🔧 [ROBUST_KNOWLEDGE_STATS] Article count for', category.name, ':', count);

              return {
                ...category,
                article_count: count || 0
              };
            } catch (error) {
              logger.error('🔧 [ROBUST_KNOWLEDGE_STATS] Error processing category', category.name, ':', error);
              return {
                ...category,
                article_count: 0
              };
            }
          })
        );

        logger.log('🔧 [ROBUST_KNOWLEDGE_STATS] Final result:', categoriesWithCounts);
        return categoriesWithCounts;
      } catch (error) {
        logger.error('🔧 [ROBUST_KNOWLEDGE_STATS] Fatal error:', error);
        return []; // Always return an array, never throw
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 1000 * 60 * 5,
    // Always return empty array on error instead of undefined
    select: (data) => data || [],
  });
};

export const useRobustRecentArticles = (limit = 5) => {
  return useQuery({
    queryKey: ['robust-recent-articles', limit],
    queryFn: async () => {
      logger.log('🔧 [ROBUST_RECENT_ARTICLES] Fetching articles, limit:', limit);
      
      try {
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
          logger.error('🔧 [ROBUST_RECENT_ARTICLES] Error:', error);
          return []; // Return empty array instead of throwing
        }

        logger.log('🔧 [ROBUST_RECENT_ARTICLES] Fetched articles:', data?.length || 0);
        return data || [];
      } catch (error) {
        logger.error('🔧 [ROBUST_RECENT_ARTICLES] Fatal error:', error);
        return [];
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 1000 * 60 * 5,
    select: (data) => data || [],
  });
};

export const useRobustTotalArticleCount = () => {
  return useQuery({
    queryKey: ['robust-total-article-count'],
    queryFn: async () => {
      logger.log('🔧 [ROBUST_TOTAL_ARTICLES] Counting total articles...');
      
      try {
        const { count, error } = await supabase
          .from('knowledge_articles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'published');

        if (error) {
          logger.error('🔧 [ROBUST_TOTAL_ARTICLES] Error:', error);
          return 0; // Return 0 instead of throwing
        }

        logger.log('🔧 [ROBUST_TOTAL_ARTICLES] Total count:', count);
        return count || 0;
      } catch (error) {
        logger.error('🔧 [ROBUST_TOTAL_ARTICLES] Fatal error:', error);
        return 0;
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 1000 * 60 * 5,
    select: (data) => data ?? 0,
  });
};
