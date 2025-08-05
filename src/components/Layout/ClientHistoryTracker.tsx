import { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useRecentClients } from '@/hooks/useRecentClients';
import { useClientData } from '@/components/Clients/ClientFetcher/useClientData';
import { useClientDetails } from '@/hooks/useClientDetails';

export const ClientHistoryTracker = (): null => {
  const { clientId, orgNumber } = useParams();
  const location = useLocation();
  const { addRecentClient } = useRecentClients();
  
  // Use specific client details for /clients/:clientId routes (faster)
  const { data: clientDetails } = useClientDetails(clientId || '');
  
  // Use all clients data for legacy /klienter/:orgNumber routes
  const { data: clients } = useClientData();

  useEffect(() => {
    // Track client visits for /clients/:clientId routes
    if (clientId && location.pathname.startsWith('/clients/') && clientDetails) {
      console.log('Tracking client visit:', clientDetails.name);
      addRecentClient({
        id: clientDetails.id,
        name: clientDetails.name,
        url: `/clients/${clientDetails.id}`
      });
    }
  }, [clientId, location.pathname, clientDetails, addRecentClient]);

  useEffect(() => {
    // Track client visits for /klienter/:orgNumber routes (legacy)
    if (orgNumber && location.pathname.startsWith('/klienter/') && clients) {
      const client = clients.find(c => c.org_number === orgNumber);
      if (client) {
        console.log('Tracking legacy client visit:', client.name);
        addRecentClient({
          id: client.id,
          name: client.name,
          orgNumber: client.org_number,
          url: `/klienter/${orgNumber}`
        });
      }
    }
  }, [orgNumber, location.pathname, clients, addRecentClient]);

  return null; // This component doesn't render anything
};