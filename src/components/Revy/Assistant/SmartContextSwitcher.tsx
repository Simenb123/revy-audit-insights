import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Brain, Zap, Target, ArrowRight, CheckCircle } from 'lucide-react';
import { AdvancedContextAnalyzer } from '@/services/advancedContextAnalyzer';
import { contextAwarePromptEnhancer } from '@/services/contextAwarePromptEnhancer';
import type { RevyContext } from '@/types/revio';
import { toast } from 'sonner';

interface SmartContextSwitcherProps {
  currentContext: RevyContext;
  clientData?: any;
  documentContext?: any;
  userRole?: string;
  sessionHistory?: any[];
  onContextChange?: (newContext: RevyContext, recommendation?: any) => void;
  compact?: boolean;
}

const SmartContextSwitcher: React.FC<SmartContextSwitcherProps> = ({
  currentContext,
  clientData,
  documentContext,
  userRole = 'employee',
  sessionHistory = [],
  onContextChange,
  compact = false
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [contextAnalysis, setContextAnalysis] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [contextAnalyzer] = useState(() => new AdvancedContextAnalyzer());

  useEffect(() => {
    analyzeCurrentContext();
  }, [currentContext, clientData, documentContext, userRole]);

  const analyzeCurrentContext = async () => {
    setIsAnalyzing(true);
    try {
      const analysis = await contextAnalyzer.analyzeContext({
        currentContext,
        userRole,
        documentContext,
        clientData,
        sessionHistory,
        recentActivity: []
      });

      setContextAnalysis(analysis);
      
      // Generate smart recommendations for context switching
      const contextRecommendations = await generateContextRecommendations(analysis);
      setRecommendations(contextRecommendations);
      
    } catch (error) {
      console.error('Context analysis failed:', error);
      toast.error('Kunne ikke analysere kontekst', {
        description: 'Prøv å laste siden på nytt.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateContextRecommendations = async (analysis: any): Promise<any[]> => {
    const recommendations = [];
    
    // Based on document insights
    if (analysis.documentInsights.riskLevel === 'high') {
      recommendations.push({
        context: 'risk-assessment' as RevyContext,
        title: 'Risikovurdering',
        description: 'Høy risiko detektert - vurder risikoanalytiske prosedyrer',
        confidence: 0.9,
        reason: 'Høy risiko i dokumentanalyse',
        priority: 'high'
      });
    }

    if (analysis.documentInsights.types.includes('financial')) {
      recommendations.push({
        context: 'audit-actions' as RevyContext,
        title: 'Revisjonshandlinger',
        description: 'Finansielle dokumenter identifisert - planlegg revisjonshandlinger',
        confidence: 0.8,
        reason: 'Finansielle dokumenter tilgjengelig',
        priority: 'medium'
      });
    }

    if (analysis.documentInsights.complexity === 'high') {
      recommendations.push({
        context: 'client-detail' as RevyContext,
        title: 'Klientdetaljer',
        description: 'Kompleks situasjon - dypere klientanalyse anbefales',
        confidence: 0.7,
        reason: 'Høy kompleksitet detektert',
        priority: 'medium'
      });
    }

    // Based on user behavior patterns
    if (analysis.userBehaviorPatterns.expertiseLevel === 'expert' && currentContext === 'general') {
      recommendations.push({
        context: 'audit-actions' as RevyContext,
        title: 'Avanserte revisjonshandlinger',
        description: 'Basert på din ekspertise - direkte til revisjonshandlinger',
        confidence: 0.8,
        reason: 'Ekspertnivå detektert',
        priority: 'low'
      });
    }

    return recommendations.filter(rec => rec.context !== currentContext);
  };

  const handleContextSwitch = async (recommendation: any) => {
    if (!onContextChange) return;

    try {
      // Enhanced context switching with prompt optimization
      const enhancedData = await contextAwarePromptEnhancer.enhancePrompt(
        `Switching to ${recommendation.context} context`,
        recommendation.context,
        null, // Don't pass variant here, let the service handle it
        {},
        {
          clientData,
          documentContext,
          userRole,
          sessionHistory
        }
      );

      onContextChange(recommendation.context, {
        ...recommendation,
        enhancedPrompt: enhancedData.enhancedPrompt,
        contextAnalysis
      });

      toast.success('Kontekst endret', {
        description: `Byttet til ${recommendation.title} basert på intelligent analyse`
      });
    } catch (error) {
      console.error('Context switch failed:', error);
      toast.error('Kunne ikke bytte kontekst', {
        description: 'Prøv igjen eller last siden på nytt.'
      });
    }
  };

  const getContextDisplayName = (context: RevyContext): string => {
    const contextMap: Record<RevyContext, string> = {
      'dashboard': 'Dashboard',
      'client-overview': 'Klientoversikt',
      'client-detail': 'Klientdetaljer',
      'audit-actions': 'Revisjonshandlinger',
      'risk-assessment': 'Risikovurdering',
      'documentation': 'Dokumentanalyse',
      'collaboration': 'Samarbeid',
      'communication': 'Kommunikasjon',
      'team-management': 'Team',
      'drill-down': 'Detaljer',
      'mapping': 'Kartlegging',
      'general': 'Generell assistanse',
      'accounting-data': 'Regnskapsdata',
      'analysis': 'Analyse',
      'data-upload': 'Opplasting',
      'knowledge-base': 'Kunnskapsbase',
      'knowledge': 'Kunnskap',
      'fag': 'Fagområde'
    };
    return contextMap[context] || 'Ukjent kontekst';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-orange-600 dark:text-orange-400';
      case 'low': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-muted-foreground';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return Target;
      case 'medium': return Zap;
      case 'low': return Brain;
      default: return CheckCircle;
    }
  };

  if (isAnalyzing) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 animate-pulse text-primary" />
            Analyserer kontekst...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!contextAnalysis || recommendations.length === 0) {
    return null;
  }

  // Compact mode - just show badge with recommendations count
  if (compact && recommendations.length > 0) {
    return (
      <Badge 
        variant="secondary" 
        className="cursor-pointer text-xs"
        onClick={() => toast.info('Kontekstanbefalinger', {
          description: `${recommendations.length} anbefalte kontekster basert på AI-analyse`
        })}
      >
        <Brain className="h-3 w-3 mr-1" />
        {recommendations.length} AI-anbefaling{recommendations.length > 1 ? 'er' : ''}
      </Badge>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Smart kontekstbytte
          <Badge variant="secondary">AI-anbefalt</Badge>
        </CardTitle>
        <CardDescription>
          Nåværende kontekst: <strong>{getContextDisplayName(currentContext)}</strong>
          {contextAnalysis && (
            <span className="text-xs block mt-1">
              Konfidensverdi: {Math.round(contextAnalysis.contextConfidence || 0)}%
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {contextAnalysis && (
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Primær kontekst:</span>
              <Badge variant="outline">{contextAnalysis.primaryContext}</Badge>
            </div>
            {contextAnalysis.documentInsights && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground">
                  Kompleksitet: {contextAnalysis.documentInsights.complexity} •
                  Risiko: {contextAnalysis.documentInsights.riskLevel} •
                  Fase: {contextAnalysis.documentInsights.auditPhase}
                </span>
              </div>
            )}
          </div>
        )}

        <Separator />

        <div className="space-y-3">
          <h4 className="font-medium text-sm">Anbefalte kontekster:</h4>
          {recommendations.map((rec, index) => {
            const PriorityIcon = getPriorityIcon(rec.priority);
            return (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <PriorityIcon className={`h-4 w-4 ${getPriorityColor(rec.priority)}`} />
                    <span className="font-medium text-sm">{rec.title}</span>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(rec.confidence * 100)}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{rec.description}</p>
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    Grunn: {rec.reason}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleContextSwitch(rec)}
                  className="ml-2"
                >
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartContextSwitcher;