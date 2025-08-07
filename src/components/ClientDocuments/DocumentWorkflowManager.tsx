import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Workflow, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Brain, 
  Target,
  ArrowRight,
  PlayCircle,
  PauseCircle,
  RotateCcw
} from 'lucide-react';
import { ClientDocument } from '@/hooks/useClientDocumentsList';
import { useToast } from '@/hooks/use-toast';

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  documents: ClientDocument[];
  canRetry?: boolean;
}

interface DocumentWorkflowManagerProps {
  documents: ClientDocument[];
  clientId: string;
  onUpdate: () => void;
}

const DocumentWorkflowManager = ({ documents, clientId, onUpdate }: DocumentWorkflowManagerProps) => {
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);
  const { toast } = useToast();

  // Define audit workflow steps
  const workflowSteps = useMemo<WorkflowStep[]>(() => {
    const textExtractionStep: WorkflowStep = {
      id: 'text-extraction',
      name: 'Tekstutvinning',
      description: 'Utvinning av tekst fra PDF og andre dokumentformater',
      icon: <FileText className="h-5 w-5" />,
      status: 'completed',
      documents: documents.filter(d => d.text_extraction_status === 'completed'),
      canRetry: true
    };

    const aiAnalysisStep: WorkflowStep = {
      id: 'ai-analysis',
      name: 'AI-analyse',
      description: 'Automatisk analyse av dokumentinnhold og sammendrag',
      icon: <Brain className="h-5 w-5" />,
      status: 'in-progress',
      documents: documents.filter(d => d.ai_analysis_summary),
      canRetry: true
    };

    const categorizationStep: WorkflowStep = {
      id: 'categorization',
      name: 'Kategorisering',
      description: 'Automatisk kategorisering basert på AI-analyse',
      icon: <Target className="h-5 w-5" />,
      status: 'in-progress',
      documents: documents.filter(d => d.category && d.category !== 'Ukategorisert'),
      canRetry: true
    };

    // Determine step statuses
    const totalDocs = documents.length;
    
    if (textExtractionStep.documents.length === totalDocs) {
      textExtractionStep.status = 'completed';
    } else if (documents.some(d => d.text_extraction_status === 'processing')) {
      textExtractionStep.status = 'in-progress';
    } else if (documents.some(d => d.text_extraction_status === 'failed')) {
      textExtractionStep.status = 'failed';
    } else {
      textExtractionStep.status = 'pending';
    }

    if (aiAnalysisStep.documents.length === totalDocs) {
      aiAnalysisStep.status = 'completed';
    } else if (aiAnalysisStep.documents.length > 0) {
      aiAnalysisStep.status = 'in-progress';
    } else {
      aiAnalysisStep.status = 'pending';
    }

    if (categorizationStep.documents.length === totalDocs) {
      categorizationStep.status = 'completed';
    } else if (categorizationStep.documents.length > 0) {
      categorizationStep.status = 'in-progress';
    } else {
      categorizationStep.status = 'pending';
    }

    return [textExtractionStep, aiAnalysisStep, categorizationStep];
  }, [documents]);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    const completedSteps = workflowSteps.filter(step => step.status === 'completed').length;
    return (completedSteps / workflowSteps.length) * 100;
  }, [workflowSteps]);

  // Get documents by status
  const documentsByStatus = useMemo(() => {
    const pending = documents.filter(d => 
      !d.text_extraction_status || d.text_extraction_status === 'pending'
    );
    const processing = documents.filter(d => 
      d.text_extraction_status === 'processing'
    );
    const completed = documents.filter(d => 
      d.text_extraction_status === 'completed' && d.ai_analysis_summary && d.category
    );
    const failed = documents.filter(d => 
      d.text_extraction_status === 'failed'
    );
    const needsAI = documents.filter(d => 
      d.text_extraction_status === 'completed' && !d.ai_analysis_summary
    );

    return { pending, processing, completed, failed, needsAI };
  }, [documents]);

  const getStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-200 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 border-blue-200 text-blue-800';
      case 'failed':
        return 'bg-red-100 border-red-200 text-red-800';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-600';
    }
  };

  const handleStartWorkflow = async () => {
    setActiveWorkflow('running');
    toast({
      title: "Arbeidsflyt startet",
      description: "AI-prosessering av dokumenter er i gang.",
    });

    // In a real implementation, this would trigger the actual workflow
    // For now, we'll just simulate it
    setTimeout(() => {
      setActiveWorkflow(null);
      onUpdate();
      toast({
        title: "Arbeidsflyt fullført",
        description: "Dokumentprosessering er ferdig.",
      });
    }, 3000);
  };

  const handleRetryStep = async (stepId: string) => {
    toast({
      title: "Prøver på nytt",
      description: `Starter ${workflowSteps.find(s => s.id === stepId)?.name} på nytt.`,
    });
    
    // Trigger retry logic here
    onUpdate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Workflow className="h-6 w-6" />
            Dokumentarbeidsflyt
          </h3>
          <p className="text-muted-foreground">
            Automatisk prosessering og analyse av klientdokumenter
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Fremdrift</div>
            <div className="font-bold text-lg">{overallProgress.toFixed(0)}%</div>
          </div>
          <Progress value={overallProgress} className="w-32" />
        </div>
      </div>

      {/* Workflow overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Arbeidsflytsstatus
            <Button 
              onClick={handleStartWorkflow}
              disabled={activeWorkflow === 'running'}
              className="flex items-center gap-2"
            >
              {activeWorkflow === 'running' ? (
                <>
                  <PauseCircle className="h-4 w-4" />
                  Prosesserer...
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4" />
                  Start prosessering
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflowSteps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-4">
                <div className={`p-3 rounded-lg border ${getStatusColor(step.status)}`}>
                  {step.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{step.name}</h4>
                    {getStatusIcon(step.status)}
                    <Badge variant="outline">
                      {step.documents.length} / {documents.length}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  
                  {step.documents.length > 0 && (
                    <Progress 
                      value={(step.documents.length / documents.length) * 100} 
                      className="mt-2 h-2"
                    />
                  )}
                </div>

                {step.canRetry && step.status === 'failed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRetryStep(step.id)}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Prøv igjen
                  </Button>
                )}

                {index < workflowSteps.length - 1 && (
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document status breakdown */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Sammendrag</TabsTrigger>
          <TabsTrigger value="pending">Venter ({documentsByStatus.pending.length})</TabsTrigger>
          <TabsTrigger value="processing">Prosesserer ({documentsByStatus.processing.length})</TabsTrigger>
          <TabsTrigger value="completed">Fullført ({documentsByStatus.completed.length})</TabsTrigger>
          {documentsByStatus.failed.length > 0 && (
            <TabsTrigger value="failed">Feilet ({documentsByStatus.failed.length})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="summary">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Totalt</p>
                    <p className="text-2xl font-bold">{documents.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fullført</p>
                    <p className="text-2xl font-bold text-green-600">{documentsByStatus.completed.length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Prosesserer</p>
                    <p className="text-2xl font-bold text-blue-600">{documentsByStatus.processing.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Trenger AI</p>
                    <p className="text-2xl font-bold text-orange-600">{documentsByStatus.needsAI.length}</p>
                  </div>
                  <Brain className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Dokumenter som venter på prosessering</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {documentsByStatus.pending.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{doc.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Lastet opp: {new Date(doc.created_at).toLocaleDateString('no-NO')}
                      </p>
                    </div>
                    <Badge variant="outline">Venter</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing">
          <Card>
            <CardHeader>
              <CardTitle>Dokumenter under prosessering</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {documentsByStatus.processing.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{doc.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Status: {doc.text_extraction_status}
                      </p>
                    </div>
                    <Badge variant="secondary">Prosesserer</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Fullført prosesserte dokumenter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {documentsByStatus.completed.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{doc.file_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {doc.category}
                        </Badge>
                        {doc.ai_confidence_score && (
                          <Badge variant="secondary" className="text-xs">
                            {(doc.ai_confidence_score * 100).toFixed(0)}% sikkerhet
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {documentsByStatus.failed.length > 0 && (
          <TabsContent value="failed">
            <Card>
              <CardHeader>
                <CardTitle>Dokumenter med feil</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {documentsByStatus.failed.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded border-red-200 bg-red-50">
                      <div>
                        <p className="font-medium">{doc.file_name}</p>
                        <p className="text-sm text-red-600">
                          Tekstutvinning feilet
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetryStep('text-extraction')}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Prøv igjen
                        </Button>
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default DocumentWorkflowManager;