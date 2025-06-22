
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Workflow, 
  Play, 
  Pause, 
  Settings, 
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const WorkflowManager = () => {
  const [activeWorkflows, setActiveWorkflows] = useState([
    {
      id: '1',
      name: 'AI Dokumentkategorisering',
      description: 'Automatisk kategorisering av opplastede dokumenter',
      status: 'active',
      lastRun: '2024-01-20 15:30',
      success_rate: 95,
      avg_duration: '2.3s'
    },
    {
      id: '2',
      name: 'Revisjonsmeldinger',
      description: 'Automatiske påminnelser for revisjonsfrister',
      status: 'paused',
      lastRun: '2024-01-19 09:00',
      success_rate: 100,
      avg_duration: '0.8s'
    }
  ]);

  const handleToggleWorkflow = (workflowId) => {
    setActiveWorkflows(prev => 
      prev.map(workflow => 
        workflow.id === workflowId 
          ? { ...workflow, status: workflow.status === 'active' ? 'paused' : 'active' }
          : workflow
      )
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Arbeidsflyt Administrasjon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList>
              <TabsTrigger value="active">Aktive Arbeidsflyter</TabsTrigger>
              <TabsTrigger value="templates">Maler</TabsTrigger>
              <TabsTrigger value="analytics">Analyser</TabsTrigger>
              <TabsTrigger value="settings">Innstillinger</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="space-y-4">
              <ActiveWorkflows 
                workflows={activeWorkflows} 
                onToggleWorkflow={handleToggleWorkflow} 
              />
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <WorkflowTemplates />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <WorkflowAnalytics />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <WorkflowSettings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

const ActiveWorkflows = ({ workflows, onToggleWorkflow }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Aktive Arbeidsflyter</h3>
        <Button>
          Opprett Ny Arbeidsflyt
        </Button>
      </div>

      <div className="grid gap-4">
        {workflows.map((workflow) => (
          <Card key={workflow.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{workflow.name}</h4>
                    <Badge className={getStatusColor(workflow.status)}>
                      {getStatusIcon(workflow.status)}
                      <span className="ml-1 capitalize">{workflow.status}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {workflow.description}
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Siste kjøring</div>
                      <div className="text-muted-foreground">{workflow.lastRun}</div>
                    </div>
                    <div>
                      <div className="font-medium">Suksessrate</div>
                      <div className="text-muted-foreground">{workflow.success_rate}%</div>
                    </div>
                    <div>
                      <div className="font-medium">Gjennomsnittlig tid</div>
                      <div className="text-muted-foreground">{workflow.avg_duration}</div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onToggleWorkflow(workflow.id)}
                  >
                    {workflow.status === 'active' ? (
                      <>
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="outline">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const WorkflowTemplates = () => {
  const templates = [
    {
      name: 'Dokument Klassifisering',
      description: 'Automatisk klassifisering av opplastede dokumenter med AI',
      category: 'AI/ML',
      complexity: 'Middels'
    },
    {
      name: 'Revisjonsfrister',
      description: 'Automatiske påminnelser og oppfølging av revisjonsfrister',
      category: 'Notifikasjoner',
      complexity: 'Enkel'
    },
    {
      name: 'Kvalitetskontroll',
      description: 'Automatisk kvalitetskontroll av revisjonsarbeid',
      category: 'Kvalitet',
      complexity: 'Avansert'
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Arbeidsflyt Maler</h3>
      
      <div className="grid gap-4">
        {templates.map((template, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{template.name}</h4>
                    <Badge variant="outline">{template.category}</Badge>
                    <Badge variant="secondary">{template.complexity}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Forhåndsvis
                  </Button>
                  <Button size="sm">
                    Bruk Mal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const WorkflowAnalytics = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Arbeidsflyt Analyser</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kjøringer (24t)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <div className="text-sm text-muted-foreground">+12% fra i går</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suksessrate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.2%</div>
            <div className="text-sm text-muted-foreground">+0.5% fra i går</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gjennomsnittlig tid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.8s</div>
            <div className="text-sm text-muted-foreground">-0.2s fra i går</div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ytelse Over Tid</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
              <p>Ytelsesdiagram kommer her</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Executions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nylige Kjøringer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { workflow: 'AI Dokumentkategorisering', time: '15:32', duration: '2.1s', status: 'success' },
              { workflow: 'Revisjonsmeldinger', time: '15:30', duration: '0.8s', status: 'success' },
              { workflow: 'AI Dokumentkategorisering', time: '15:28', duration: '2.5s', status: 'success' },
              { workflow: 'Kvalitetskontroll', time: '15:25', duration: '4.2s', status: 'warning' }
            ].map((execution, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">{execution.time}</div>
                  <div className="text-sm">{execution.workflow}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">{execution.duration}</div>
                  <Badge 
                    className={
                      execution.status === 'success' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {execution.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const WorkflowSettings = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Arbeidsflyt Innstillinger</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Globale Innstillinger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Automatiske kjøringer</div>
                <div className="text-sm text-muted-foreground">Aktiver automatiske arbeidsflyter</div>
              </div>
              <Button size="sm" variant="outline">Konfigurer</Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Feilhåndtering</div>
                <div className="text-sm text-muted-foreground">Konfigurasjon for feilsituasjoner</div>
              </div>
              <Button size="sm" variant="outline">Innstillinger</Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Logging nivå</div>
                <div className="text-sm text-muted-foreground">Detaljgrad for arbeidsflyt logger</div>
              </div>
              <Button size="sm" variant="outline">Endre</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifikasjoner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">E-post varsler</div>
                <div className="text-sm text-muted-foreground">Varsler ved feil eller fullføring</div>
              </div>
              <Button size="sm" variant="outline">Konfigurer</Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Slack integrasjon</div>
                <div className="text-sm text-muted-foreground">Send varsler til Slack kanaler</div>
              </div>
              <Button size="sm" variant="outline">Koble til</Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Eskalering</div>
                <div className="text-sm text-muted-foreground">Automatisk eskalering ved kritiske feil</div>
              </div>
              <Button size="sm" variant="outline">Sett opp</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ressursgrenser</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="font-medium">Max samtidige kjøringer</div>
              <div className="text-2xl font-bold">10</div>
            </div>
            <div>
              <div className="font-medium">Timeout (sekunder)</div>
              <div className="text-2xl font-bold">300</div>
            </div>
            <div>
              <div className="font-medium">Retry forsøk</div>
              <div className="text-2xl font-bold">3</div>
            </div>
            <div>
              <div className="font-medium">Minnegrense (MB)</div>
              <div className="text-2xl font-bold">512</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowManager;
