import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';
import type { FirmEmployee } from '@/types/organization';

export function useFirmEmployees() {
  const { data: userProfile } = useUserProfile();

  return useQuery({
    queryKey: ['firm-employees', userProfile?.auditFirmId],
    enabled: !!userProfile?.auditFirmId,
    staleTime: 1000 * 60 * 2,
    queryFn: async (): Promise<FirmEmployee[]> => {
      if (!userProfile?.auditFirmId) return [];

      const { data, error } = await (supabase as any)
        .from('firm_employees')
        .select('*')
        .eq('audit_firm_id', userProfile.auditFirmId)
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true });

      if (error) throw error;

      return (data || []).map((r: any) => ({
        id: r.id,
        auditFirmId: r.audit_firm_id,
        departmentId: r.department_id,
        profileId: r.profile_id,
        email: r.email,
        firstName: r.first_name,
        lastName: r.last_name,
        role: r.role,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })) as FirmEmployee[];
    },
  });
}
