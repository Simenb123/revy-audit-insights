import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StandardAccountManager from '@/components/Admin/StandardAccountManager';
import AccountMappingRulesManager from '@/components/Admin/AccountMappingRulesManager';

const StandardAccountsAdmin = () => {
  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="accounts">Standardkontoer</TabsTrigger>
          <TabsTrigger value="mapping-rules">Mappingregler</TabsTrigger>
        </TabsList>
        
        <TabsContent value="accounts">
          <StandardAccountManager />
        </TabsContent>
        
        <TabsContent value="mapping-rules">
          <AccountMappingRulesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StandardAccountsAdmin;
