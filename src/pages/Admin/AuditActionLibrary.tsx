import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AuditActionLibraryManager from '@/components/Admin/AuditActionLibraryManager';
import ActionTemplatesList from '@/components/Admin/ActionTemplatesList';
import AuditActionGenerator from '@/components/AIRevyAdmin/AuditActionGenerator';

const AuditActionLibrary = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Handlingsmaler</TabsTrigger>
          <TabsTrigger value="generator">AI-generering</TabsTrigger>
          <TabsTrigger value="mappings">Kartlegginger</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="mt-6">
          <ActionTemplatesList />
        </TabsContent>
        
        <TabsContent value="generator" className="mt-6">
          <AuditActionGenerator />
        </TabsContent>
        
        <TabsContent value="mappings" className="mt-6">
          <AuditActionLibraryManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuditActionLibrary;