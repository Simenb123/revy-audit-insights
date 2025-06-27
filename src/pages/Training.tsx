
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Trophy, 
  Target, 
  TrendingUp,
  Users,
  Clock,
  Star,
  Mic,
  MessageSquare,
  GraduationCap,
  Shield
} from 'lucide-react';
import { useTrainingProgress, useUserBadges, useTestScenarios } from '@/hooks/useTraining';
import { useUserProfile } from '@/hooks/useUserProfile';
import TrainingOverview from '@/components/Training/TrainingOverview';
import UserProgress from '@/components/Training/UserProgress';
import ScenarioSelection from '@/components/Training/ScenarioSelection';
import RiskAssessmentModule from '@/components/Training/RiskAssessmentModule';
import AICharacterSimulator from '@/components/Training/AICharacterSimulator';
import VoiceTrainingModule from '@/components/Training/VoiceTrainingModule';
import VesentlighetModule from '@/components/Training/VesentlighetModule';
import SubstanstestingModule from '@/components/Training/SubstanstestingModule';
import StructuredLearningPath from '@/components/Training/StructuredLearningPath';
import ManagerDashboard from '@/components/Training/ManagerDashboard';

const Training = () => {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  
  const { data: userProgress, isLoading: progressLoading } = useTrainingProgress();
  const { data: userBadges, isLoading: badgesLoading } = useUserBadges();
  const { data: scenarios, isLoading: scenariosLoading } = useTestScenarios();
  const { data: userProfile } = useUserProfile();

  const handleScenarioSelect = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    setActiveModule(null);
  };

  const handleModuleSelect = (moduleId: string) => {
    setActiveModule(moduleId);
  };

  const selectedScenarioData = scenarios?.find(s => s.id === selectedScenario);

  const modules = [
    {
      id: 'ai-character',
      title: 'AI Oppstartsmøte',
      description: 'Øv på oppstartsmøter med AI-drevne klientkarakter',
      icon: MessageSquare,
      difficulty: 'Middels',
      estimatedTime: '20-30 min',
      featured: true
    },
    {
      id: 'voice-training',
      title: 'Stemmetrening',
      description: 'Tren kommunikasjon med stemmegjenkjenning',
      icon: Mic,
      difficulty: 'Alle nivåer',
      estimatedTime: '10-15 min',
      featured: true
    },
    {
      id: 'risikovurdering',
      title: 'Risikovurdering',
      description: 'Identifiser og vurder risikoområder',
      icon: Target,
      difficulty: 'Middels',
      estimatedTime: '15 min'
    },
    {
      id: 'vesentlighet',
      title: 'Vesentlighetsberegning',
      description: 'Beregn vesentlighetsgrenser',
      icon: TrendingUp,
      difficulty: 'Vanskelig',
      estimatedTime: '20 min'
    },
    {
      id: 'testing',
      title: 'Substanstesting',
      description: 'Gjennomfør revisjonstester',
      icon: BookOpen,
      difficulty: 'Middels',
      estimatedTime: '25 min'
    }
  ];

  const isManager = userProfile?.userRole && ['admin', 'partner', 'manager'].includes(userProfile.userRole);

  if (progressLoading || badgesLoading || scenariosLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-revio-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laster RevisionAkademiet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Star className="h-8 w-8 text-white" />
              </div>
              RevisionAkademiet
            </h1>
            <p className="text-muted-foreground mt-2">
              Strukturert opplæring og kompetanseutvikling for revisorer - nå med 4-ukers sertifiseringsprogram!
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 text-sm">
              🎓 Ny: Strukturert Læringsbane
            </Badge>
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 text-sm">
              🏆 Sertifisering
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {!selectedScenario ? (
          <Tabs defaultValue="structured-learning" className="space-y-6">
            <TabsList className={`grid w-full ${isManager ? 'grid-cols-6' : 'grid-cols-5'}`}>
              <TabsTrigger value="structured-learning">
                <GraduationCap className="w-4 h-4 mr-2" />
                Strukturert Læring
              </TabsTrigger>
              <TabsTrigger value="overview">Oversikt</TabsTrigger>
              <TabsTrigger value="ai-training">🎤 AI Trening</TabsTrigger>
              <TabsTrigger value="scenarios">Velg scenario</TabsTrigger>
              <TabsTrigger value="progress">Min progresjon</TabsTrigger>
              {isManager && (
                <TabsTrigger value="manager">
                  <Shield className="w-4 h-4 mr-2" />
                  Leder Dashboard
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="structured-learning">
              <StructuredLearningPath />
            </TabsContent>
            
            <TabsContent value="overview">
              <TrainingOverview 
                userProgress={userProgress} 
                userBadges={userBadges}
              />
            </TabsContent>
            
            <TabsContent value="ai-training">
              <AICharacterSimulator />
            </TabsContent>
            
            <TabsContent value="scenarios">
              <ScenarioSelection 
                scenarios={scenarios}
                onScenarioSelect={handleScenarioSelect}
              />
            </TabsContent>
            
            <TabsContent value="progress">
              <UserProgress 
                userProgress={userProgress} 
                userBadges={userBadges}
              />
            </TabsContent>
            
            {isManager && (
              <TabsContent value="manager">
                <ManagerDashboard />
              </TabsContent>
            )}
          </Tabs>
        ) : !activeModule ? (
          <div className="space-y-6">
            {/* Scenario Header */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl text-blue-900">
                      {selectedScenarioData?.name}
                    </CardTitle>
                    <p className="text-blue-700 mt-2">
                      {selectedScenarioData?.description}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedScenario(null)}
                  >
                    ← Tilbake til oversikt
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Module Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => {
                const Icon = module.icon;
                const isCompleted = userProgress?.some(p => 
                  p.scenario_id === selectedScenario && 
                  p.module_name === module.id && 
                  p.completed_at
                );
                
                return (
                  <Card 
                    key={module.id} 
                    className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                      module.featured ? 'border-gradient-to-r from-green-400 to-blue-500 shadow-lg' :
                      isCompleted ? 'border-green-200 bg-green-50' : 'border-border hover:border-primary'
                    }`}
                    onClick={() => handleModuleSelect(module.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <Icon className={`h-8 w-8 ${
                          module.featured ? 'text-blue-600' :
                          isCompleted ? 'text-green-600' : 'text-primary'
                        }`} />
                        <div className="flex gap-1">
                          {module.featured && (
                            <Badge className="bg-gradient-to-r from-green-400 to-blue-500 text-white text-xs">
                              Nytt!
                            </Badge>
                          )}
                          {isCompleted && (
                            <Badge className="bg-green-100 text-green-800">
                              Fullført
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <p className="text-muted-foreground text-sm">{module.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{module.estimatedTime}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {module.difficulty}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Module Navigation */}
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={() => setActiveModule(null)}
              >
                ← Tilbake til moduler
              </Button>
              <div className="text-sm text-muted-foreground">
                {selectedScenarioData?.name} • {modules.find(m => m.id === activeModule)?.title}
              </div>
            </div>

            {/* Active Module Content */}
            {activeModule === 'ai-character' && (
              <AICharacterSimulator />
            )}
            
            {activeModule === 'voice-training' && selectedScenario && selectedScenarioData && (
              <VoiceTrainingModule 
                scenarioId={selectedScenario}
                scenarioName={selectedScenarioData.name}
                onComplete={(feedback) => {
                  console.log('Voice training completed:', feedback);
                }}
              />
            )}
            
            {activeModule === 'risikovurdering' && selectedScenario && selectedScenarioData && (
              <RiskAssessmentModule 
                scenarioId={selectedScenario}
                scenarioName={selectedScenarioData.name}
              />
            )}
            
            {activeModule === 'vesentlighet' && selectedScenario && selectedScenarioData && (
              <VesentlighetModule
                scenarioId={selectedScenario}
                scenarioName={selectedScenarioData.name}
              />
            )}
            
            {activeModule === 'testing' && selectedScenario && selectedScenarioData && (
              <SubstanstestingModule
                scenarioId={selectedScenario}
                scenarioName={selectedScenarioData.name}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Training;
