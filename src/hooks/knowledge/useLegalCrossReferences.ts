import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LegalCrossRef } from '@/types/legal-knowledge';

interface FetchCrossReferencesParams {
  fromProvisionId?: number;
  toDocumentNumber?: string;
  refType?: string;
  limit?: number;
}

// Hook to fetch legal cross-references
export const useLegalCrossReferences = (params: FetchCrossReferencesParams = {}) => {
  return useQuery({
    queryKey: ['legal-cross-refs', params],
    queryFn: async () => {
      let query = supabase
        .from('legal_cross_refs')
        .select('*')
        .order('created_at', { ascending: false });

      if (params.fromProvisionId) {
        query = query.eq('from_provision_id', params.fromProvisionId);
      }

      if (params.toDocumentNumber) {
        query = query.eq('to_document_number', params.toDocumentNumber);
      }

      if (params.refType) {
        query = query.eq('ref_type', params.refType);
      }

      if (params.limit) {
        query = query.limit(params.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch cross-references: ${error.message}`);
      }

      return data as LegalCrossRef[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch a single cross-reference by ID
export const useLegalCrossReference = (id?: number) => {
  return useQuery({
    queryKey: ['legal-cross-ref', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('legal_cross_refs')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to fetch cross-reference: ${error.message}`);
      }

      return data as LegalCrossRef | null;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to create cross-references
export const useCreateCrossReference = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (crossRef: Omit<LegalCrossRef, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('legal_cross_refs')
        .insert(crossRef)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create cross-reference: ${error.message}`);
      }

      return data as LegalCrossRef;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-cross-refs'] });
    },
  });
};

// Hook to update cross-references
export const useUpdateCrossReference = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: number; 
      updates: Partial<Omit<LegalCrossRef, 'id' | 'created_at'>>; 
    }) => {
      const { data, error } = await supabase
        .from('legal_cross_refs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update cross-reference: ${error.message}`);
      }

      return data as LegalCrossRef;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['legal-cross-refs'] });
      queryClient.invalidateQueries({ queryKey: ['legal-cross-ref', id] });
    },
  });
};

// Hook to delete cross-references
export const useDeleteCrossReference = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('legal_cross_refs')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete cross-reference: ${error.message}`);
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-cross-refs'] });
    },
  });
};

// Hook to bulk create cross-references (used by DraftList)
export const useBulkCreateCrossReferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (crossRefs: Array<Omit<LegalCrossRef, 'id' | 'created_at'>>) => {
      const { data, error } = await supabase
        .from('legal_cross_refs')
        .insert(crossRefs)
        .select();

      if (error) {
        throw new Error(`Failed to create cross-references: ${error.message}`);
      }

      return data as LegalCrossRef[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-cross-refs'] });
    },
  });
};