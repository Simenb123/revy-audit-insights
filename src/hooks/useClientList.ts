
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientListItem {
  id: string;
  name: string;
  company_name: string;
  org_number: string;
}

export function useClientList() {
  return useQuery({
    queryKey: ['client-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, company_name, org_number')
        .order('company_name');

      if (error) {
        console.error('Error fetching client list:', error);
        throw error;
      }

      return data as ClientListItem[];
    }
  });
}
