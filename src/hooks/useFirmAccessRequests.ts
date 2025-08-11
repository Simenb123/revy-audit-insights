
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export type FirmAccessRequest = {
  id: string;
  audit_firm_id: string;
  requester_profile_id: string;
  email: string | null;
  role_requested: string;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
};

export function useFirmAccessRequests(statusFilter?: FirmAccessRequest['status']) {
  return useQuery({
    queryKey: ['firmAccessRequests', statusFilter],
    queryFn: async (): Promise<FirmAccessRequest[]> => {
      let query = supabase
        .from('firm_access_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) {
        logger.error('Failed to fetch firm access requests', error);
        return [];
      }
      return (data ?? []) as FirmAccessRequest[];
    },
    staleTime: 30_000,
  });
}
