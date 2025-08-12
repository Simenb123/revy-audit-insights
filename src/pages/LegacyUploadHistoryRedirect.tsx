import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function LegacyUploadHistoryRedirect(): null {
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const navigate = useNavigate();

  const { data: client } = useQuery({
    queryKey: ['client-by-org-number', orgNumber],
    queryFn: async () => {
      if (!orgNumber) return null;
      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .eq('org_number', orgNumber)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!orgNumber,
  });

  useEffect(() => {
    if (client?.id) {
      navigate(`/clients/${client.id}/upload-history`, { replace: true });
    }
  }, [client, navigate]);

  return null;
}
