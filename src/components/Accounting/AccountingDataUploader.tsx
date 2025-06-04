
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Database, Mapping } from 'lucide-react';
import ChartOfAccountsUploader from './ChartOfAccountsUploader';
import AccountMappingTable from './AccountMappingTable';
import GeneralLedgerUploader from './GeneralLedgerUploader';
import TrialBalanceUploader from './TrialBalanceUploader';

interface AccountingDataUploaderProps {
  clientId: string;
  clientName: string;
}

const AccountingDataUploader = ({ clientId, clientName }: AccountingDataUploaderProps) => {
  const [activeTab, setActiveTab] = useState('chart-of-accounts');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Database className="w-6 h-6" />
        <div>
          <h2 className="text-2xl font-bold">Regnskapsdata</h2>
          <p className="text-muted-foreground">
            Last opp og administrer regnskapsdata for {clientName}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chart-of-accounts">Kontoplan</TabsTrigger>
          <TabsTrigger value="mapping">Kontomapping</TabsTrigger>
          <TabsTrigger value="general-ledger">Hovedbok</TabsTrigger>
          <TabsTrigger value="trial-balance">Saldobalanse</TabsTrigger>
        </TabsList>

        <TabsContent value="chart-of-accounts" className="space-y-4">
          <ChartOfAccountsUploader 
            clientId={clientId}
            onUploadComplete={() => {
              // Automatically switch to mapping tab after upload
              setActiveTab('mapping');
            }}
          />
        </TabsContent>

        <TabsContent value="mapping" className="space-y-4">
          <AccountMappingTable clientId={clientId} />
        </TabsContent>

        <TabsContent value="general-ledger" className="space-y-4">
          <GeneralLedgerUploader clientId={clientId} />
        </TabsContent>

        <TabsContent value="trial-balance" className="space-y-4">
          <TrialBalanceUploader clientId={clientId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountingDataUploader;
