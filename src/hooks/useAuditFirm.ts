import { logger } from '@/utils/logger';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AuditFirm } from '@/types/organization';
import { useUserProfile } from './useUserProfile';

export function useAuditFirm() {
  const { data: userProfile } = useUserProfile();
  
  return useQuery({
    queryKey: ['auditFirm', userProfile?.auditFirmId],
    queryFn: async (): Promise<AuditFirm | null> => {
      if (!userProfile?.auditFirmId) return null;
      
      const { data, error } = await supabase
        .from('audit_firms')
        .select('*')
        .eq('id', userProfile.auditFirmId)
        .single();

      if (error) {
        logger.error('Error fetching audit firm:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        orgNumber: data.org_number,
        address: data.address,
        city: data.city,
        postalCode: data.postal_code,
        phone: data.phone,
        email: data.email,
        website: data.website,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    },
    enabled: !!userProfile?.auditFirmId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
