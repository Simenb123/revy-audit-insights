import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  Brain,
  Zap,
  Calendar,
  Users,
  FileText
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface SmartActionRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'risk-assessment' | 'testing' | 'documentation' | 'review' | 'compliance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime: number; // minutes
  prerequisites: string[];
  isCompleted: boolean;
  dueDate?: Date;
  assignedTo?: string;
  confidence: number;
  isaStandards: string[];
}

interface AutomatedProgress {
  id: string;
  phase: 'planning' | 'fieldwork' | 'review' | 'completion';
  currentStep: string;
  completedSteps: string[];
  totalSteps: number;
  estimatedCompletion: Date;
  actualProgress: number;
  riskFactors: string[];
}

interface AnomalyAlert {
  id: string;
  type: 'transaction' | 'pattern' | 'compliance' | 'timing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedArea: string;
  detectedAt: Date;
  suggestedActions: string[];
  isResolved: boolean;
}

interface IntelligentAuditWorkflowProps {
  clientId: string;
  auditType: 'annual' | 'interim' | 'special';
  userRole: 'admin' | 'partner' | 'manager' | 'senior' | 'employee';
}

const IntelligentAuditWorkflow: React.FC<IntelligentAuditWorkflowProps> = ({
  clientId,
  auditType,
  userRole
}) => {
  const { toast } = useToast();
  
  const [recommendations, setRecommendations] = useState<SmartActionRecommendation[]>([]);
  const [progressTracking, setProgressTracking] = useState<AutomatedProgress | null>(null);
  const [anomalyAlerts, setAnomalyAlerts] = useState<AnomalyAlert[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Generate intelligent action recommendations
  const generateRecommendations = useCallback(async () => {
    setIsAnalyzing(true);
    
    try {
      // Simulate AI-generated recommendations based on client data and audit type
      const baseRecommendations: SmartActionRecommendation[] = [
        {
          id: 'risk-1',
          title: 'Utfør ISA 315 risikovurdering',
          description: 'Analyser klientens forretning og identifiser vesentlige risikoområder for revisjonen.',
          category: 'risk-assessment',
          priority: 'high',
          estimatedTime: 180,
          prerequisites: ['Klientmøte gjennomført', 'Forutgående års revisjonsrapport gjennomgått'],
          isCompleted: false,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          confidence: 0.95,
          isaStandards: ['ISA 315', 'ISA 320']
        },
        {
          id: 'test-1',
          title: 'Test av varelager kontroller',
          description: 'Gjennomfør substantielle tester av varelagerbalansen og tilhørende kontroller.',
          category: 'testing',
          priority: 'high',
          estimatedTime: 240,
          prerequisites: ['Risikovurdering fullført', 'Varelager dokumentasjon mottatt'],
          isCompleted: false,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          confidence: 0.88,
          isaStandards: ['ISA 501', 'ISA 540']
        },
        {
          id: 'doc-1',
          title: 'Dokumenter kontrollaktiviteter',
          description: 'Kartlegg og dokumenter klientens interne kontroller for kritiske prosesser.',
          category: 'documentation',
          priority: 'medium',
          estimatedTime: 120,
          prerequisites: ['Prosessforståelse etablert'],
          isCompleted: false,
          confidence: 0.82,
          isaStandards: ['ISA 315', 'ISA 330']
        },
        {
          id: 'rev-1',
          title: 'Gjennomgang av regnskapsestimater',
          description: 'Evaluér ledelsens regnskapsestimater og relaterte opplysninger.',
          category: 'review',
          priority: 'medium',
          estimatedTime: 150,
          prerequisites: ['Balanse og resultatregnskap tilgjengelig'],
          isCompleted: false,
          confidence: 0.90,
          isaStandards: ['ISA 540', 'ISA 580']
        },
        {
          id: 'comp-1',
          title: 'Verifiser ISA compliance',
          description: 'Sikre at alle påkrevde ISA standarder er fulgt og dokumentert.',
          category: 'compliance',
          priority: 'critical',
          estimatedTime: 90,
          prerequisites: ['Alle revisjonshandlinger dokumentert'],
          isCompleted: false,
          confidence: 0.98,
          isaStandards: ['ISA 230', 'ISA 700']
        }
      ];

      // Adjust recommendations based on audit type and user role
      const filteredRecommendations = baseRecommendations.filter(rec => {
        if (auditType === 'interim' && rec.category === 'compliance') return false;
        if (userRole === 'employee' && rec.priority === 'critical') return false;
        return true;
      });

      setRecommendations(filteredRecommendations);

      toast({
        title: "Intelligente anbefalinger generert",
        description: `${filteredRecommendations.length} handlinger anbefalt basert på AI-analyse.`,
      });

    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast({
        title: "Feil ved generering av anbefalinger",
        description: "Kunne ikke generere intelligente handlinger.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [clientId, auditType, userRole, toast]);

  // Generate automated progress tracking
  const generateProgressTracking = useCallback(() => {
    const phases = ['planning', 'fieldwork', 'review', 'completion'] as const;
    const currentPhaseIndex = Math.floor(Math.random() * phases.length);
    const currentPhase = phases[currentPhaseIndex];

    const stepsMap = {
      planning: ['Klientforståelse', 'Risikovurdering', 'Planlegging av prosedyrer'],
      fieldwork: ['Kontrolltesting', 'Substantielle tester', 'Analytiske prosedyrer'],
      review: ['Gjennomgang av arbeid', 'Kvalitetskontroll', 'Konklusjoner'],
      completion: ['Revisjonsberetning', 'Ledelsesrapport', 'Arkivering']
    };

    const totalSteps = stepsMap[currentPhase].length;
    const completedSteps = Math.floor(Math.random() * totalSteps);
    const actualProgress = Math.round((completedSteps / totalSteps) * 100);

    setProgressTracking({
      id: `progress-${clientId}`,
      phase: currentPhase,
      currentStep: stepsMap[currentPhase][completedSteps] || stepsMap[currentPhase][0],
      completedSteps: stepsMap[currentPhase].slice(0, completedSteps),
      totalSteps,
      estimatedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      actualProgress,
      riskFactors: actualProgress < 50 ? ['Tidskritisk', 'Avhengig av klientdata'] : []
    });
  }, [clientId]);

  // Generate anomaly detection alerts
  const generateAnomalyAlerts = useCallback(() => {
    const alerts: AnomalyAlert[] = [
      {
        id: 'anom-1',
        type: 'transaction',
        severity: 'high',
        title: 'Uvanlig høye transaksjoner oppdaget',
        description: 'Flere transaksjoner over 500k NOK registrert på kveldstid i løpet av siste uke.',
        affectedArea: 'Kontantstrøm',
        detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        suggestedActions: [
          'Gjennomgå transaksjonsdetaljer',
          'Verifiser godkjenningsprosedyrer',
          'Kontakt klient for forklaring'
        ],
        isResolved: false
      },
      {
        id: 'anom-2',
        type: 'pattern',
        severity: 'medium',
        title: 'Avvik i månedsavslutning',
        description: 'Månedsavslutning tok 40% lengre tid enn normalt i oktober 2024.',
        affectedArea: 'Finansiell rapportering',
        detectedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        suggestedActions: [
          'Analyser prosessendringer',
          'Evaluer kontrolleffektivitet'
        ],
        isResolved: false
      },
      {
        id: 'anom-3',
        type: 'compliance',
        severity: 'critical',
        title: 'Manglende segregering av oppgaver',
        description: 'Samme bruker har både registrert og godkjent journalposter i kritiske områder.',
        affectedArea: 'Interne kontroller',
        detectedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        suggestedActions: [
          'Gjennomgå tilgangskontroller',
          'Implementer fireøyeprinsipp',
          'Oppdater autorisasjonsmatrise'
        ],
        isResolved: false
      }
    ];

    setAnomalyAlerts(alerts);
  }, []);

  // Initialize data on mount
  useEffect(() => {
    generateRecommendations();
    generateProgressTracking();
    generateAnomalyAlerts();
  }, [generateRecommendations, generateProgressTracking, generateAnomalyAlerts]);

  // Mark recommendation as completed
  const completeRecommendation = (id: string) => {
    setRecommendations(prev => 
      prev.map(rec => 
        rec.id === id ? { ...rec, isCompleted: true } : rec
      )
    );
    
    toast({
      title: "Handling fullført",
      description: "Anbefalingen er markert som fullført.",
    });
  };

  // Resolve anomaly alert
  const resolveAnomaly = (id: string) => {
    setAnomalyAlerts(prev => 
      prev.map(alert => 
        alert.id === id ? { ...alert, isResolved: true } : alert
      )
    );
    
    toast({
      title: "Anomali løst",
      description: "Anomalien er markert som løst.",
    });
  };

  const getRecommendationIcon = (category: SmartActionRecommendation['category']) => {
    switch (category) {
      case 'risk-assessment': return <Target className="h-4 w-4" />;
      case 'testing': return <Zap className="h-4 w-4" />;
      case 'documentation': return <FileText className="h-4 w-4" />;
      case 'review': return <CheckCircle2 className="h-4 w-4" />;
      case 'compliance': return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Automated Progress Tracking */}
      {progressTracking && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Automatisk fremdriftssporing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Nåværende fase</span>
                  <Badge variant="default">{progressTracking.phase.charAt(0).toUpperCase() + progressTracking.phase.slice(1)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{progressTracking.currentStep}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Fremdrift</span>
                  <span className="text-sm">{progressTracking.actualProgress}%</span>
                </div>
                <Progress value={progressTracking.actualProgress} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Estimert ferdigstillelse</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {progressTracking.estimatedCompletion.toLocaleDateString('nb-NO')}
                </p>
              </div>
            </div>

            {progressTracking.riskFactors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-warning">Risikofaktorer</h4>
                <div className="flex flex-wrap gap-2">
                  {progressTracking.riskFactors.map((factor, index) => (
                    <Badge key={index} variant="warning" className="text-xs">
                      {factor}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Anomaly Detection Alerts */}
      {anomalyAlerts.filter(alert => !alert.isResolved).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Anomali-deteksjon varsler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {anomalyAlerts.filter(alert => !alert.isResolved).map((alert) => (
              <Card key={alert.id} className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`h-5 w-5 ${
                    alert.severity === 'critical' ? 'text-destructive' :
                    alert.severity === 'high' ? 'text-warning' :
                    'text-secondary'
                  }`} />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{alert.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityColor(alert.severity) as any} className="text-xs">
                          {alert.severity === 'critical' ? 'Kritisk' : 
                           alert.severity === 'high' ? 'Høy' : 
                           alert.severity === 'medium' ? 'Medium' : 'Lav'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {alert.affectedArea}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium">Foreslåtte handlinger:</h5>
                      <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                        {alert.suggestedActions.map((action, index) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Oppdaget: {alert.detectedAt.toLocaleString('nb-NO')}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => resolveAnomaly(alert.id)}
                      >
                        Marker som løst
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Smart Action Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Smarte handlingsanbefalinger
            </CardTitle>
            <Button 
              onClick={generateRecommendations}
              disabled={isAnalyzing}
              variant="outline"
              size="sm"
            >
              {isAnalyzing ? 'Analyserer...' : 'Oppdater anbefalinger'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              Alle ({recommendations.length})
            </Button>
            {['risk-assessment', 'testing', 'documentation', 'review', 'compliance'].map(category => {
              const count = recommendations.filter(rec => rec.category === category).length;
              return (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === 'risk-assessment' ? 'Risikovurdering' :
                   category === 'testing' ? 'Testing' :
                   category === 'documentation' ? 'Dokumentasjon' :
                   category === 'review' ? 'Gjennomgang' :
                   'Compliance'} ({count})
                </Button>
              );
            })}
          </div>

          {/* Recommendations List */}
          <div className="space-y-3">
            {filteredRecommendations.map((recommendation) => (
              <Card key={recommendation.id} className={`p-4 ${recommendation.isCompleted ? 'opacity-50' : ''}`}>
                <div className="flex items-start gap-3">
                  {getRecommendationIcon(recommendation.category)}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{recommendation.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(recommendation.priority) as any} className="text-xs">
                          {recommendation.priority === 'critical' ? 'Kritisk' : 
                           recommendation.priority === 'high' ? 'Høy' : 
                           recommendation.priority === 'medium' ? 'Medium' : 'Lav'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(recommendation.confidence * 100)}% sikker
                        </Badge>
                        {recommendation.isCompleted && (
                          <Badge variant="success" className="text-xs">
                            Fullført
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{recommendation.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="font-medium">Estimert tid:</span>
                        <p className="text-muted-foreground">{recommendation.estimatedTime} minutter</p>
                      </div>
                      
                      {recommendation.dueDate && (
                        <div>
                          <span className="font-medium">Forfallsdato:</span>
                          <p className="text-muted-foreground">{recommendation.dueDate.toLocaleDateString('nb-NO')}</p>
                        </div>
                      )}
                      
                      <div>
                        <span className="font-medium">ISA standarder:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {recommendation.isaStandards.map((standard, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {standard}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {recommendation.prerequisites.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-xs font-medium">Forutsetninger:</span>
                        <ul className="list-disc list-inside text-xs text-muted-foreground">
                          {recommendation.prerequisites.map((prereq, index) => (
                            <li key={index}>{prereq}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {recommendation.assignedTo && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {recommendation.assignedTo}
                          </div>
                        )}
                      </div>
                      
                      {!recommendation.isCompleted && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => completeRecommendation(recommendation.id)}
                        >
                          Marker som fullført
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntelligentAuditWorkflow;