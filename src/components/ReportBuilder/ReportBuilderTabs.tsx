import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings2, Grid3X3, Palette } from 'lucide-react';
import { DashboardCanvas } from './DashboardCanvas';
import { AccountClassificationView } from './AccountClassification/AccountClassificationView';
import { ThemePanel } from './ThemePanel';

interface ReportBuilderTabsProps {
  clientId: string;
  selectedVersion: string;
  selectedFiscalYear: number;
  hasData: boolean;
}

export const ReportBuilderTabs = React.memo(({ 
  clientId, 
  selectedVersion, 
  selectedFiscalYear, 
  hasData 
}: ReportBuilderTabsProps) => {
  const isGlobal = clientId === 'global';
  
  // Always render the component, but show empty state when no data
  if (!hasData || (!selectedVersion && !isGlobal)) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
        <p>Ingen data tilgjengelig for rapportbygging</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="dashboard" className="flex items-center gap-2">
          <Grid3X3 className="h-4 w-4" />
          Dashboard
        </TabsTrigger>
        {!isGlobal && (
          <TabsTrigger value="classification" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Klassifisering
          </TabsTrigger>
        )}
        <TabsTrigger value="theme" className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Tema
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard" className="space-y-4" forceMount>
        <div className="min-h-[600px]">
          <DashboardCanvas clientId={clientId} selectedVersion={selectedVersion} />
        </div>
      </TabsContent>

      {!isGlobal && (
        <TabsContent value="classification" className="space-y-4" forceMount>
          <AccountClassificationView 
            clientId={clientId}
            selectedVersion={selectedVersion}
            selectedFiscalYear={selectedFiscalYear}
          />
        </TabsContent>
      )}

      <TabsContent value="theme" className="space-y-4" forceMount>
        <ThemePanel />
      </TabsContent>
    </Tabs>
  );
});