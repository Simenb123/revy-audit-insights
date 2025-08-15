import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Brain, FileText, BarChart3, Search, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';
import { Client } from '@/types/revio';
import { SmartDocumentIntelligence } from '@/components/DocumentIntelligence/SmartDocumentIntelligence';
import { DocumentIntelligenceDashboard } from '@/components/DocumentIntelligence/DocumentIntelligenceDashboard';
import { PredictiveAnalytics } from '@/components/PredictiveAnalytics/PredictiveAnalytics';
import ContextAwareRevyChat from '@/components/Revy/ContextAwareRevyChat';
import { useToast } from '@/hooks/use-toast';

interface AICommandCenterProps {
  client: Client;
  onClose?: () => void;
}

interface AITaskStatus {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  result?: any;
  error?: string;
}

const AICommandCenter: React.FC<AICommandCenterProps> = ({ client, onClose }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [aiTasks, setAiTasks] = useState<AITaskStatus[]>([
    { id: 'document-analysis', name: 'Dokumentanalyse', status: 'pending', progress: 0 },
    { id: 'predictive-insights', name: 'Prediktive Innsikter', status: 'pending', progress: 0 },
    { id: 'benchmarking', name: 'Benchmarking', status: 'pending', progress: 0 },
    { id: 'risk-assessment', name: 'Risikovurdering', status: 'pending', progress: 0 }
  ]);
  const [isRunningFullAnalysis, setIsRunningFullAnalysis] = useState(false);

  const updateTaskStatus = (taskId: string, updates: Partial<AITaskStatus>) => {
    setAiTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const runFullAIAnalysis = async () => {
    setIsRunningFullAnalysis(true);
    toast({
      title: "Starter fullstendig AI-analyse",
      description: "Alle AI-komponenter aktiveres...",
    });

    try {
      // Document Analysis
      updateTaskStatus('document-analysis', { status: 'running', progress: 25 });
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
      updateTaskStatus('document-analysis', { status: 'completed', progress: 100 });

      // Predictive Insights
      updateTaskStatus('predictive-insights', { status: 'running', progress: 25 });
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateTaskStatus('predictive-insights', { status: 'completed', progress: 100 });

      // Benchmarking
      updateTaskStatus('benchmarking', { status: 'running', progress: 25 });
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateTaskStatus('benchmarking', { status: 'completed', progress: 100 });

      // Risk Assessment
      updateTaskStatus('risk-assessment', { status: 'running', progress: 25 });
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateTaskStatus('risk-assessment', { status: 'completed', progress: 100 });

      toast({
        title: "AI-analyse fullført",
        description: "Alle komponenter har fullført analysen.",
      });
    } catch (error) {
      toast({
        title: "Feil i AI-analyse",
        description: "Noen komponenter feilet under analysen.",
        variant: "destructive",
      });
    } finally {
      setIsRunningFullAnalysis(false);
    }
  };

  const getStatusIcon = (status: AITaskStatus['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: AITaskStatus['status']) => {
    const variants = {
      'pending': 'secondary',
      'running': 'default',
      'completed': 'success',
      'error': 'destructive'
    } as const;
    
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const overallProgress = aiTasks.reduce((acc, task) => acc + task.progress, 0) / aiTasks.length;

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">AI Command Center</h1>
            <p className="text-muted-foreground">
              Sentralisert kontroll for alle AI-funksjoner - {client.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total Fremgang</div>
            <div className="font-semibold">{Math.round(overallProgress)}%</div>
          </div>
          <Progress value={overallProgress} className="w-32" />
          <Button 
            onClick={runFullAIAnalysis} 
            disabled={isRunningFullAnalysis}
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            {isRunningFullAnalysis ? 'Analyserer...' : 'Full AI-Analyse'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Oversikt</TabsTrigger>
          <TabsTrigger value="documents">Dokumenter</TabsTrigger>
          <TabsTrigger value="analytics">Prediktiv</TabsTrigger>
          <TabsTrigger value="intelligence">Intelligens</TabsTrigger>
          <TabsTrigger value="chat">AI-Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {aiTasks.map((task) => (
              <Card key={task.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{task.name}</CardTitle>
                    {getStatusIcon(task.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      {getStatusBadge(task.status)}
                      <span className="text-sm text-muted-foreground">{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                AI-Ytelse Dashboard
              </CardTitle>
              <CardDescription>
                Oversikt over AI-komponentenes status og ytelse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {aiTasks.filter(t => t.status === 'completed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Fullførte Oppgaver</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {aiTasks.filter(t => t.status === 'running').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Aktive Prosesser</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {aiTasks.filter(t => t.status === 'pending').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Ventende Oppgaver</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <div className="space-y-6">
            <SmartDocumentIntelligence clientId={client.id} />
            <DocumentIntelligenceDashboard clientId={client.id} />
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <PredictiveAnalytics clientId={client.id} />
        </TabsContent>

        <TabsContent value="intelligence">
          <DocumentIntelligenceDashboard clientId={client.id} />
        </TabsContent>

        <TabsContent value="chat">
          <ContextAwareRevyChat client={client} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AICommandCenter;