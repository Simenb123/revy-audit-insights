import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Settings2, Grid3X3 } from 'lucide-react';
import { DashboardCanvas } from './DashboardCanvas';
import { AccountClassificationView } from './AccountClassification/AccountClassificationView';

interface ReportBuilderTabsProps {
  clientId: string;
  selectedVersion: string;
  selectedFiscalYear: number;
  hasData: boolean;
}

export function ReportBuilderTabs({ 
  clientId, 
  selectedVersion, 
  selectedFiscalYear, 
  hasData 
}: ReportBuilderTabsProps) {
  if (!hasData || !selectedVersion) {
    return null;
  }

  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="dashboard" className="flex items-center gap-2">
          <Grid3X3 className="h-4 w-4" />
          Dashboard
        </TabsTrigger>
        <TabsTrigger value="classification" className="flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Klassifisering
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="dashboard" className="space-y-4">
        <div className="min-h-[600px]">
          <DashboardCanvas clientId={clientId} selectedVersion={selectedVersion} />
        </div>
      </TabsContent>
      
      <TabsContent value="classification" className="space-y-4">
        <AccountClassificationView 
          clientId={clientId}
          selectedVersion={selectedVersion}
          selectedFiscalYear={selectedFiscalYear}
        />
      </TabsContent>
    </Tabs>
  );
}