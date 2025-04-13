
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DrillDownTable from '@/components/DataAnalysis/DrillDownTable';
import TransactionSampling from '@/components/DataAnalysis/TransactionSampling';
import VersionSelector from '@/components/DataAnalysis/VersionSelector';
import VersionHistory from '@/components/DataAnalysis/VersionHistory';  // Added import
import { 
  BarChart4, 
  LayoutPanelLeft, 
  ListFilter, 
  History,
  ScanLine
} from 'lucide-react';
import { DocumentVersion } from '@/types/revio';

const AccountingExplorer = () => {
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion>('final');
  
  const handleVersionChange = (version: DocumentVersion) => {
    setSelectedVersion(version);
    console.log(`Switched to version: ${version}`);
    // In a real app, this would trigger data reload
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Regnskapsanalyse</h1>
          <p className="text-muted-foreground mt-1">
            Utforsk regnskapstall, transaksjoner og utfør analyser
          </p>
        </div>
        
        <VersionSelector 
          selectedVersion={selectedVersion}
          onVersionChange={handleVersionChange}
        />
      </div>
      
      <Tabs defaultValue="drilldown" className="mb-8">
        <TabsList className="grid grid-cols-4 w-[600px]">
          <TabsTrigger value="drilldown" className="flex items-center gap-2">
            <BarChart4 size={16} />
            <span>Drill-down</span>
          </TabsTrigger>
          <TabsTrigger value="sampling" className="flex items-center gap-2">
            <ListFilter size={16} />
            <span>Transaksjonsutvalg</span>
          </TabsTrigger>
          <TabsTrigger value="mapping" className="flex items-center gap-2">
            <LayoutPanelLeft size={16} />
            <span>Kontoplan</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History size={16} />
            <span>Versjonshistorikk</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="drilldown" className="mt-6">
          <DrillDownTable />
        </TabsContent>
        
        <TabsContent value="sampling" className="mt-6">
          <TransactionSampling />
        </TabsContent>
        
        <TabsContent value="mapping" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Mapping av kontoplan</CardTitle>
              <CardDescription>
                Dra kontoer til riktige regnskapslinjer for å organisere regnskapet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 text-center">
                <ScanLine className="mx-auto h-12 w-12 text-muted-foreground/70 mb-4" />
                <h3 className="text-lg font-medium mb-2">Kontoplan mapping</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Her kan du dra og slippe kontoer til riktige regnskapslinjer. 
                  Systemet vil oppdatere beregningene automatisk.
                </p>
              </div>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              Last opp en kontoplan eller bruk standard kontoplan for å komme i gang.
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <VersionHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountingExplorer;
