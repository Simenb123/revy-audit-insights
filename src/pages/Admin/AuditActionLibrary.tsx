import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AuditActionLibraryManager from '@/components/Admin/AuditActionLibraryManager';
import ActionTemplatesList from '@/components/Admin/ActionTemplatesList';

const AuditActionLibrary = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Revisjonshandlinger</h1>
        <p className="text-muted-foreground mt-2">
          Administrer handlingsmaler og kartlegginger for revisjonsarbeid
        </p>
      </div>
      
      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">Handlingsmaler</TabsTrigger>
          <TabsTrigger value="mappings">Kartlegginger</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="mt-6">
          <ActionTemplatesList />
        </TabsContent>
        
        <TabsContent value="mappings" className="mt-6">
          <AuditActionLibraryManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuditActionLibrary;