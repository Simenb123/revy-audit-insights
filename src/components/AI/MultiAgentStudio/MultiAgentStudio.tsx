import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  User,
  Settings as SettingsIcon,
  Play,
  Pause,
  Trash2,
  Plus,
  Shield,
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
import { useToast } from '@/hooks/use-toast';

import { AgentConfig, DiscussionSettings, TranscriptMessage, AgentRoleKey } from './types';
import { DEFAULT_AGENT_ROLES, GPT5_MODELS } from './constants';
import { useMultiAgentDiscussion } from './useMultiAgentDiscussion';

interface MultiAgentStudioProps {
  clientId?: string;
  documentContext?: string;
}

const MultiAgentStudio: React.FC<MultiAgentStudioProps> = ({ 
  clientId, 
  documentContext 
}) => {
  const { toast } = useToast();
  const [idea, setIdea] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<AgentConfig[]>(
    DEFAULT_AGENT_ROLES.slice(0, 4)
  );
  const [settings, setSettings] = useState<DiscussionSettings>({
    rounds: 5,
    maxTokensPerTurn: 220,
    temperature: null,
    autoSummarize: true,
    allowBackgroundDocs: true,
    moderatorControlsOrder: true,
    moderatorKey: 'moderator',
    noteTakerKey: 'notetaker',
  });
  const [isRunning, setIsRunning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [testRoleKey, setTestRoleKey] = useState<string>('lawyer');
  const [testQuestion, setTestQuestion] = useState<string>('Hva sier regnskapsloven § 5?');

  const { startDiscussion, stopDiscussion, transcript, isLoading, clear, roleTests, testRole } = useMultiAgentDiscussion({
    clientId,
    documentContext,
    onError: (e) =>
      toast({ title: 'Feil i diskusjon', description: e.message, variant: 'destructive' }),
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const handleStart = async () => {
    if (!idea.trim()) {
      toast({ title: 'Mangler idé', description: 'Skriv kort hva gjengen skal diskutere.' });
      return;
    }
    if (selectedAgents.length < 2) {
      toast({ title: 'For få agenter', description: 'Velg minst to roller.' });
      return;
    }
    setIsRunning(true);
    await startDiscussion({ idea, agents: selectedAgents, settings });
    setIsRunning(false);
  };

  const updateAgent = (key: AgentRoleKey, patch: Partial<AgentConfig>) => {
    setSelectedAgents((agents) => agents.map(a => (a.key === key ? { ...a, ...patch } : a)));
  };

  const addCustomRole = () => {
    const customKey = `custom_${Date.now()}` as AgentRoleKey;
    const customAgent: AgentConfig = {
      key: customKey,
      name: 'Egendefinert rolle',
      systemPrompt: 'Beskriv rollen og hvordan den skal svare. Norsk språk.',
      model: 'gpt-5-mini-2025-08-07',
      temperature: null,
      dataScopes: [],
      dataTopics: [],
      allowedSources: [],
    };
    setSelectedAgents((a) => [...a, customAgent]);
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="gap-2">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" /> Multi-agent diskusjonsstudio
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Velg roller, angi regler, lim inn idéen – og la moderator styre runden.
        </p>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-3">
        {/* Venstre: Oppsett */}
        <div className="md:col-span-1 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Idé / problemstilling</label>
            <Textarea
              placeholder="Beskriv kort hva som skal diskuteres"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Antall runder</span>
              <Badge variant="outline">{settings.rounds}</Badge>
            </div>
            <Slider
              value={[settings.rounds]}
              min={1}
              max={12}
              step={1}
              onValueChange={([v]) => setSettings((s) => ({ ...s, rounds: v }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Maks tokens/turn</label>
                <Input
                  type="number"
                  value={settings.maxTokensPerTurn}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, maxTokensPerTurn: Number(e.target.value) }))
                  }
                />
              </div>
              <div>
                <label className="text-sm">Temperatur (valgfri)</label>
                <Input
                  type="number"
                  step={0.1}
                  min={0}
                  max={2}
                  value={settings.temperature ?? ''}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, temperature: e.target.value === '' ? null : Number(e.target.value) }))
                  }
                  placeholder="null"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="text-sm">Auto-sammendrag</span>
              </div>
              <Switch
                checked={settings.autoSummarize}
                onCheckedChange={(v) => setSettings((s) => ({ ...s, autoSummarize: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                <span className="text-sm">Tillat datakilder</span>
              </div>
              <Switch
                checked={settings.allowBackgroundDocs}
                onCheckedChange={(v) => setSettings((s) => ({ ...s, allowBackgroundDocs: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                <span className="text-sm">Moderator styrer rekkefølgen</span>
              </div>
              <Switch
                checked={settings.moderatorControlsOrder}
                onCheckedChange={(v) => setSettings((s) => ({ ...s, moderatorControlsOrder: v }))}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Roller ({selectedAgents.length})</span>
              <div className="flex gap-2">
                <Button size="sm" onClick={addCustomRole}>
                  <Plus className="h-4 w-4" /> Ny rolle
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setSelectedAgents((a) => [
                      ...a,
                      DEFAULT_AGENT_ROLES.find((r) => !a.some((x) => x.key === r.key)) ||
                        DEFAULT_AGENT_ROLES[0],
                    ])
                  }
                >
                  <Plus className="h-4 w-4" /> Standard
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {selectedAgents.map((agent) => (
                <div key={agent.key as string} className="border rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {agent.icon}
                      <Input
                        value={agent.name}
                        onChange={(e) => updateAgent(agent.key, { name: e.target.value })}
                        className="w-56"
                      />
                      <Badge variant="outline">{String(agent.key)}</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedAgents((s) => s.filter((x) => x.key !== agent.key))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-2 grid md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Modell</label>
                      <select
                        className="border rounded-md px-2 py-1 w-full text-sm"
                        value={agent.model || 'gpt-5-mini-2025-08-07'}
                        onChange={(e) => updateAgent(agent.key, { model: e.target.value })}
                      >
                        {GPT5_MODELS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium">Temperatur</label>
                      <Input
                        type="number"
                        step={0.1}
                        min={0}
                        max={2}
                        value={agent.temperature ?? ''}
                        onChange={(e) => updateAgent(agent.key, { temperature: e.target.value === '' ? null : Number(e.target.value) })}
                        placeholder="null"
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium">Datasett-tilgang</label>
                      <div className="flex flex-wrap gap-1">
                        {['lover','forskrifter','rundskriv','lovkommentarer','artikler'].map((scope) => {
                          const checked = agent.dataScopes?.includes(scope);
                          return (
                            <label key={scope} className="inline-flex items-center gap-1 text-xs border rounded px-2 py-1">
                              <input
                                type="checkbox"
                                checked={!!checked}
                                onChange={(e) => {
                                  const next = new Set(agent.dataScopes || []);
                                  if (e.target.checked) next.add(scope); else next.delete(scope);
                                  updateAgent(agent.key, { dataScopes: Array.from(next) });
                                }}
                              />
                              {scope}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <label className="text-sm font-medium">Detaljerte instruksjoner</label>
                    <Textarea
                      value={agent.systemPrompt}
                      onChange={(e) => updateAgent(agent.key, { systemPrompt: e.target.value })}
                      rows={3}
                      className="text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rolle-test */}
          <Separator />
          <div className="space-y-2">
            <div className="text-sm font-medium">Test en rolle</div>
            <div className="grid grid-cols-3 gap-2 items-center">
              <select
                className="border rounded-md px-2 py-1 text-sm"
                value={testRoleKey}
                onChange={(e) => setTestRoleKey(e.target.value)}
              >
                {selectedAgents.map(a=> (
                  <option key={String(a.key)} value={String(a.key)}>{a.name}</option>
                ))}
              </select>
              <Input
                value={testQuestion}
                onChange={(e)=>setTestQuestion(e.target.value)}
                placeholder="Still et spørsmål"
                className="col-span-2 text-sm"
              />
              <div className="col-span-3 flex gap-2 items-center">
                <Button
                  size="sm"
                  onClick={async ()=>{
                    const agent = selectedAgents.find(a=>String(a.key)===testRoleKey);
                    if(!agent){ return; }
                    await testRole(agent, testQuestion);
                  }}
                >Kjør test</Button>
                {roleTests[testRoleKey]?.status === 'loading' && <span className="text-xs opacity-70">Tester…</span>}
              </div>
              {roleTests[testRoleKey]?.response && (
                <div className="col-span-3 space-y-2">
                  <div className="border rounded-md p-2 text-sm bg-muted/40 whitespace-pre-wrap">
                    {roleTests[testRoleKey]?.response}
                  </div>
                  {roleTests[testRoleKey]?.sources && roleTests[testRoleKey]?.sources!.length > 0 && (
                    <div className="text-xs">
                      <div className="font-medium mb-1">Kilder</div>
                      <ul className="list-disc ml-5 space-y-0.5">
                        {roleTests[testRoleKey]!.sources!.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {roleTests[testRoleKey]?.error && (
                <div className="col-span-3 border rounded-md p-2 text-sm text-red-600">{roleTests[testRoleKey]?.error}</div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleStart} disabled={isRunning || isLoading}>
              <Play className="h-4 w-4" /> Start diskusjon
            </Button>
            <Button variant="outline" onClick={stopDiscussion} disabled={!isLoading}>
              <Pause className="h-4 w-4" /> Stopp
            </Button>
            <Button variant="outline" onClick={clear}>
              Nullstill
            </Button>
          </div>
        </div>

        {/* Høyre: Transkript */}
        <div className="md:col-span-2">
          <Card className="bg-muted/40">
            <CardHeader>
              <CardTitle>Transkript</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[520px] pr-4">
                <div className="space-y-4">
                  {transcript.map((msg: TranscriptMessage) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1 text-xs opacity-70">
                          {msg.role === 'assistant' ? (
                            <Bot className="h-3 w-3" />
                          ) : (
                            <User className="h-3 w-3" />
                          )}
                          <span>{msg.agentName ?? (msg.role === 'user' ? 'Bruker' : 'Agent')}</span>
                          {typeof msg.turnIndex === 'number' && (
                            <Badge variant="outline">r{msg.turnIndex + 1}</Badge>
                          )}
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default MultiAgentStudio;