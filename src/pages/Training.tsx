
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
  Star
} from 'lucide-react';
import { useTrainingProgress, useUserBadges, useTestScenarios } from '@/hooks/useTraining';
import TrainingOverview from '@/components/Training/TrainingOverview';
import UserProgress from '@/components/Training/UserProgress';
import ScenarioSelection from '@/components/Training/ScenarioSelection';
import RiskAssessmentModule from '@/components/Training/RiskAssessmentModule';

const Training = () => {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  
  const { data: userProgress, isLoading: progressLoading } = useTrainingProgress();
  const { data: userBadges, isLoading: badgesLoading } = useUserBadges();
  const { data: scenarios, isLoading: scenariosLoading } = useTestScenarios();

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
      id: 'risikovurdering',
      title: 'Risikovurdering',
      description: 'Identifiser og vurder risikoområder',
      icon: Target,
      difficulty: 'Middels',
      estimatedTime: '15 min'
    },
    {
      id: 'materialitet',
      title: 'Materialitetsberegning',
      description: 'Beregn materialitetsgrenser',
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

  if (progressLoading || badgesLoading || scenariosLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-revio-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Laster RevisionAkademiet...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Star className="h-8 w-8 text-white" />
            </div>
            RevisionAkademiet
          </h1>
          <p className="text-gray-600 mt-2">
            Interaktiv læring og kompetanseutvikling for revisorer
          </p>
        </div>
        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 text-sm">
          Beta-versjon
        </Badge>
      </div>

      {/* Main Content */}
      {!selectedScenario ? (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Oversikt</TabsTrigger>
            <TabsTrigger value="scenarios">Velg scenario</TabsTrigger>
            <TabsTrigger value="progress">Min progresjon</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <TrainingOverview 
              userProgress={userProgress} 
              userBadges={userBadges}
            />
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
                    isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleModuleSelect(module.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Icon className={`h-8 w-8 ${isCompleted ? 'text-green-600' : 'text-blue-600'}`} />
                      {isCompleted && (
                        <Badge className="bg-green-100 text-green-800">
                          Fullført
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <p className="text-gray-600 text-sm">{module.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-500">
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
            <div className="text-sm text-gray-600">
              {selectedScenarioData?.name} • {modules.find(m => m.id === activeModule)?.title}
            </div>
          </div>

          {/* Active Module Content */}
          {activeModule === 'risikovurdering' && selectedScenario && selectedScenarioData && (
            <RiskAssessmentModule 
              scenarioId={selectedScenario}
              scenarioName={selectedScenarioData.name}
            />
          )}
          
          {activeModule === 'materialitet' && (
            <Card>
              <CardHeader>
                <CardTitle>Materialitetsberegning</CardTitle>
                <p className="text-gray-600">Denne modulen er under utvikling.</p>
              </CardHeader>
            </Card>
          )}
          
          {activeModule === 'testing' && (
            <Card>
              <CardHeader>
                <CardTitle>Substanstesting</CardTitle>
                <p className="text-gray-600">Denne modulen er under utvikling.</p>
              </CardHeader>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Training;
