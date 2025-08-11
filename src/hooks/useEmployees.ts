
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EmployeeProfile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  user_role: string | null;
  initials: string | null;
  initials_color: string | null;
  is_active: boolean | null;
}

export const useEmployees = () => {
  return useQuery({
    queryKey: ['employees-firm'],
    queryFn: async (): Promise<EmployeeProfile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, user_role, initials, initials_color, is_active')
        .order('last_name', { ascending: true });

      if (error) throw error;
      return (data || []) as EmployeeProfile[];
    },
    staleTime: 1000 * 60 * 2,
  });
};
