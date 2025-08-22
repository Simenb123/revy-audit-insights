import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LegalProvision } from '@/types/legal-knowledge';

interface FetchLegalProvisionsParams {
  documentId?: string;
  searchTerm?: string;
  limit?: number;
  enabled?: boolean;
}

/**
 * Hook for fetching legal provisions from Supabase
 * Supports filtering by document and search functionality
 */
export const useLegalProvisions = ({ 
  documentId, 
  searchTerm, 
  limit = 100, 
  enabled = true 
}: FetchLegalProvisionsParams = {}) => {
  return useQuery({
    queryKey: ['legal-provisions', { documentId, searchTerm, limit }],
    queryFn: async () => {
      let query = supabase
        .from('legal_provisions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      // Filter by document if specified
      // Note: We need to establish the relationship between documents and provisions
      // This might require a junction table or foreign key relationship
      
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.trim();
        query = query.or(`
          title.ilike.%${term}%,
          provision_number.ilike.%${term}%,
          content.ilike.%${term}%
        `);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching legal provisions:', error);
        throw error;
      }

      return (data || []) as LegalProvision[];
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for fetching provisions by law identifier
 * This is useful when we know the law but not the specific document ID
 */
export const useLegalProvisionsByLaw = (lawIdentifier?: string) => {
  return useQuery({
    queryKey: ['legal-provisions-by-law', lawIdentifier],
    queryFn: async () => {
      if (!lawIdentifier) return [];

      const { data, error } = await supabase
        .from('legal_provisions')
        .select('*')
        .eq('law_identifier', lawIdentifier)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching provisions by law:', error);
        throw error;
      }

      return (data || []) as LegalProvision[];
    },
    enabled: !!lawIdentifier,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook for fetching a single provision by ID
 */
export const useLegalProvision = (id?: string) => {
  return useQuery({
    queryKey: ['legal-provision', id],
    queryFn: async () => {
      if (!id) throw new Error('Provision ID is required');

      const { data, error } = await supabase
        .from('legal_provisions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching legal provision:', error);
        throw error;
      }

      return data as LegalProvision;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};