import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, 
  Zap, 
  Users, 
  Activity, 
  TrendingUp, 
  Shield, 
  FileText,
  Search,
  Settings,
  Play,
  Pause,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import AICommandCenter from '@/components/AIOrchestration/AICommandCenter';
import { PerformanceMonitor } from '@/components/AIOrchestration/PerformanceMonitor';
import { Client } from '@/types/revio';
import PageLayout from '@/components/Layout/PageLayout';

const AICommandCenterPage: React.FC = () => {
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Mock clients data for demo - replace with actual hook when available
  const clients: Client[] = [
    { id: '1', name: 'Eksempel AS', org_number: '123456789' } as Client,
    { id: '2', name: 'Test Firma AS', org_number: '987654321' } as Client,
  ];

  const selectedClient = clients?.find((c: Client) => c.id === selectedClientId);

  const aiMetrics = {
    totalProcessed: 1247,
    activeModels: 5,
    averageResponseTime: 245,
    accuracyRate: 97.8,
    tasksCompleted: 89,
    energySaved: 34
  };

  const quickActions = [
    {
      title: 'Analyser Alle Klienter',
      description: 'Kjør fullstendig AI-analyse på alle aktive klienter',
      icon: Users,
      color: 'bg-blue-500',
      action: () => console.log('Analyzing all clients')
    },
    {
      title: 'Prediktiv Risikomodell',
      description: 'Oppdater AI-modeller for risikovurdering',
      icon: Shield,
      color: 'bg-red-500',
      action: () => console.log('Updating risk models')
    },
    {
      title: 'Optimaler Ytelse',
      description: 'Automatisk optimalisering av AI-komponenter',
      icon: Zap,
      color: 'bg-yellow-500',
      action: () => console.log('Optimizing performance')
    },
    {
      title: 'Generer Rapport',
      description: 'AI-generert sammendrag av dagens aktivitet',
      icon: FileText,
      color: 'bg-green-500',
      action: () => console.log('Generating report')
    }
  ];

  return (
    <PageLayout width="full" spacing="normal">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              AI Command Center
            </h1>
            <p className="text-muted-foreground">
              Sentralisert kontroll og overvåking av alle AI-funksjoner
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="success" className="animate-pulse">
            <Activity className="h-3 w-3 mr-1" />
            Alle systemer operasjonelle
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Innstillinger
          </Button>
        </div>
      </div>

      {/* AI Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dokumenter Behandlet</p>
                <p className="text-2xl font-bold">{aiMetrics.totalProcessed.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Brain className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aktive Modeller</p>
                <p className="text-2xl font-bold">{aiMetrics.activeModels}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Responstid (snitt)</p>
                <p className="text-2xl font-bold">{aiMetrics.averageResponseTime}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nøyaktighet</p>
                <p className="text-2xl font-bold">{aiMetrics.accuracyRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Play className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Oppgaver Fullført</p>
                <p className="text-2xl font-bold">{aiMetrics.tasksCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Lightbulb className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tid Spart (timer)</p>
                <p className="text-2xl font-bold">{aiMetrics.energySaved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Hurtighandlinger
          </CardTitle>
          <CardDescription>
            Utfør vanlige AI-operasjoner med ett klikk
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover-scale transition-all duration-200 hover:shadow-lg"
                onClick={action.action}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 ${action.color} rounded-lg flex items-center justify-center`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{action.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Interface */}
      <div className="space-y-6">
        {/* Client Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Velg Klient for AI-analyse</CardTitle>
            <CardDescription>
              Velg en klient for å utføre detaljert AI-analyse og få innsikter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Velg en klient..." />
              </SelectTrigger>
              <SelectContent>
                {clients?.map((client: Client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} - {client.org_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* AI Command Center or Performance Monitor */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">AI Kommandosenter</TabsTrigger>
            <TabsTrigger value="performance">Ytelsesmonitor</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            {selectedClient ? (
              <AICommandCenter client={selectedClient} />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Velg en klient</h3>
                  <p className="text-muted-foreground">
                    Velg en klient ovenfor for å starte AI-analyse og få tilgang til alle intelligente funksjoner.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="performance" className="mt-6">
            <PerformanceMonitor />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default AICommandCenterPage;