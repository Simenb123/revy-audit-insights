import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, MessageSquare, Brain, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

  const startMultiAgentSession = () => {
    setIsStarting(true);
    
    // Navigate to multi-agent studio with context
    const params = new URLSearchParams();
    if (clientId) params.set('clientId', clientId);
    if (context) params.set('context', context);
    
    navigate(`/ai/multi-agent-studio?${params.toString()}`);
  };

  const getContextPrompt = () => {
    if (context === 'audit-actions') {
      return 'Diskuter revisjonshandlinger og kvalitetssikring med spesialiserte AI-agenter';
    }
    if (context === 'risk-assessment') {
      return 'Få input fra revisjonseksperter om risikovurdering og materialitet';
    }
    if (context === 'documentation') {
      return 'Diskuter dokumentasjon og arbeidspapirer med juridisk og revisjonsekspertise';
    }
    return 'Få andre perspektiver og ekspertise fra spesialiserte AI-agenter';
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
          <div className="flex items-center gap-1">
            <Brain className="h-3 w-3 text-blue-500" />
            <span>Metodikk-ekspert</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3 text-green-500" />
            <span>Juridisk rådgiver</span>
          </div>
          <div className="flex items-center gap-1">
            <Lightbulb className="h-3 w-3 text-yellow-500" />
            <span>Risiko-spesialist</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-purple-500" />
            <span>Moderator</span>
          </div>
        </div>
        
        <Separator />
        
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Få flere perspektiver på komplekse revisjonsutfordringer
          </p>
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