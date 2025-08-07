import { logger } from '@/utils/logger';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientListItem {
  id: string;
  name: string;
  company_name: string;
  org_number: string;
  client_group: string | null;
}

export function useClientList() {
  return useQuery({
    queryKey: ['client-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, company_name, org_number, client_group')
        .order('company_name');

      if (error) {
        logger.error('Error fetching client list:', error);
        throw error;
      }

      return data as ClientListItem[];
    }
  });
}
