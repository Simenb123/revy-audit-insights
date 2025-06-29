import { logger } from '@/utils/logger';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Department } from '@/types/organization';
import { useUserProfile } from './useUserProfile';

export function useDepartments() {
  const { data: userProfile } = useUserProfile();
  
  return useQuery({
    queryKey: ['departments', userProfile?.auditFirmId],
    queryFn: async (): Promise<Department[]> => {
      if (!userProfile?.auditFirmId) return [];
      
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('audit_firm_id', userProfile.auditFirmId)
        .order('name');

      if (error) {
        logger.error('Error fetching departments:', error);
        return [];
      }

      return data.map(dept => ({
        id: dept.id,
        auditFirmId: dept.audit_firm_id,
        name: dept.name,
        description: dept.description,
        partnerId: dept.partner_id,
        createdAt: dept.created_at,
        updatedAt: dept.updated_at
      }));
    },
    enabled: !!userProfile?.auditFirmId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
