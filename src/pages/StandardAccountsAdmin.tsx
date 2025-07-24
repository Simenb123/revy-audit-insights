import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StandardAccountTable from '@/components/Admin/StandardAccountTable';
import AccountMappingRulesManager from '@/components/Admin/AccountMappingRulesManager';
import FinancialStatementGenerator from '@/components/Accounting/FinancialStatementGenerator';

const StandardAccountsAdmin = () => {
  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="accounts">Standardkontoer</TabsTrigger>
          <TabsTrigger value="mapping-rules">Mappingregler</TabsTrigger>
          <TabsTrigger value="preview">Forhåndsvisning</TabsTrigger>
        </TabsList>
        
        <TabsContent value="accounts">
          <StandardAccountTable />
        </TabsContent>
        
        <TabsContent value="mapping-rules">
          <AccountMappingRulesManager />
        </TabsContent>
        
        <TabsContent value="preview">
          <FinancialStatementGenerator clientId="demo" period="2024" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StandardAccountsAdmin;
