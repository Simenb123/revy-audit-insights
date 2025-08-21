import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Database, Play, StopCircle, RotateCcw, Activity } from 'lucide-react';

interface TestScenario {
  id: string;
  name: string;
  description: string;
  type: 'load' | 'stress' | 'volume' | 'endurance';
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress: number;
  results?: {
    responseTime: number;
    successRate: number;
    errorCount: number;
    throughput: number;
  };
}

const TestDataManager = () => {
  const [scenarios, setScenarios] = useState<TestScenario[]>([
    {
      id: '1',
      name: 'Basis Brukersimulering',
      description: 'Simulerer 50 samtidige brukere som navigerer gjennom training modules',
      type: 'load',
      status: 'idle',
      progress: 0
    },
    {
      id: '2', 
      name: 'Høy Belastning Test',
      description: 'Stresser systemet med 500 samtidige brukere',
      type: 'stress',
      status: 'idle',
      progress: 0
    },
    {
      id: '3',
      name: 'Store Data Mengder',
      description: 'Tester håndtering av store mengder training data',
      type: 'volume',
      status: 'idle',
      progress: 0
    }
  ]);

  const [newScenario, setNewScenario] = useState({
    name: '',
    description: '',
    type: 'load' as const,
    userCount: 50,
    duration: 300
  });

  const runScenario = (id: string) => {
    setScenarios(prev => prev.map(s => 
      s.id === id ? { ...s, status: 'running' as const, progress: 0 } : s
    ));

    // Simulate test progress
    const interval = setInterval(() => {
      setScenarios(prev => prev.map(s => {
        if (s.id === id && s.status === 'running') {
          const newProgress = Math.min(s.progress + 10, 100);
          if (newProgress === 100) {
            clearInterval(interval);
            return {
              ...s,
              status: 'completed' as const,
              progress: 100,
              results: {
                responseTime: Math.random() * 500 + 100,
                successRate: Math.random() * 10 + 90,
                errorCount: Math.floor(Math.random() * 5),
                throughput: Math.random() * 100 + 50
              }
            };
          }
          return { ...s, progress: newProgress };
        }
        return s;
      }));
    }, 1000);
  };

  const stopScenario = (id: string) => {
    setScenarios(prev => prev.map(s => 
      s.id === id ? { ...s, status: 'idle' as const, progress: 0 } : s
    ));
  };

  const getStatusBadge = (status: TestScenario['status']) => {
    const variants = {
      idle: 'secondary',
      running: 'default',
      completed: 'success',
      failed: 'destructive'
    } as const;
    
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getTypeColor = (type: TestScenario['type']) => {
    const colors = {
      load: 'bg-blue-500',
      stress: 'bg-red-500', 
      volume: 'bg-green-500',
      endurance: 'bg-orange-500'
    };
    return colors[type];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Database className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Test Data Manager</h2>
      </div>

      <Tabs defaultValue="scenarios" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scenarios">Test Scenarioer</TabsTrigger>
          <TabsTrigger value="create">Opprett Scenario</TabsTrigger>
          <TabsTrigger value="monitoring">Overvåking</TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios">
          <div className="grid gap-4">
            {scenarios.map((scenario) => (
              <Card key={scenario.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getTypeColor(scenario.type)}`} />
                    <CardTitle className="text-lg">{scenario.name}</CardTitle>
                    {getStatusBadge(scenario.status)}
                  </div>
                  <div className="flex gap-2">
                    {scenario.status === 'idle' && (
                      <Button size="sm" onClick={() => runScenario(scenario.id)}>
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}
                    {scenario.status === 'running' && (
                      <Button size="sm" variant="destructive" onClick={() => stopScenario(scenario.id)}>
                        <StopCircle className="h-4 w-4 mr-1" />
                        Stopp
                      </Button>
                    )}
                    {scenario.status === 'completed' && (
                      <Button size="sm" variant="outline" onClick={() => runScenario(scenario.id)}>
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Kjør igjen
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{scenario.description}</p>
                  
                  {scenario.status === 'running' && (
                    <div className="space-y-2">
                      <Progress value={scenario.progress} className="w-full" />
                      <p className="text-xs text-muted-foreground">Kjører... {scenario.progress}%</p>
                    </div>
                  )}

                  {scenario.results && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-3 bg-muted rounded-lg">
                      <div className="text-center">
                        <div className="text-lg font-bold">{scenario.results.responseTime.toFixed(0)}ms</div>
                        <div className="text-xs text-muted-foreground">Responstid</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{scenario.results.successRate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Suksessrate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{scenario.results.errorCount}</div>
                        <div className="text-xs text-muted-foreground">Feil</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{scenario.results.throughput.toFixed(0)}/s</div>
                        <div className="text-xs text-muted-foreground">Throughput</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Opprett Nytt Test Scenario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Scenario Navn</label>
                  <Input 
                    value={newScenario.name}
                    onChange={(e) => setNewScenario(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Skriv inn scenario navn"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Test Type</label>
                  <Select value={newScenario.type} onValueChange={(value: any) => setNewScenario(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="load">Load Test</SelectItem>
                      <SelectItem value="stress">Stress Test</SelectItem>
                      <SelectItem value="volume">Volume Test</SelectItem>
                      <SelectItem value="endurance">Endurance Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Beskrivelse</label>
                <Textarea 
                  value={newScenario.description}
                  onChange={(e) => setNewScenario(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Beskriv hva dette scenarioet tester"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Antall Brukere</label>
                  <Input 
                    type="number"
                    value={newScenario.userCount}
                    onChange={(e) => setNewScenario(prev => ({ ...prev, userCount: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Varighet (sekunder)</label>
                  <Input 
                    type="number"
                    value={newScenario.duration}
                    onChange={(e) => setNewScenario(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <Button className="w-full">
                Opprett Test Scenario
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Overvåking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-green-600">98.5%</div>
                  <div className="text-sm text-muted-foreground">System Oppetid</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">142ms</div>
                  <div className="text-sm text-muted-foreground">Gjennomsnittlig Responstid</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">247</div>
                  <div className="text-sm text-muted-foreground">Aktive Brukere</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestDataManager;