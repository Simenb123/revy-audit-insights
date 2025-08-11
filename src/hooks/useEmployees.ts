
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
      // Bruk any-cast for å unngå TypeScript-feil inntil Supabase-typene er oppdatert
      const { data, error } = await (supabase as any)
        .from('profiles' as any)
        .select('id, email, first_name, last_name, user_role, initials, initials_color, is_active')
        .order('last_name', { ascending: true });

      if (error) throw error;

      // Map eksplisitt til vårt UI-interface
      const rows = (data || []).map((r: any) => ({
        id: r.id,
        email: r.email ?? null,
        first_name: r.first_name ?? null,
        last_name: r.last_name ?? null,
        user_role: r.user_role ?? null,
        initials: r.initials ?? null,
        initials_color: r.initials_color ?? null,
        is_active: r.is_active ?? null,
      })) as EmployeeProfile[];

      return rows;
    },
    staleTime: 1000 * 60 * 2,
  });
};
