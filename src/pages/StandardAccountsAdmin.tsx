import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StandardAccountTable from '@/components/Admin/StandardAccountTable';
import AccountMappingRulesManager from '@/components/Admin/AccountMappingRulesManager';
import FinancialStatementGenerator from '@/components/Accounting/FinancialStatementGenerator';
import AccountCategoriesManager from '@/components/Admin/AccountCategoriesManager';
import MainGroupsManager from '@/components/Admin/MainGroupsManager';

const StandardAccountsAdmin = () => {
  return (
    <div className="w-full py-6">
      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="accounts">Standardkontoer</TabsTrigger>
          <TabsTrigger value="categories">Kategorier</TabsTrigger>
          <TabsTrigger value="main-groups">Hovedgrupper</TabsTrigger>
          <TabsTrigger value="mapping-rules">Mappingregler</TabsTrigger>
          <TabsTrigger value="preview">Forhåndsvisning</TabsTrigger>
        </TabsList>
        
        <TabsContent value="accounts">
          <StandardAccountTable />
        </TabsContent>
        
        <TabsContent value="categories">
          <AccountCategoriesManager />
        </TabsContent>
        
        <TabsContent value="main-groups">
          <MainGroupsManager />
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
