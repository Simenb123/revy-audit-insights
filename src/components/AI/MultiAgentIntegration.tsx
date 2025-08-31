import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, MessageSquare, Brain, Lightbulb, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdvancedContextAnalyzer } from '@/services/advancedContextAnalyzer';
import { contextAwarePromptEnhancer } from '@/services/contextAwarePromptEnhancer';
import type { RevyContext } from '@/types/revio';

interface MultiAgentIntegrationProps {
  context?: string;
  clientId?: string;
  documentContext?: any;
}

const MultiAgentIntegration: React.FC<MultiAgentIntegrationProps> = ({
  context,
  clientId,
  documentContext
}) => {
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);
  const [contextAnalysis, setContextAnalysis] = useState<any>(null);
  const [contextAnalyzer] = useState(() => new AdvancedContextAnalyzer());
  
  // Analyze context for smart agent selection
  useEffect(() => {
    const analyzeContext = async () => {
      if (context) {
        try {
          const analysis = await contextAnalyzer.analyzeContext({
            currentContext: (context as RevyContext),
            userRole: 'employee',
            documentContext,
            clientData: { id: clientId },
            sessionHistory: [],
            recentActivity: []
          });
          setContextAnalysis(analysis);
        } catch (error) {
          console.error('Context analysis failed:', error);
        }
      }
    };
    
    analyzeContext();
  }, [context, clientId, documentContext, contextAnalyzer]);

  const startMultiAgentSession = () => {
    setIsStarting(true);
    
    // Navigate to multi-agent studio with context
    const params = new URLSearchParams();
    if (clientId) params.set('clientId', clientId);
    if (context) params.set('context', context);
    
    navigate(`/ai/multi-agent-studio?${params.toString()}`);
  };

  const getContextPrompt = () => {
    if (!contextAnalysis) {
      return 'Få andre perspektiver og ekspertise fra spesialiserte AI-agenter';
    }
    
    const complexity = contextAnalysis.documentInsights?.complexity || 'medium';
    const riskLevel = contextAnalysis.documentInsights?.riskLevel || 'medium';
    const phase = contextAnalysis.documentInsights?.auditPhase || 'execution';
    
    if (context === 'audit-actions') {
      return `Diskuter revisjonshandlinger (${phase}-fase, ${complexity} kompleksitet, ${riskLevel} risiko)`;
    }
    if (context === 'risk-assessment') {
      return `Risikovurdering med ${riskLevel} risikoprofil og ${complexity} kompleksitet`;
    }
    if (context === 'documentation') {
      return `Dokumentanalyse med ${contextAnalysis.documentInsights?.types?.length || 0} dokumenttyper`;
    }
    return `Multi-agent diskusjon tilpasset ${complexity} kompleksitet og ${riskLevel} risiko`;
  };
  
  const getRecommendedAgents = () => {
    if (!contextAnalysis) return [];
    
    const agents = [];
    const complexity = contextAnalysis.documentInsights?.complexity;
    const riskLevel = contextAnalysis.documentInsights?.riskLevel;
    
    if (complexity === 'high' || riskLevel === 'high') {
      agents.push({ name: 'Metodikk-ekspert', icon: Brain, color: 'blue' });
    }
    
    if (contextAnalysis.documentInsights?.types?.includes('legal')) {
      agents.push({ name: 'Juridisk rådgiver', icon: MessageSquare, color: 'green' });
    }
    
    if (riskLevel === 'high' || context === 'risk-assessment') {
      agents.push({ name: 'Risiko-spesialist', icon: AlertCircle, color: 'yellow' });
    }
    
    agents.push({ name: 'Moderator', icon: Users, color: 'purple' });
    
    return agents.slice(0, 4); // Limit to 4 agents max
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Multi-Agent Diskusjon
          <Badge variant="secondary">Ny funksjon</Badge>
        </CardTitle>
        <CardDescription>
          {getContextPrompt()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          {getRecommendedAgents().map((agent, index) => (
            <div key={index} className="flex items-center gap-1">
              <agent.icon className={`h-3 w-3 text-${agent.color}-500`} />
              <span>{agent.name}</span>
            </div>
          ))}
        </div>
        
        <Separator />
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            <p>Få flere perspektiver på komplekse revisjonsutfordringer</p>
            {contextAnalysis && (
              <p className="text-xs mt-1">
                Anbefalt for {contextAnalysis.documentInsights?.complexity || 'medium'} kompleksitet
              </p>
            )}
          </div>
          <Button 
            onClick={startMultiAgentSession}
            disabled={isStarting}
            variant="default"
          >
            Start diskusjon
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MultiAgentIntegration;