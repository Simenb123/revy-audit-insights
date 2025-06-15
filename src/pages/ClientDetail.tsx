
import React, { useState } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import ClientBreadcrumb from '@/components/Clients/ClientDetails/ClientBreadcrumb';
import ClientNavigation from '@/components/Clients/ClientDetails/ClientNavigation';
import RevisionWorkflow from '@/components/Clients/ClientDetails/RevisionWorkflow';
import { PhaseContent } from '@/components/Clients/ClientDetails/PhaseContent';
import { AuditPhase } from '@/types/revio';

const ClientDetail = () => {
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const [selectedPhase, setSelectedPhase] = useState<AuditPhase>('overview');

  console.log('ClientDetail - orgNumber from params:', orgNumber);

  // Ensure orgNumber exists before making the query
  const { data: client, isLoading, error } = useClientDetails(orgNumber || '');

  console.log('ClientDetail - client data:', client);
  console.log('ClientDetail - loading state:', isLoading);
  console.log('ClientDetail - error:', error);

  if (!orgNumber) {
    return (
      <div className="text-center py-12">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Ugyldig organisasjonsnummer i URL. Gå tilbake til klientoversikten.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Feil ved lasting av klientdata: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Kunne ikke finne klient med organisasjonsnummer {orgNumber}. 
            Kontroller at nummeret er korrekt eller at du har tilgang til denne klienten.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handlePhaseClick = (phase: AuditPhase) => {
    setSelectedPhase(phase);
  };

  return (
    <div className="space-y-6 p-6">
      <ClientBreadcrumb client={client} />
      
      <Routes>
        <Route 
          path="/" 
          element={
            <div className="space-y-6">
              <RevisionWorkflow 
                currentPhase={client.phase || 'overview'} 
                progress={client.progress || 0}
                onPhaseClick={handlePhaseClick}
              />
              <PhaseContent phase={selectedPhase} client={client} />
            </div>
          } 
        />
      </Routes>
    </div>
  );
};

export default ClientDetail;
