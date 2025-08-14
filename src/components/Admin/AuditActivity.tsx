import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from 'lucide-react';

const AuditActivity = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aktivitetslogg</h1>
        <p className="text-muted-foreground">
          Overvåk systemaktivitet og brukerhandlinger
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Kommer snart
          </CardTitle>
          <CardDescription>
            Denne funksjonen er under utvikling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Detaljert aktivitetslogging og audit trails kommer snart.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditActivity;