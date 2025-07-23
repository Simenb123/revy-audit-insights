
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ColumnMappingAdmin from '@/components/DataUpload/ColumnMappingAdmin';
import { Brain, Settings, Zap, Users, Database } from 'lucide-react';

const AIRevyAdmin = () => {
  const [activeSection, setActiveSection] = useState<'overview' | 'column-mapping'>('overview');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Revy Admin</h1>
        <p className="text-muted-foreground">
          Administrer AI-konfigurasjoner og innstillinger for Revy-systemet
        </p>
      </div>

      <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Oversikt</TabsTrigger>
          <TabsTrigger value="column-mapping">Kolonne-mapping</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveSection('column-mapping')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Kolonne-mapping
                </CardTitle>
                <CardDescription>
                  Administrer feltdefinisjoner for dataopplasting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">Aktiv</Badge>
              </CardContent>
            </Card>

            <Card className="opacity-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Prompt-konfigurasjon
                </CardTitle>
                <CardDescription>
                  Administrer AI-prompts for ulike kontekster
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="outline">Kommer snart</Badge>
              </CardContent>
            </Card>

            <Card className="opacity-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Modelkonfigurasjoner
                </CardTitle>
                <CardDescription>
                  Justere AI-modell parametere og innstillinger
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="outline">Kommer snart</Badge>
              </CardContent>
            </Card>

            <Card className="opacity-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Performance tuning
                </CardTitle>
                <CardDescription>
                  Optimalisere AI-ytelse for bedre brukeropplevelse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="outline">Kommer snart</Badge>
              </CardContent>
            </Card>

            <Card className="opacity-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Roller og tilganger
                </CardTitle>
                <CardDescription>
                  Administrer hvem som har tilgang til AI-funksjoner
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="outline">Kommer snart</Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="column-mapping" className="space-y-6">
          <ColumnMappingAdmin />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIRevyAdmin;
