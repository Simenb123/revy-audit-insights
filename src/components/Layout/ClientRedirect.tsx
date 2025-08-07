import { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const ClientRedirect = (): null => {
  const { clientId, orgNumber } = useParams<{
    clientId?: string;
    orgNumber?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();

  // If we have an orgNumber, look up the client ID
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
    if (clientId && location.pathname === `/clients/${clientId}`) {
      // Redirect base client route to trial-balance
      navigate(`/clients/${clientId}/trial-balance`, { replace: true });
    } else if (client?.id) {
      // Redirect legacy org number route to new URL structure
      navigate(`/clients/${client.id}/trial-balance`, { replace: true });
    } else if (orgNumber && client === null) {
      // If lookup completed but no client found, go to client list
      navigate('/clients', { replace: true });
    }
  }, [clientId, client, orgNumber, navigate, location.pathname]);

  return null;
};

export default ClientRedirect;