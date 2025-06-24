import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { devLog } from '@/utils/devLogger';

export const useClientLookup = (clientIdOrOrgNumber?: string) => {
  return useQuery({
    queryKey: ['client-lookup', clientIdOrOrgNumber],
    queryFn: async () => {
      if (!clientIdOrOrgNumber) return null;
      
      // If it looks like a UUID (36 chars with dashes), use it directly
      if (clientIdOrOrgNumber.length === 36 && clientIdOrOrgNumber.includes('-')) {
        return { id: clientIdOrOrgNumber };
      }
      
      // Otherwise, treat it as an organization number and look up the UUID
      devLog('Looking up client UUID for org number:', clientIdOrOrgNumber);
      
      const { data: client, error } = await supabase
        .from('clients')
        .select('id')
        .eq('org_number', clientIdOrOrgNumber)
        .single();

      if (error) {
        devLog('Error looking up client:', error);
        return null;
      }

      devLog('Found client UUID:', client?.id);
      return client;
    },
    enabled: !!clientIdOrOrgNumber,
  });
};
