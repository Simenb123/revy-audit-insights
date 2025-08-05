import { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useRecentClients } from '@/hooks/useRecentClients';
import { useClientData } from '@/components/Clients/ClientFetcher/useClientData';

export const ClientHistoryTracker = (): null => {
  const { clientId, orgNumber } = useParams();
  const location = useLocation();
  const { addRecentClient } = useRecentClients();
  const { data: clients } = useClientData();

  useEffect(() => {
    // Track client visits for /clients/:clientId routes
    if (clientId && location.pathname.startsWith('/clients/')) {
      const client = clients?.find(c => c.id === clientId);
      if (client) {
        addRecentClient({
          id: client.id,
          name: client.name,
          url: `/clients/${client.id}`
        });
      }
    }

    // Track client visits for /klienter/:orgNumber routes (legacy)
    if (orgNumber && location.pathname.startsWith('/klienter/')) {
      const client = clients?.find(c => c.org_number === orgNumber);
      if (client) {
        addRecentClient({
          id: client.id,
          name: client.name,
          orgNumber: client.org_number,
          url: `/klienter/${orgNumber}`
        });
      }
    }
  }, [clientId, orgNumber, location.pathname, clients, addRecentClient]);

  return null; // This component doesn't render anything
};