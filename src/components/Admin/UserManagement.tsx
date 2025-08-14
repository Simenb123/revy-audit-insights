import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EnhancedUserManagement from './EnhancedUserManagement';
import GranularAccessControl from './GranularAccessControl';

const UserManagement = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brukeradministrasjon</h1>
          <p className="text-muted-foreground">
            Komplett bruker- og tilgangsadministrasjon med avanserte funksjoner
          </p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">Brukerbehandling</TabsTrigger>
          <TabsTrigger value="access">Tilgangskontroll</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <EnhancedUserManagement />
        </TabsContent>

        <TabsContent value="access">
          <GranularAccessControl />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagement;