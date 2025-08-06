import React, { useState } from 'react';
import { WidgetManagerProvider } from '@/contexts/WidgetManagerContext';
import { DashboardCanvas } from './DashboardCanvas';
import { WidgetLibrary } from './WidgetLibrary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Save, Share, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTrialBalanceWithMappings } from '@/hooks/useTrialBalanceWithMappings';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

interface ReportBuilderProps {
  clientId: string;
}

export default function ReportBuilder({ clientId }: ReportBuilderProps) {
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const { selectedFiscalYear } = useFiscalYear();
  
  // Check if we have trial balance data for widgets
  const { data: trialBalanceData, isLoading } = useTrialBalanceWithMappings(
    clientId, 
    selectedFiscalYear
  );

  const hasData = trialBalanceData && trialBalanceData.trialBalanceEntries.length > 0;

  return (
    <WidgetManagerProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div>
            <h2 className="text-2xl font-bold">Rapportbygger</h2>
            <p className="text-muted-foreground">
              Bygg tilpassede dashboards og rapporter basert på regnskapsdata
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setShowWidgetLibrary(!showWidgetLibrary)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Legg til widget
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Lagre rapport
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Share className="h-4 w-4" />
              Del
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Eksporter
            </Button>
          </div>
        </div>

        {/* Data Status */}
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <p>Laster regnskapsdata...</p>
            </CardContent>
          </Card>
        ) : !hasData ? (
          <Card>
            <CardHeader>
              <CardTitle>Ingen regnskapsdata funnet</CardTitle>
              <CardDescription>
                Last opp saldobalanse for regnskapsår {selectedFiscalYear} for å bruke rapportbyggeren
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {/* Widget Library */}
        {showWidgetLibrary && hasData && (
          <Card>
            <CardHeader>
              <CardTitle>Widget bibliotek</CardTitle>
              <CardDescription>
                Velg widgets for å legge til i rapporten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WidgetLibrary 
                clientId={clientId}
                onClose={() => setShowWidgetLibrary(false)}
              />
            </CardContent>
          </Card>
        )}

        {/* Dashboard Canvas */}
        {hasData && (
          <div className="min-h-[600px]">
            <DashboardCanvas clientId={clientId} />
          </div>
        )}
      </div>
    </WidgetManagerProvider>
  );
}