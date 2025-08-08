import { useEffect } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { useRecentClients } from '@/hooks/useRecentClients';
import { useClientData } from '@/components/Clients/ClientFetcher/useClientData';
import { useClientDetails } from '@/hooks/useClientDetails';

const ClientHistoryById = ({ clientId }: { clientId: string }): null => {
  const { addRecentClient } = useRecentClients();
  const { data: clientDetails } = useClientDetails(clientId);

  useEffect(() => {
    if (clientDetails) {
      console.log('Tracking client visit:', clientDetails.name);
      addRecentClient({
        id: clientDetails.id,
        name: clientDetails.name,
        url: `/clients/${clientDetails.id}`
      });
    }
  }, [clientId, clientDetails, addRecentClient]);

  return null;
};

const ClientHistoryByOrg = ({ orgNumber }: { orgNumber: string }): null => {
  const { addRecentClient } = useRecentClients();
  const { data: clients } = useClientData();

  useEffect(() => {
    const client = clients?.find(c => c.org_number === orgNumber);
    if (client) {
      console.log('Tracking legacy client visit:', client.name);
      addRecentClient({
        id: client.id,
        name: client.name,
        orgNumber: client.org_number,
        url: `/klienter/${orgNumber}`
      });
    }
  }, [orgNumber, clients, addRecentClient]);

  return null;
};

export const ClientHistoryTracker = () => {
  const location = useLocation();

  const clientMatch = matchPath('/clients/:clientId/*', location.pathname);
  if (clientMatch?.params.clientId) {
    return <ClientHistoryById clientId={clientMatch.params.clientId} />;
  }

  const orgMatch = matchPath('/klienter/:orgNumber/*', location.pathname);
  if (orgMatch?.params.orgNumber) {
    return <ClientHistoryByOrg orgNumber={orgMatch.params.orgNumber} />;
  }

  return null; // This component doesn't render anything
};
