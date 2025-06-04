
import React from 'react';
import { useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { Skeleton } from '@/components/ui/skeleton';
import ClientBreadcrumb from '@/components/Clients/ClientDetails/ClientBreadcrumb';
import EngagementChecklist from '@/components/Engagement/EngagementChecklist';

const EngagementAssessment = () => {
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const { data: client, isLoading, error } = useClientDetails(orgNumber || '');

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Feil ved lasting av klient</h1>
        <p className="text-gray-600">
          Det oppstod en feil: {error.message}
        </p>
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
      <EngagementChecklist clientId={client.id} clientName={client.name} />
    </div>
  );
};

export default EngagementAssessment;
