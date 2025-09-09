import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from 'lucide-react';
import { isAdvancedAIEnabled } from '@/lib/featureFlags';

const RolePermissions = () => {
  // Don't render placeholder content if feature is disabled
  if (!isAdvancedAIEnabled()) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Roller & Tilgang</h1>
        <p className="text-muted-foreground">
          Administrer roller og tillatelser
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Kommer snart
          </CardTitle>
          <CardDescription>
            Denne funksjonen er under utvikling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Granulær tilgangskontroll og rolleadministrasjon kommer snart.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RolePermissions;