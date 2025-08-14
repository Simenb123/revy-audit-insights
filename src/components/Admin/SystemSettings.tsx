import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from 'lucide-react';

const SystemSettings = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Systeminnstillinger</h1>
        <p className="text-muted-foreground">
          Konfigurer systemparametere og innstillinger
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Kommer snart
          </CardTitle>
          <CardDescription>
            Denne funksjonen er under utvikling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Avanserte systeminnstillinger og konfigurasjonsalternativer kommer snart.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;