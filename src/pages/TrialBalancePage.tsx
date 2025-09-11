import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useTBVersionOptions } from '@/hooks/useTrialBalanceVersions';
import StickyClientLayout from '@/components/Layout/StickyClientLayout';
import TrialBalanceView from '@/components/Accounting/TrialBalanceView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

const TrialBalancePage = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { selectedFiscalYear, setSelectedClientId } = useFiscalYear();
  const { data: client, isLoading: clientLoading, error: clientError } = useClientDetails(clientId || '');
  const { data: versionOptions, isLoading: versionLoading } = useTBVersionOptions(clientId || '', selectedFiscalYear);

  useEffect(() => {
    if (client?.id) {
      setSelectedClientId(client.id);
    }
  }, [client, setSelectedClientId]);

  if (clientLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (clientError || !client) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Feil</CardTitle>
            <CardDescription>
              Kunne ikke laste klientdata eller klient ikke funnet.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!clientId) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Ugyldig klient-ID</CardTitle>
            <CardDescription>
              Klient-ID mangler i URL-en.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const hasData = versionOptions && versionOptions.length > 0 && !versionLoading;

  return (
    <StickyClientLayout
      clientName={client.company_name}
      orgNumber={client.org_number}
      pageTitle="Saldobalanse"
    >
      <div className="p-6 space-y-6">
        {!hasData ? (
          // Empty state
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Layers className="h-6 w-6" />
                Ingen saldobalanse data
              </CardTitle>
              <CardDescription className="max-w-md mx-auto">
                For å se saldobalanse må du først laste opp regnskapsdata for {selectedFiscalYear}.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button asChild className="gap-2">
                <Link to={`/clients/${clientId}/trial-balance`}>
                  <Upload className="h-4 w-4" />
                  Last opp regnskapsdata
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Data exists - show table with upload new version button
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Saldobalanse</h2>
                <p className="text-sm text-muted-foreground">
                  {versionOptions.length} versjon(er) tilgjengelig for {selectedFiscalYear}
                </p>
              </div>
              <Button asChild variant="outline" className="gap-2">
                <Link to={`/clients/${clientId}/trial-balance`}>
                  <Upload className="h-4 w-4" />
                  Last opp ny versjon
                </Link>
              </Button>
            </div>
            
            <TrialBalanceView clientId={clientId} />
          </div>
        )}
      </div>
    </StickyClientLayout>
  );
};

export default TrialBalancePage;