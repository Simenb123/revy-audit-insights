import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrainingSessionCard } from '@/components/Revisorskolen/TrainingSessionCard';
import { DocumentsPanel } from '@/components/Revisorskolen/DocumentsPanel';
import { CertificationManager } from '@/components/Revisorskolen/CertificationManager';
import { EnhancedTrainingChat } from '@/components/Revisorskolen/EnhancedTrainingChat';
import ScenarioStatistics from '@/components/Revisorskolen/ScenarioStatistics';
import TrainingReports from '@/components/Revisorskolen/TrainingReports';
import { ContentLibrary } from '@/components/Revisorskolen/ContentLibrary';
import { PersonalizedLearningPath } from '@/components/Revisorskolen/PersonalizedLearningPath';
import { UserPreferences } from '@/components/Revisorskolen/UserPreferences';
import { TrainingClientIntegration } from '@/components/Revisorskolen/TrainingClientIntegration';
import TrainingAuditIntegration from '@/components/Revisorskolen/TrainingAuditIntegration';
import TrainingSystemBridge from '@/components/Revisorskolen/TrainingSystemBridge';
import TestDataManager from '@/components/Revisorskolen/TestDataManager';
import TrainingDocumentation from '@/components/Revisorskolen/TrainingDocumentation';
import PerformanceMonitor from '@/components/Revisorskolen/PerformanceMonitor';
import TrainingSettings from '@/components/Revisorskolen/TrainingSettings';
import { useTrainingPrograms } from '@/hooks/useTrainingPrograms';
import { useTrainingSessions, useSessionProgress, useUpdateSessionProgress } from '@/hooks/useTrainingSessions';
import { useState } from 'react';
import { GraduationCap, BookOpen, Trophy, Users, Settings, BarChart3, FileText, Library, Target, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PageLayout from '@/components/Layout/PageLayout';

export default function Revisorskolen() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('sessions');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const { data: programs, isLoading: programsLoading } = useTrainingPrograms();
  const { data: sessions, isLoading: sessionsLoading } = useTrainingSessions(
    programs?.[0]?.id // Use first active program for now
  );
  const updateProgress = useUpdateSessionProgress();

  // Get progress for all sessions
  const sessionProgresses = sessions?.map(session => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data } = useSessionProgress(session.id);
    return { sessionId: session.id, progress: data };
  }) || [];

  const handleStartSession = async (sessionId: string) => {
    try {
      await updateProgress.mutateAsync({
        sessionId,
        status: 'in_progress'
      });
      setSelectedSessionId(sessionId);
      setActiveTab('active');
      toast({
        title: "Sesjon startet",
        description: "Du har startet en ny treningssesjon.",
      });
    } catch (error) {
      toast({
        title: "Feil",
        description: "Kunne ikke starte sesjonen. Prøv igjen.",
        variant: "destructive",
      });
    }
  };

  const handleContinueSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setActiveTab('active');
  };

  // Determine if sessions are locked (simplified logic for now)
  const getSessionLockStatus = (sessionIndex: number) => {
    // For now, all sessions are unlocked. In production, this would check access rights
    return false;
  };

  const isLoading = programsLoading || sessionsLoading;

  return (
    <PageLayout width="wide" spacing="normal">
      <div className="flex items-center gap-3 mb-8">
        <GraduationCap className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Revisorskolen</h1>
          <p className="text-muted-foreground">
            Lær praktisk revisjon gjennom interaktive scenarioer og kurert faginnhold
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-11">
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Sesjoner
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            Bibliotek
          </TabsTrigger>
          <TabsTrigger value="paths" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Læringsbaner
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Dokumenter
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2" disabled={!selectedSessionId}>
            <Users className="h-4 w-4" />
            Aktiv øving
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2" disabled={!selectedSessionId}>
            <Settings className="h-4 w-4" />
            AI-veileder
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Sertifisering
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistikk
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Rapporter
          </TabsTrigger>
          <TabsTrigger value="integration" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Integrering
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Innstillinger
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Testing
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Dokumentasjon
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overvåking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tilgjengelige treningssesjoner</CardTitle>
              <CardDescription>
                Velg en sesjon for å begynne din praktiske revisjonstrening. 
                Hver sesjon fokuserer på spesifikke ferdigheter og scenarioer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : sessions && sessions.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {sessions.map((session) => {
                    const progressData = sessionProgresses.find(p => p.sessionId === session.id);
                    return (
                      <TrainingSessionCard
                        key={session.id}
                        session={session}
                        progress={progressData?.progress}
                        isLocked={getSessionLockStatus(session.session_index)}
                        onStart={handleStartSession}
                        onContinue={handleContinueSession}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-8">
                  <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Ingen sesjoner tilgjengelig</h3>
                  <p className="text-sm text-muted-foreground">
                    Det er ingen aktive treningssesjoner for øyeblikket.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="library" className="space-y-6">
          <ContentLibrary />
        </TabsContent>

        <TabsContent value="paths" className="space-y-6">
          <PersonalizedLearningPath />
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          {selectedSessionId ? (
            <DocumentsPanel sessionId={selectedSessionId} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Velg en sesjon</h3>
                <p className="text-muted-foreground">
                  Velg en treningssesjon fra "Sesjoner"-fanen for å se fagbiblioteket.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          {selectedSessionId ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Aktiv treningssesjon</CardTitle>
                  <CardDescription>
                    Du arbeider nå med en interaktiv treningssesjon.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Treningsgrensesnitt kommer snart...
                  </p>
                  {/* Here we would include the actual training interface */}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Ingen aktiv øving. Velg en sesjon fra "Sesjoner"-fanen for å begynne.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="chat" className="space-y-6">
          {selectedSessionId ? (
            <Card>
              <CardHeader>
                <CardTitle>AI-veileder</CardTitle>
                <CardDescription>
                  Interaktiv chat med erfaren revisor-mentor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EnhancedTrainingChat 
                  sessionId={selectedSessionId}
                  onInsightGenerated={(insight) => {
                    toast({
                      title: "Ny innsikt",
                      description: insight,
                    });
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Velg en sesjon for å få tilgang til AI-veilederen.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <CertificationManager />
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <ScenarioStatistics />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <TrainingReports />
        </TabsContent>

        <TabsContent value="integration" className="space-y-6">
          <TrainingSystemBridge 
            selectedClientId={selectedClientId}
            onClientChange={setSelectedClientId}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrainingClientIntegration 
              onSelectClient={setSelectedClientId}
            />
            <TrainingAuditIntegration 
              clientId={selectedClientId}
            />
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <UserPreferences />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}