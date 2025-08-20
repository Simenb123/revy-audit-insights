import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AmeldingCode {
  id: string;
  label: string;
  expected_fordel: string;
  aliases: string[];
  inserted_at: string;
}

export interface AmeldingCodeMap {
  a07: string;
  internal_code: string;
}

export interface InternalCode {
  id: string;
  label: string;
  aga: boolean;
  inserted_at: string;
}

/**
 * Hook to fetch all A07 codes from database
 */
export function useAmeldingCodes() {
  return useQuery({
    queryKey: ['amelding-codes'],
    queryFn: async (): Promise<AmeldingCode[]> => {
      const { data, error } = await supabase
        .from('amelding_codes')
        .select('*')
        .order('id');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch A07 to internal code mappings
 */
export function useAmeldingCodeMap() {
  return useQuery({
    queryKey: ['amelding-code-map'],
    queryFn: async (): Promise<AmeldingCodeMap[]> => {
      const { data, error } = await supabase
        .from('amelding_code_map')
        .select('*')
        .order('a07');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch internal codes
 */
export function useInternalCodes() {
  return useQuery({
    queryKey: ['internal-codes'],
    queryFn: async (): Promise<InternalCode[]> => {
      const { data, error } = await supabase
        .from('internal_codes')
        .select('*')
        .order('id');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Combined hook to fetch all code-related data
 */
export function useAllCodes() {
  const ameldingCodes = useAmeldingCodes();
  const ameldingCodeMap = useAmeldingCodeMap();
  const internalCodes = useInternalCodes();
  
  return {
    ameldingCodes: ameldingCodes.data || [],
    ameldingCodeMap: ameldingCodeMap.data || [],
    internalCodes: internalCodes.data || [],
    isLoading: ameldingCodes.isLoading || ameldingCodeMap.isLoading || internalCodes.isLoading,
    error: ameldingCodes.error || ameldingCodeMap.error || internalCodes.error,
    refetch: () => {
      ameldingCodes.refetch();
      ameldingCodeMap.refetch();
      internalCodes.refetch();
    }
  };
}