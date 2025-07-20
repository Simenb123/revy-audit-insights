import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClientRole } from '@/types/revio';

export const useClientRoles = (clientId: string) => {
  return useQuery({
    queryKey: ['client-roles', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_roles')
        .select('*')
        .eq('client_id', clientId)
        .order('role_type', { ascending: true });

      if (error) throw error;
      return data as ClientRole[];
    },
    enabled: !!clientId,
  });
};