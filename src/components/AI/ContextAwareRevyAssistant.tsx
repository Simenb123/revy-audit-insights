import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Brain, 
  Zap, 
  Mic, 
  Volume2, 
  MessageSquare,
  Eye,
  Settings,
  TrendingUp,
  Clock,
  Target
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAIRevyVariants } from '@/hooks/useAIRevyVariants';
import { useDocumentSearch } from '@/hooks/useDocumentSearch';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';

interface ContextAwareRevyAssistantProps {
  clientId: string;
  currentContext: 'documents' | 'analysis' | 'audit' | 'reporting';
  userRole: 'admin' | 'partner' | 'manager' | 'senior' | 'employee';
  onContextChange?: (context: string) => void;
}

interface ProactiveInsight {
  id: string;
  type: 'suggestion' | 'warning' | 'opportunity' | 'recommendation';
  title: string;
  description: string;
  action: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  timestamp: Date;
}

interface AdaptiveVariant {
  id: string;
  name: string;
  description: string;
  context: string[];
  isActive: boolean;
  confidence: number;
}

const ContextAwareRevyAssistant: React.FC<ContextAwareRevyAssistantProps> = ({
  clientId,
  currentContext,
  userRole,
  onContextChange
}) => {
  const { toast } = useToast();
  const { variants, selectedVariant, switchVariant } = useAIRevyVariants(currentContext);
  const { search, searchResults, isSearching } = useDocumentSearch(clientId);
  
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [proactiveInsights, setProactiveInsights] = useState<ProactiveInsight[]>([]);
  const [adaptiveVariants, setAdaptiveVariants] = useState<AdaptiveVariant[]>([]);
  const [isProactiveMode, setIsProactiveMode] = useState(true);
  const [userInput, setUserInput] = useState('');
  const [contextProgress, setContextProgress] = useState(0);

  // Adaptive AI Variant Selection based on context
  const analyzeContextAndSelectVariant = async () => {
    const contextMapping = {
      'documents': 'document-specialist',
      'analysis': 'data-analyst',
      'audit': 'audit-specialist',
      'reporting': 'reporting-expert'
    };

    const suggestedVariant = contextMapping[currentContext];
    const variant = variants.find(v => v.name === suggestedVariant) || variants[0];
    
    if (variant && variant.id !== selectedVariant?.id) {
      await switchVariant(variant);
      
      toast({
        title: "AI-assistent tilpasset",
        description: `Byttet til ${variant.display_name} basert på ${currentContext}-kontekst.`,
      });
    }
  };

  // Proactive assistance based on user activity
  const generateProactiveInsights = async () => {
    if (!isProactiveMode) return;

    const insights: ProactiveInsight[] = [];
    
    // Context-specific proactive suggestions
    if (currentContext === 'documents') {
      insights.push({
        id: 'doc-organization',
        type: 'suggestion',
        title: 'Dokumentorganisering',
        description: 'Jeg kan hjelpe deg med å kategorisere ukategoriserte dokumenter automatisk.',
        action: 'Kjør smart kategorisering',
        priority: 'medium',
        confidence: 0.85,
        timestamp: new Date()
      });
    }

    if (currentContext === 'analysis') {
      insights.push({
        id: 'risk-analysis',
        type: 'recommendation',
        title: 'Risikoanalyse',
        description: 'Basert på gjeldende data foreslår jeg å fokusere på varelager og fordringer.',
        action: 'Start risikoanalyse',
        priority: 'high',
        confidence: 0.92,
        timestamp: new Date()
      });
    }

    if (currentContext === 'audit') {
      insights.push({
        id: 'isa-guidance',
        type: 'recommendation',
        title: 'ISA 315 veiledning',
        description: 'For denne klienten anbefaler jeg å følge spesifikke ISA 315 prosedyrer for risikovurdering.',
        action: 'Vis ISA 315 guide',
        priority: 'high',
        confidence: 0.88,
        timestamp: new Date()
      });
    }

    setProactiveInsights(insights);
  };

  // Voice interaction handlers
  const startVoiceInteraction = async () => {
    if (!isVoiceEnabled) {
      toast({
        title: "Stemmeinteraksjon",
        description: "Stemmeinteraksjon må aktiveres først.",
        variant: "destructive",
      });
      return;
    }

    setIsListening(true);
    
    try {
      // Voice-to-text logic would go here
      // For now, simulate voice input
      setTimeout(() => {
        setIsListening(false);
        handleVoiceInput("Hvordan kan jeg forbedre risikoanalysen for denne klienten?");
      }, 3000);
    } catch (error) {
      console.error('Voice interaction error:', error);
      setIsListening(false);
    }
  };

  const handleVoiceInput = async (transcript: string) => {
    setUserInput(transcript);
    
    // Process voice input and generate AI response
    await search({
      term: transcript,
      clientId,
      filters: { aiValidated: true }
    });

    // Simulate text-to-speech response
    setIsSpeaking(true);
    setTimeout(() => setIsSpeaking(false), 4000);
  };

  // Context adaptation effect
  useEffect(() => {
    analyzeContextAndSelectVariant();
    generateProactiveInsights();
    
    // Update context progress based on activity
    const progress = Math.min((Date.now() % 10000) / 100, 100);
    setContextProgress(progress);
  }, [currentContext, variants]);

  // Auto-generate insights periodically
  useEffect(() => {
    if (isProactiveMode) {
      const interval = setInterval(generateProactiveInsights, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isProactiveMode, currentContext]);

  const getInsightIcon = (type: ProactiveInsight['type']) => {
    switch (type) {
      case 'suggestion': return <Zap className="h-4 w-4 text-primary" />;
      case 'warning': return <Brain className="h-4 w-4 text-destructive" />;
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'recommendation': return <Target className="h-4 w-4 text-warning" />;
      default: return <MessageSquare className="h-4 w-4" />;
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

  return (
    <div className="space-y-6">
      {/* Context Adaptation Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Kontekst-tilpasset AI-assistent
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {currentContext.charAt(0).toUpperCase() + currentContext.slice(1)}
              </Badge>
              <Badge variant="secondary">
                {selectedVariant?.display_name || 'Standard'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Context Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Konteksttilpasning</span>
              <span>{Math.round(contextProgress)}%</span>
            </div>
            <Progress value={contextProgress} className="h-2" />
          </div>

          {/* Voice Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={isVoiceEnabled}
                  onCheckedChange={setIsVoiceEnabled}
                  id="voice-mode"
                />
                <label htmlFor="voice-mode" className="text-sm font-medium">
                  Stemmeinteraksjon
                </label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={isProactiveMode}
                  onCheckedChange={setIsProactiveMode}
                  id="proactive-mode"
                />
                <label htmlFor="proactive-mode" className="text-sm font-medium">
                  Proaktiv assistanse
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={isListening ? "destructive" : "outline"}
                size="sm"
                onClick={startVoiceInteraction}
                disabled={!isVoiceEnabled}
              >
                <Mic className="h-4 w-4" />
                {isListening ? 'Lytter...' : 'Snakk'}
              </Button>
              
              {isSpeaking && (
                <div className="flex items-center gap-1 text-primary">
                  <Volume2 className="h-4 w-4 animate-pulse" />
                  <span className="text-xs">Snakker...</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proactive Insights */}
      {isProactiveMode && proactiveInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Proaktive innsikter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {proactiveInsights.map((insight) => (
              <Card key={insight.id} className="p-4">
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(insight.priority) as any} className="text-xs">
                          {insight.priority === 'critical' ? 'Kritisk' : 
                           insight.priority === 'high' ? 'Høy' :
                           insight.priority === 'medium' ? 'Medium' : 'Lav'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(insight.confidence * 100)}%
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="sm" className="text-xs">
                        {insight.action}
                      </Button>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {insight.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Multi-modal Interaction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Multi-modal interaksjon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Spør meg noe eller beskriv hva du trenger hjelp med..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && userInput.trim()) {
                  search({
                    term: userInput,
                    clientId,
                    filters: { aiValidated: true }
                  });
                }
              }}
              className="flex-1"
            />
            <Button 
              onClick={() => search({
                term: userInput,
                clientId,
                filters: { aiValidated: true }
              })}
              disabled={isSearching || !userInput.trim()}
            >
              {isSearching ? 'Søker...' : 'Send'}
            </Button>
          </div>

          {/* Search Results Display */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <p className="text-sm font-medium">Relevante resultater:</p>
              {searchResults.slice(0, 3).map((result: any) => (
                <Card key={result.id} className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">{result.fileName}</h5>
                      <p className="text-xs text-muted-foreground mt-1">{result.summary}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {result.category}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(result.confidence * 100)}% relevans
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adaptive Variant Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Adaptiv AI-variant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {variants.slice(0, 4).map((variant) => (
              <Card 
                key={variant.id} 
                className={`p-3 cursor-pointer transition-colors ${
                  selectedVariant?.id === variant.id ? 'ring-2 ring-primary' : 'hover:bg-accent'
                }`}
                onClick={() => switchVariant(variant)}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-sm">{variant.display_name}</h5>
                    {selectedVariant?.id === variant.id && (
                      <Badge variant="default" className="text-xs">Aktiv</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{variant.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContextAwareRevyAssistant;