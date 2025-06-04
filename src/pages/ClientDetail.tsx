
import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { Skeleton } from '@/components/ui/skeleton';
import ClientDetails from '@/components/Clients/ClientDetails/ClientDetails';
import ClientBreadcrumb from '@/components/Clients/ClientDetails/ClientBreadcrumb';
import ClientNavigation from '@/components/Clients/ClientDetails/ClientNavigation';

const ClientDetail = () => {
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const { data: client, isLoading } = useClientDetails(orgNumber || '');

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Klient ikke funnet</h1>
        <p className="text-gray-600">
          Kunne ikke finne klient med organisasjonsnummer {orgNumber}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <ClientBreadcrumb client={client} />
      <ClientNavigation orgNumber={client.orgNumber} />
      
      <Routes>
        <Route path="/" element={<ClientDetails client={client} />} />
      </Routes>
    </div>
  );
};

export default ClientDetail;
