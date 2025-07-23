import { logger } from '@/utils/logger';

import React, { useState } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import ClientBreadcrumb from '@/components/Clients/ClientDetails/ClientBreadcrumb';
import ClientNavigation from '@/components/Clients/ClientDetails/ClientNavigation';
import RevisionWorkflow from '@/components/Clients/ClientDetails/RevisionWorkflow';
import PhaseContent from '@/components/Clients/ClientDetails/PhaseContent';
import { AuditPhase } from '@/types/revio';

const ClientDetail = () => {
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const [selectedPhase, setSelectedPhase] = useState<AuditPhase>('overview');

  logger.log('🏢 [CLIENT_DETAIL] Component rendered:', {
    orgNumber,
    selectedPhase,
    currentPath: window.location.pathname
  });

  // Ensure orgNumber exists before making the query
  const { data: client, isLoading, error } = useClientDetails(orgNumber || '');

  logger.log('🏢 [CLIENT_DETAIL] Client query result:', {
    orgNumber,
    client: client ? {
      id: client.id,
      name: client.name,
      company_name: client.company_name,
      org_number: client.org_number
    } : null,
    isLoading,
    error: error?.message
  });

  if (!orgNumber) {
    logger.error('❌ [CLIENT_DETAIL] No orgNumber in URL params');
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
    logger.log('⏳ [CLIENT_DETAIL] Loading client data...');
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    logger.error('❌ [CLIENT_DETAIL] Error loading client:', error);
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
    logger.error('❌ [CLIENT_DETAIL] No client found for orgNumber:', orgNumber);
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

  // Additional validation to ensure we have a valid client ID
  if (!client.id || client.id.trim() === '') {
    logger.error('❌ [CLIENT_DETAIL] Client loaded but ID is missing:', {
      client,
      orgNumber
    });
    return (
      <div className="text-center py-12">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Klient-data er ufullstendig (mangler ID). Prøv å oppdatere siden.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  logger.log('✅ [CLIENT_DETAIL] Client loaded successfully:', {
    id: client.id,
    name: client.name,
    company_name: client.company_name,
    org_number: client.org_number,
    phase: client.phase
  });

  const handlePhaseClick = (phase: AuditPhase) => {
    logger.log('🔄 [CLIENT_DETAIL] Phase changed:', { from: selectedPhase, to: phase });
    setSelectedPhase(phase);
  };

  return (
    <div className="space-y-4 p-6">
      <ClientBreadcrumb client={client} />
      
      <Routes>
        <Route 
          path="/" 
          element={
            <div className="space-y-4">
              <RevisionWorkflow 
                currentPhase={client.phase || 'overview'} 
                progress={client.progress || 0}
                onPhaseClick={handlePhaseClick}
                clientId={client.id}
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
