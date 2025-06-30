import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UserRole } from '@/types/organization';

export interface UserSummary {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  user_role: UserRole;
}

export const useAllUserProfiles = () => {
  return useQuery({
    queryKey: ['all-user-profiles'],
    queryFn: async (): Promise<UserSummary[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, user_role')
        .order('last_name', { ascending: true });
      if (error) throw error;
      return data as UserSummary[];
    },
  });
};
