import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScenarioSelector } from '@/components/Revisorskolen/ScenarioSelector';
import { GameInterface } from '@/components/Revisorskolen/GameInterface';
import { useTrainingScenarios } from '@/hooks/useTrainingScenarios';
import { useState } from 'react';
import { GraduationCap, BookOpen, Trophy } from 'lucide-react';

export default function Revisorskolen() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const { data: scenarios, isLoading } = useTrainingScenarios();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <GraduationCap className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Revisorskolen</h1>
          <p className="text-muted-foreground">
            Øv på revisjonssituasjoner i et trygt miljø med interaktive scenarioer
          </p>
        </div>
      </div>

      <Tabs defaultValue="scenarios" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scenarios" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Scenarioer
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2" disabled={!activeRunId}>
            <GraduationCap className="h-4 w-4" />
            Aktiv øving
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Resultater
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Velg et øvingsscenario</CardTitle>
              <CardDescription>
                Hvert scenario gir deg muligheten til å øve på spesifikke revisjonssituasjoner
                med et begrenset budsjett og mål om å levere høy kvalitet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <ScenarioSelector 
                  scenarios={scenarios || []}
                  onSelectScenario={(scenarioId, runId) => {
                    setSelectedScenarioId(scenarioId);
                    setActiveRunId(runId);
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          {activeRunId && selectedScenarioId ? (
            <GameInterface 
              runId={activeRunId}
              scenarioId={selectedScenarioId}
              onComplete={() => {
                setActiveRunId(null);
                setSelectedScenarioId(null);
              }}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  Ingen aktiv øving. Velg et scenario fra "Scenarioer"-fanen for å begynne.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dine resultater</CardTitle>
              <CardDescription>
                Oversikt over gjennomførte øvinger og prestasjoner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center p-8">
                Resultater vil vises her etter gjennomførte øvinger.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}