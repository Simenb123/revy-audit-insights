import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useUserGroups() {
  const { data } = useQuery({
    queryKey: ['user-groups'],
    queryFn: async () => {
      const { data: sessionRes } = await supabase.auth.getSession();
      const userId = sessionRes.session?.user.id;
      if (!userId) return { teamIds: [] as string[], departmentId: null as string | null, firmId: null as string | null };

      const [{ data: teams }, { data: departmentId }, { data: firmId }] = await Promise.all([
        supabase.rpc('get_user_team_ids', { user_uuid: userId }),
        supabase.rpc('get_user_department', { user_uuid: userId }),
        supabase.rpc('get_user_firm', { user_uuid: userId }),
      ]);

      const teamIds = (teams || []).map((t: { team_id: string }) => t.team_id);
      return { teamIds, departmentId: departmentId ? String(departmentId) : null, firmId: firmId ? String(firmId) : null };
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    teamIds: data?.teamIds || [],
    departmentId: data?.departmentId || null,
    firmId: data?.firmId || null,
  };
}
