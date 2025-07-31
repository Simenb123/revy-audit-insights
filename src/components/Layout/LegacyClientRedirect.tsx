import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const LegacyClientRedirect = (): null => {
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const navigate = useNavigate();

  // Query to find client by org_number
  const { data: client } = useQuery({
    queryKey: ['client-by-org-number', orgNumber],
    queryFn: async () => {
      if (!orgNumber) return null;
      
      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .eq('org_number', orgNumber)
        .single();
      
      if (error) {
        console.error('Error finding client by org number:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!orgNumber
  });

  useEffect(() => {
    if (client?.id) {
      // Redirect to new URL structure
      navigate(`/clients/${client.id}/trial-balance`, { replace: true });
    } else if (orgNumber && client === null) {
      // If query completed but no client found, redirect to client list
      navigate('/clients', { replace: true });
    }
  }, [client, orgNumber, navigate]);

  return null;
};

export default LegacyClientRedirect;