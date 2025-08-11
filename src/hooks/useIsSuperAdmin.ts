import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

export function useIsSuperAdmin() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['is-superadmin', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return false;
      const { data, error } = await supabase.rpc('is_super_admin', {
        user_uuid: session.user.id,
      });
      if (error) throw error;
      return Boolean(data);
    },
    enabled: !!session?.user?.id,
    staleTime: 5 * 60 * 1000,
  });
}
