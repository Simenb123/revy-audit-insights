
import { logger } from '@/utils/logger';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useExistingFirm(orgNumber: string) {
  return useQuery({
    queryKey: ['existingFirm', orgNumber],
    queryFn: async () => {
      if (!orgNumber || orgNumber.length < 9) return null;
      
      const { data, error } = await supabase
        .from('audit_firms')
        .select('id, name, org_number, claimed_by, claimed_at')
        .eq('org_number', orgNumber)
        .maybeSingle();

      if (error) {
        logger.error('Error checking existing firm:', error);
        return null;
      }

      return data;
    },
    enabled: !!orgNumber && orgNumber.length >= 9,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
