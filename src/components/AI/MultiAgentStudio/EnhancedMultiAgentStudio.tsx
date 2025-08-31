import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, User, Settings as SettingsIcon, Play, Pause, Trash2, Plus, Shield,
  Brain, Target, Zap, BarChart3, Users, Lightbulb, AlertCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';

import { AgentConfig, DiscussionSettings, TranscriptMessage } from './types';
import { useMultiAgentDiscussion } from './useMultiAgentDiscussion';
import TranscriptDisplay from './TranscriptDisplay';
import AgentAvatar from './AgentAvatar';
import { intelligentAgentCoordinator } from '@/services/intelligentAgentCoordinator';
import PerformanceMonitor from '@/components/Revy/Assistant/PerformanceMonitor';
import type { RevyContext } from '@/types/revio';

interface EnhancedMultiAgentStudioProps {
  clientId?: string;
  documentContext?: string;
  context?: RevyContext;
}

const EnhancedMultiAgentStudio: React.FC<EnhancedMultiAgentStudioProps> = ({ 
  clientId, 
  documentContext,
  context = 'general'
}) => {
  const { toast: uiToast } = useToast();
  const [idea, setIdea] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<AgentConfig[]>([]);
  const [settings, setSettings] = useState<DiscussionSettings>({
    rounds: 8,
    maxTokensPerTurn: 300,
    temperature: null,
    autoSummarize: true,
    allowBackgroundDocs: true,
    moderatorControlsOrder: true,
    moderatorKey: 'moderator',
    noteTakerKey: 'notetaker',
  });
  const [isRunning, setIsRunning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [agentRecommendation, setAgentRecommendation] = useState<any>(null);
  const [conversationQuality, setConversationQuality] = useState<any>(null);
  const [intelligentSummary, setIntelligentSummary] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { startDiscussion, stopDiscussion, transcript, isLoading, clear } = useMultiAgentDiscussion({
    clientId,
    documentContext,
    onError: (e) => {
      uiToast({ title: 'Feil i diskusjon', description: e.message, variant: 'destructive' });
    }
  });

  // Auto-scroll to bottom when transcript updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  // Analyze conversation quality in real-time
  useEffect(() => {
    if (transcript.length > 2) {
      const quality = intelligentAgentCoordinator.analyzeConversationQuality(transcript);
      setConversationQuality(quality);
    }
  }, [transcript]);

  // Get intelligent agent recommendations
  const handleGetRecommendations = async () => {
    if (!idea.trim()) {
      toast.error('Skriv inn et tema først', {
        description: 'Beskriv hva som skal diskuteres for å få anbefalinger'
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const recommendation = await intelligentAgentCoordinator.recommendAgents(
        idea,
        context,
        { id: clientId },
        documentContext
      );
      
      setAgentRecommendation(recommendation);
      setSelectedAgents(recommendation.recommendedAgents);
      
      toast.success('AI-anbefalinger klar', {
        description: `${recommendation.recommendedAgents.length} agenter anbefalt (${Math.round(recommendation.confidence * 100)}% sikkerhet)`
      });
      
    } catch (error) {
      console.error('Agent recommendations failed:', error);
      toast.error('Kunne ikke generere anbefalinger', {
        description: 'Bruker standard agentsammensetning'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Enhanced discussion start with intelligent coordination
  const handleStart = async () => {
    if (!idea.trim()) {
      toast.error('Mangler tema', { description: 'Skriv kort hva som skal diskuteres' });
      return;
    }
    if (selectedAgents.length < 2) {
      toast.error('For få agenter', { description: 'Velg minst to roller' });
      return;
    }

    setIsRunning(true);
    setConversationQuality(null);
    setIntelligentSummary(null);
    
    try {
      await startDiscussion({ idea, agents: selectedAgents, settings });
      toast.success('Diskusjon startet', {
        description: `${selectedAgents.length} agenter deltar i diskusjonen`
      });
    } catch (error) {
      toast.error('Kunne ikke starte diskusjon', {
        description: 'Prøv igjen eller reduser antall agenter'
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Generate intelligent summary after discussion
  const handleGenerateSummary = async () => {
    if (transcript.length === 0) {
      toast.error('Ingen diskusjon å oppsummere');
      return;
    }

    try {
      const summary = await intelligentAgentCoordinator.generateIntelligentSummary(
        transcript,
        idea
      );
      setIntelligentSummary(summary);
      toast.success('Intelligent sammendrag generert');
    } catch (error) {
      toast.error('Kunne ikke generere sammendrag');
    }
  };

  const updateAgent = (key: any, patch: Partial<AgentConfig>) => {
    setSelectedAgents(agents => 
      agents.map(a => (a.key === key ? { ...a, ...patch } : a))
    );
  };

  const addCustomRole = () => {
    const customKey = `custom_${Date.now()}` as any;
    const customAgent: AgentConfig = {
      key: customKey,
      name: 'Egendefinert rolle',
      systemPrompt: 'Beskriv rollen og hvordan den skal svare. Norsk språk.',
      model: 'gpt-5-mini',
      temperature: null,
      dataScopes: [],
      dataTopics: [],
      allowedSources: [],
    };
    setSelectedAgents(a => [...a, customAgent]);
  };

  return (
    <div className="space-y-6">
      {/* Performance Monitor */}
      <PerformanceMonitor showDetailedView={false} />
      
      <Card className="flex flex-col">
        <CardHeader className="gap-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" /> 
              AI Multi-Agent Studio
              <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                Enhanced
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {context} kontekst
              </Badge>
              {agentRecommendation && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                  AI-optimalisert
                </Badge>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Intelligent agentutvelgelse og samtalestyring basert på avansert kontekstanalyse
          </p>
        </CardHeader>
        
        <CardContent className="grid gap-6 md:grid-cols-3">
          {/* Venstre: Intelligent oppsett */}
          <div className="md:col-span-1 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tema / problemstilling</label>
              <Textarea
                placeholder="Beskriv temaet som skal diskuteres..."
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                rows={3}
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGetRecommendations}
                disabled={isAnalyzing || !idea.trim()}
                className="w-full"
              >
                <Target className="h-4 w-4 mr-2" />
                {isAnalyzing ? 'Analyserer...' : 'Få AI-anbefalinger'}
              </Button>
            </div>

            {/* Agent Recommendations Display */}
            {agentRecommendation && (
              <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm">AI-anbefalinger</span>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(agentRecommendation.confidence * 100)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {agentRecommendation.reasoning}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {agentRecommendation.recommendedAgents.map((agent: AgentConfig) => (
                      <Badge key={agent.key as string} variant="secondary" className="text-xs">
                        {agent.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Enhanced Discussion Settings */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                Diskusjonsinnstillinger
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Runder</span>
                    <Badge variant="outline">{settings.rounds}</Badge>
                  </div>
                  <Slider
                    value={[settings.rounds]}
                    min={3}
                    max={15}
                    step={1}
                    onValueChange={([v]) => setSettings(s => ({ ...s, rounds: v }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm">Tokens/turn</label>
                  <Input
                    type="number"
                    value={settings.maxTokensPerTurn}
                    onChange={(e) =>
                      setSettings(s => ({ ...s, maxTokensPerTurn: Number(e.target.value) }))
                    }
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    <span className="text-sm">Auto-sammendrag</span>
                  </div>
                  <Switch
                    checked={settings.autoSummarize}
                    onCheckedChange={(v) => setSettings(s => ({ ...s, autoSummarize: v }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm">Intelligent styring</span>
                  </div>
                  <Switch
                    checked={settings.moderatorControlsOrder}
                    onCheckedChange={(v) => setSettings(s => ({ ...s, moderatorControlsOrder: v }))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Enhanced Agent Management */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Agenter ({selectedAgents.length})</span>
                <Button size="sm" onClick={addCustomRole}>
                  <Plus className="h-4 w-4" /> Ny rolle
                </Button>
              </div>

              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {selectedAgents.map((agent) => (
                    <Card key={agent.key as string} className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AgentAvatar agent={agent} size="sm" />
                          <Input
                            value={agent.name}
                            onChange={(e) => updateAgent(agent.key, { name: e.target.value })}
                            className="w-32 text-sm font-medium"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedAgents(s => s.filter(x => x.key !== agent.key))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <select
                          className="w-full border rounded-md px-2 py-1 text-sm"
                          value={agent.model || 'gpt-5-mini'}
                          onChange={(e) => updateAgent(agent.key, { model: e.target.value })}
                        >
                          <option value="gpt-5">GPT-5 (premium)</option>
                          <option value="gpt-5-mini">GPT-5 Mini</option>
                          <option value="gpt-4.1-2025-04-14">GPT-4.1</option>
                        </select>

                        <Textarea
                          value={agent.systemPrompt}
                          onChange={(e) => updateAgent(agent.key, { systemPrompt: e.target.value })}
                          rows={2}
                          className="text-xs"
                          placeholder="Detaljerte instruksjoner for agenten..."
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button 
                className="w-full" 
                onClick={handleStart} 
                disabled={isRunning || isLoading || selectedAgents.length < 2}
              >
                <Play className="h-4 w-4 mr-2" /> 
                Start intelligent diskusjon
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={stopDiscussion} disabled={!isLoading}>
                  <Pause className="h-4 w-4 mr-1" /> Stopp
                </Button>
                <Button variant="outline" onClick={clear}>
                  <Trash2 className="h-4 w-4 mr-1" /> Reset
                </Button>
              </div>

              {transcript.length > 0 && (
                <Button 
                  variant="secondary" 
                  className="w-full" 
                  onClick={handleGenerateSummary}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generer intelligent sammendrag
                </Button>
              )}
            </div>
          </div>

          {/* Høyre: Enhanced Transcript og Analyse */}
          <div className="md:col-span-2 space-y-4">
            {/* Real-time Conversation Quality */}
            {conversationQuality && (
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Samtale-kvalitet
                    <Badge variant="outline">
                      {conversationQuality.overallScore}/100
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={conversationQuality.overallScore} className="h-2" />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium mb-1">Styrker:</div>
                      <ul className="text-xs space-y-1 text-green-600">
                        {conversationQuality.strengths.map((strength: string, i: number) => (
                          <li key={i}>• {strength}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-medium mb-1">Forbedringer:</div>
                      <ul className="text-xs space-y-1 text-orange-600">
                        {conversationQuality.improvements.map((improvement: string, i: number) => (
                          <li key={i}>• {improvement}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {Object.entries(conversationQuality.participationBalance).map(([agent, percentage]) => (
                      <Badge key={agent} variant="secondary" className="text-xs">
                        {agent}: {percentage as number}%
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Transcript Display */}
            <TranscriptDisplay 
              transcript={transcript}
              agents={selectedAgents}
              isLoading={isLoading}
            />

            {/* Intelligent Summary Display */}
            {intelligentSummary && (
              <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Brain className="h-4 w-4 text-purple-600" />
                    Intelligent sammendrag
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h5 className="font-medium text-sm mb-2">Sammendrag:</h5>
                    <p className="text-sm text-muted-foreground">
                      {intelligentSummary.executiveSummary}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-sm mb-2">Hovedpunkter:</h5>
                      <ul className="text-xs space-y-1">
                        {intelligentSummary.keyPoints.map((point: string, i: number) => (
                          <li key={i}>• {point}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-sm mb-2">Handlingspunkter:</h5>
                      <ul className="text-xs space-y-1">
                        {intelligentSummary.actionItems.map((item: string, i: number) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {intelligentSummary.followUpTopics.length > 0 && (
                    <div>
                      <h5 className="font-medium text-sm mb-2">Oppfølgingstemaer:</h5>
                      <div className="flex flex-wrap gap-1">
                        {intelligentSummary.followUpTopics.map((topic: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div ref={scrollRef} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedMultiAgentStudio;