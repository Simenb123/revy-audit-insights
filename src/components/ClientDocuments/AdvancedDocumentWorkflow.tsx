
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Workflow, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  User, 
  FileText,
  ArrowRight,
  Brain,
  BarChart3
} from 'lucide-react';
import { useClientDocuments } from '@/hooks/useClientDocuments';

interface AdvancedDocumentWorkflowProps {
  clientId: string;
}

interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  documents: string[];
  assignedTo?: string;
  dueDate?: string;
  aiRecommendations?: string[];
}

const AdvancedDocumentWorkflow: React.FC<AdvancedDocumentWorkflowProps> = ({ clientId }) => {
  const { documents } = useClientDocuments(clientId);
  const [activeStage, setActiveStage] = useState<string>('upload');

  // Mock workflow stages - i praksis ville dette komme fra database
  const workflowStages: WorkflowStage[] = [
    {
      id: 'upload',
      name: 'Dokumentopplasting',
      description: 'Last opp og kategoriser alle nødvendige dokumenter',
      status: documents.length > 0 ? 'completed' : 'pending',
      documents: documents.map(d => d.id),
      aiRecommendations: [
        'Hovedbok for perioden mangler',
        'Saldobalanse bør lastes opp',
        'Lønnslipper for desember mangler'
      ]
    },
    {
      id: 'categorization',
      name: 'AI-kategorisering',
      description: 'AI-Revi kategoriserer og analyserer dokumentene',
      status: documents.some(d => d.ai_confidence_score && d.ai_confidence_score > 0.8) ? 'completed' : 'in_progress',
      documents: documents.filter(d => d.ai_confidence_score).map(d => d.id),
      aiRecommendations: [
        '3 dokumenter trenger manuell gjennomgang',
        'Høy sikkerhet på 85% av dokumentene'
      ]
    },
    {
      id: 'validation',
      name: 'Validering og kvalitetskontroll',
      description: 'Manuell gjennomgang av AI-kategorisering',
      status: 'pending',
      documents: [],
      assignedTo: 'Revisor',
      aiRecommendations: [
        'Start med dokumenter med lav AI-sikkerhet',
        'Fokuser på hovedbok og saldobalanse først'
      ]
    },
    {
      id: 'analysis',
      name: 'Dokumentanalyse',
      description: 'Utfør revisjonsanalyser basert på dokumentene',
      status: 'pending',
      documents: [],
      assignedTo: 'Revisor',
      dueDate: '2024-12-31'
    },
    {
      id: 'completion',
      name: 'Fullføring',
      description: 'Dokumentasjon er klar for revisjonsrapport',
      status: 'pending',
      documents: []
    }
  ];

  const getStatusIcon = (status: WorkflowStage['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />;
      case 'blocked':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: WorkflowStage['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const calculateOverallProgress = () => {
    const completedStages = workflowStages.filter(stage => stage.status === 'completed').length;
    return (completedStages / workflowStages.length) * 100;
  };

  const getWorkflowInsights = () => {
    const totalDocs = documents.length;
    const categorizedDocs = documents.filter(d => d.ai_confidence_score).length;
    const highConfidenceDocs = documents.filter(d => d.ai_confidence_score && d.ai_confidence_score >= 0.8).length;
    
    return {
      totalDocs,
      categorizedDocs,
      highConfidenceDocs,
      completionRate: totalDocs > 0 ? (categorizedDocs / totalDocs) * 100 : 0
    };
  };

  const insights = getWorkflowInsights();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Dokumentarbeidsflyt
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Intelligent arbeidsflyt med AI-Revi guidance og progresjon
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Totalt fremgang</span>
              <span className="text-sm text-gray-600">{Math.round(calculateOverallProgress())}%</span>
            </div>
            <Progress value={calculateOverallProgress()} className="h-2" />
          </div>

          <Tabs value={activeStage} onValueChange={setActiveStage}>
            <TabsList className="grid w-full grid-cols-5">
              {workflowStages.map((stage) => (
                <TabsTrigger 
                  key={stage.id} 
                  value={stage.id}
                  className="text-xs"
                  disabled={stage.status === 'pending' && stage.id !== 'upload'}
                >
                  <div className="flex items-center gap-1">
                    {getStatusIcon(stage.status)}
                    <span className="hidden md:inline">{stage.name}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {workflowStages.map((stage) => (
              <TabsContent key={stage.id} value={stage.id} className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {getStatusIcon(stage.status)}
                          {stage.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {stage.description}
                        </p>
                      </div>
                      <Badge className={getStatusColor(stage.status)}>
                        {stage.status === 'completed' && 'Fullført'}
                        {stage.status === 'in_progress' && 'Pågår'}
                        {stage.status === 'pending' && 'Venter'}
                        {stage.status === 'blocked' && 'Blokkert'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stage-spesifikk informasjon */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">Dokumenter</span>
                        </div>
                        <p className="text-lg font-bold text-blue-800">{stage.documents.length}</p>
                        <p className="text-xs text-blue-700">i denne fasen</p>
                      </div>

                      {stage.assignedTo && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-900">Tildelt</span>
                          </div>
                          <p className="text-sm font-medium text-green-800">{stage.assignedTo}</p>
                        </div>
                      )}

                      {stage.dueDate && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <span className="text-sm font-medium text-orange-900">Frist</span>
                          </div>
                          <p className="text-sm font-medium text-orange-800">
                            {new Date(stage.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* AI-anbefalinger */}
                    {stage.aiRecommendations && stage.aiRecommendations.length > 0 && (
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                          <Brain className="h-4 w-4" />
                          AI-Revi anbefalinger
                        </h4>
                        <ul className="space-y-1">
                          {stage.aiRecommendations.map((rec, index) => (
                            <li key={index} className="text-sm text-purple-700 flex items-start gap-2">
                              <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Stage-spesifikke handlinger */}
                    {stage.id === 'upload' && (
                      <div className="flex gap-2">
                        <Button className="flex-1">
                          <FileText className="h-4 w-4 mr-2" />
                          Last opp dokumenter
                        </Button>
                      </div>
                    )}

                    {stage.id === 'validation' && stage.status !== 'completed' && (
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1">
                          Start validering
                        </Button>
                        <Button variant="outline">
                          Se dokumenter som trenger gjennomgang
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Arbeidsflyt-insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Arbeidsflyt-statistikk
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{insights.totalDocs}</div>
              <div className="text-sm text-blue-700">Totalt dokumenter</div>
            </div>
            <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{insights.categorizedDocs}</div>
              <div className="text-sm text-green-700">AI-kategoriserte</div>
            </div>
            <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{insights.highConfidenceDocs}</div>
              <div className="text-sm text-purple-700">Høy AI-sikkerhet</div>
            </div>
            <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{Math.round(insights.completionRate)}%</div>
              <div className="text-sm text-orange-700">Fullføringsgrad</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedDocumentWorkflow;
