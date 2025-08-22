import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface EnhancedSearchParams {
  query: string;
  context_type?: 'general' | 'ai_summary';
  max_results?: number;
  include_provisions?: boolean;
  include_citations?: boolean;
}

export interface SearchResult {
  // Document fields
  id: string;
  title: string;
  document_number?: string;
  summary?: string;
  content?: string;
  document_type?: {
    name: string;
    display_name: string;
    color: string;
  };
  
  // Provision fields
  provision_number?: string;
  law_identifier?: string;
  
  // Search metadata
  similarity_score: number;
  result_type: 'document' | 'provision' | 'citation';
  match_type: 'semantic' | 'keyword' | 'combined';
  
  // Additional metadata
  created_at?: string;
  updated_at?: string;
  authority_level?: number;
}

export interface EnhancedSearchResponse {
  results: SearchResult[];
  ai_summary?: string;
  search_metadata: {
    total_results: number;
    semantic_results: number;
    keyword_results: number;
    response_time_ms: number;
    query_embedding_time_ms?: number;
  };
  performance: {
    total_time_ms: number;
    search_time_ms: number;
    ranking_time_ms: number;
  };
}

export const useEnhancedLegalSearch = () => {
  const [searchParams, setSearchParams] = useState<EnhancedSearchParams | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Query for performing the search
  const {
    data: searchResponse,
    error,
    isLoading,
    refetch
  } = useQuery<EnhancedSearchResponse>({
    queryKey: ['enhanced-legal-search', searchParams],
    queryFn: async (): Promise<EnhancedSearchResponse> => {
      if (!searchParams || !searchParams.query.trim()) {
        throw new Error('Search query is required');
      }

      logger.log('🔍 Enhanced legal search starting:', searchParams);
      
      const { data, error } = await supabase.functions.invoke('enhanced-legal-search', {
        body: {
          query: searchParams.query.trim(),
          context_type: searchParams.context_type || 'general',
          max_results: searchParams.max_results || 20
        }
      });

      if (error) {
        logger.error('❌ Enhanced legal search failed:', error);
        throw new Error(`Search failed: ${error.message}`);
      }

      if (!data) {
        logger.warn('⚠️ No data returned from enhanced legal search');
        throw new Error('No data returned from search');
      }

      logger.log('✅ Enhanced legal search completed:', {
        totalResults: data.search_metadata?.total_results || 0,
        responseTime: data.performance?.total_time_ms || 0
      });

      return data;
    },
    enabled: false, // Only run when explicitly triggered
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Perform search function
  const performSearch = useCallback(async (params: EnhancedSearchParams) => {
    setIsSearching(true);
    setSearchParams(params);
    
    try {
      await refetch();
    } catch (error) {
      logger.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [refetch]);

  // Clear search results
  const clearSearch = useCallback(() => {
    setSearchParams(null);
  }, []);

  return {
    // Search state
    searchResponse,
    isLoading: isLoading || isSearching,
    error,
    searchParams,

    // Search actions
    performSearch,
    clearSearch,

    // Computed values
    results: searchResponse?.results || [],
    totalResults: searchResponse?.search_metadata?.total_results || 0,
    aiSummary: searchResponse?.ai_summary,
    performance: searchResponse?.performance,
  };
};

export default useEnhancedLegalSearch;