import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Simple client search result type
export interface SimpleClientSearchResult {
  clients: any[];
  total_count: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Simple search params
export interface SimpleClientSearchParams {
  search?: string;
  page?: number;
  limit?: number;
}

// Simplified hook for loading clients without complex joins
export const useSimpleClientList = (params: SimpleClientSearchParams = {}) => {
  return useQuery({
    queryKey: ['simple-clients', params],
    queryFn: async (): Promise<SimpleClientSearchResult> => {
      let query = supabase
        .from('clients')
        .select('*');

      // Apply search
      if (params.search) {
        query = query.or(`company_name.ilike.%${params.search}%,org_number.ilike.%${params.search}%,name.ilike.%${params.search}%`);
      }

      // Apply pagination
      const page = params.page || 1;
      const limit = params.limit || 50;
      const offset = (page - 1) * limit;
      
      const countQuery = supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      // Apply same search to count query
      if (params.search) {
        countQuery.or(`company_name.ilike.%${params.search}%,org_number.ilike.%${params.search}%,name.ilike.%${params.search}%`);
      }

      const [{ data, error }, { count }] = await Promise.all([
        query.range(offset, offset + limit - 1),
        countQuery
      ]);

      if (error) throw error;

      return {
        clients: data || [],
        total_count: count || 0,
        page,
        limit,
        has_more: (count || 0) > offset + (data?.length || 0)
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};