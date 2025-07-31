import { logger } from '@/utils/logger';

import React, { useState } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import ResponsiveLayout from '@/components/Layout/ResponsiveLayout';
import StandardPageLayout from '@/components/Layout/StandardPageLayout';
import ClientNavigation from '@/components/Clients/ClientDetails/ClientNavigation';
import ClientPageHeader from '@/components/Layout/ClientPageHeader';
import ClientRedirect from '@/components/Layout/ClientRedirect';
import RevisionWorkflow from '@/components/Clients/ClientDetails/RevisionWorkflow';
import PhaseContent from '@/components/Clients/ClientDetails/PhaseContent';
import { AuditPhase } from '@/types/revio';

const ClientDetail = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [selectedPhase, setSelectedPhase] = useState<AuditPhase>('overview');

  logger.log('🏢 [CLIENT_DETAIL] Component rendered:', {
    clientId,
    selectedPhase,
    currentPath: window.location.pathname
  });

  // Ensure clientId exists before making the query
  const { data: client, isLoading, error } = useClientDetails(clientId || '');

  logger.log('🏢 [CLIENT_DETAIL] Client query result:', {
    clientId,
    client: client ? {
      id: client.id,
      name: client.name,
      company_name: client.company_name,
      org_number: client.org_number
    } : null,
    isLoading,
    error: error?.message
  });

  if (!clientId) {
    logger.error('❌ [CLIENT_DETAIL] No clientId in URL params');
    return (
      <ResponsiveLayout>
        <StandardPageLayout>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Ugyldig klient-ID</h1>
            <p className="text-muted-foreground">
              Klient-ID mangler i URL-en
            </p>
          </div>
        </StandardPageLayout>
      </ResponsiveLayout>
    );
  }

  if (isLoading) {
    logger.log('⏳ [CLIENT_DETAIL] Loading client data...');
    return (
      <ResponsiveLayout>
        <StandardPageLayout>
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-96" />
            <Skeleton className="h-64 w-full" />
          </div>
        </StandardPageLayout>
      </ResponsiveLayout>
    );
  }

  if (error) {
    logger.error('❌ [CLIENT_DETAIL] Error loading client:', error);
    return (
      <ResponsiveLayout>
        <StandardPageLayout>
          <div className="text-center py-12">
            <Alert variant="destructive" className="max-w-md mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Feil ved lasting av klientdata: {error.message}
              </AlertDescription>
            </Alert>
          </div>
        </StandardPageLayout>
      </ResponsiveLayout>
    );
  }

  if (!client) {
    logger.error('❌ [CLIENT_DETAIL] No client found for clientId:', clientId);
    return (
      <ResponsiveLayout>
        <StandardPageLayout>
          <div className="text-center py-12">
            <Alert variant="destructive" className="max-w-md mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Kunne ikke finne klient med ID {clientId}. 
                Kontroller at ID-en er korrekt eller at du har tilgang til denne klienten.
              </AlertDescription>
            </Alert>
          </div>
        </StandardPageLayout>
      </ResponsiveLayout>
    );
  }

  // Additional validation to ensure we have a valid client ID
  if (!client.id || client.id.trim() === '') {
    logger.error('❌ [CLIENT_DETAIL] Client loaded but ID is missing:', {
      client,
      clientId
    });
    return (
      <ResponsiveLayout>
        <StandardPageLayout>
          <div className="text-center py-12">
            <Alert variant="destructive" className="max-w-md mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Klient-data er ufullstendig (mangler ID). Prøv å oppdatere siden.
              </AlertDescription>
            </Alert>
          </div>
        </StandardPageLayout>
      </ResponsiveLayout>
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
    <ResponsiveLayout>
      <StandardPageLayout 
        header={
          <div className="space-y-0">
            <ClientPageHeader 
              clientName={client.company_name} 
              orgNumber={client.org_number}
            />
            <ClientNavigation />
          </div>
        }
      >
        <div className="space-y-6">
          {/* Overview Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revision Workflow */}
            <div className="lg:col-span-2">
              <RevisionWorkflow 
                currentPhase={client.phase}
                progress={client.progress || 0}
                onPhaseClick={setSelectedPhase}
                clientId={client.id}
              />
            </div>
            
            {/* Phase-specific content */}
            <div className="lg:col-span-1">
              <PhaseContent 
                phase={selectedPhase} 
                client={client}
              />
            </div>
          </div>
        </div>
      </StandardPageLayout>
    </ResponsiveLayout>
  );
};

export default ClientDetail;
