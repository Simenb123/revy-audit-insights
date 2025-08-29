import React, { useRef, useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Download,
  Search,
  Users,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TranscriptMessage, AgentConfig } from './types';
import AgentMessage from './AgentMessage';
import AgentAvatar from './AgentAvatar';

interface TranscriptDisplayProps {
  transcript: TranscriptMessage[];
  agents: AgentConfig[];
  isLoading?: boolean;
  className?: string;
}

const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  transcript,
  agents,
  isLoading = false,
  className
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  // Group messages by round
  const messagesByRound = transcript.reduce((acc, message) => {
    const round = message.turnIndex ?? 0;
    if (!acc[round]) acc[round] = [];
    acc[round].push(message);
    return acc;
  }, {} as Record<number, TranscriptMessage[]>);

  // Initialize expanded rounds (show all by default)
  useEffect(() => {
    const rounds = Object.keys(messagesByRound).map(Number);
    setExpandedRounds(new Set(rounds));
  }, [messagesByRound]);

  // Filter messages based on selected agents and search term
  const filterMessage = (message: TranscriptMessage) => {
    if (selectedAgents.size > 0 && message.agentKey && !selectedAgents.has(message.agentKey.toString())) {
      return false;
    }
    if (searchTerm && !message.content.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  };

  const toggleRound = (round: number) => {
    const newExpanded = new Set(expandedRounds);
    if (newExpanded.has(round)) {
      newExpanded.delete(round);
    } else {
      newExpanded.add(round);
    }
    setExpandedRounds(newExpanded);
  };

  const toggleAgentFilter = (agentKey: string) => {
    const newSelected = new Set(selectedAgents);
    if (newSelected.has(agentKey)) {
      newSelected.delete(agentKey);
    } else {
      newSelected.add(agentKey);
    }
    setSelectedAgents(newSelected);
  };

  const rounds = Object.keys(messagesByRound).map(Number).sort((a, b) => a - b);
  const hasMessages = transcript.length > 0;

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Diskusjons-transkript
            </CardTitle>
            {hasMessages && (
              <Badge variant="secondary" className="ml-2">
                {transcript.length} meldinger
              </Badge>
            )}
          </div>
          
          {hasMessages && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" title="Eksporter">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" title="Søk" onClick={() => {}}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        {hasMessages && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {/* Agent filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              {agents.map((agent) => (
                <Button
                  key={agent.key.toString()}
                  variant={selectedAgents.has(agent.key.toString()) ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => toggleAgentFilter(agent.key.toString())}
                >
                  <AgentAvatar agent={agent} size="sm" />
                  {agent.name}
                </Button>
              ))}
              {selectedAgents.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSelectedAgents(new Set())}
                >
                  Nullstill
                </Button>
              )}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[520px]">
          <div className="px-4 pb-4">
            {!hasMessages && !isLoading && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">Ingen diskusjon ennå</h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Start en diskusjon med de valgte agentene for å se transkriptet her.
                </p>
              </div>
            )}

            {isLoading && (
              <div className="flex flex-col items-center justify-center h-32">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  <span className="text-sm">Diskusjon pågår...</span>
                </div>
              </div>
            )}

            {/* Messages grouped by rounds */}
            <div className="space-y-4">
              {rounds.map((round) => {
                const roundMessages = messagesByRound[round].filter(filterMessage);
                const isExpanded = expandedRounds.has(round);
                
                if (roundMessages.length === 0) return null;
                
                return (
                  <div key={round} className="space-y-2">
                    {/* Round header */}
                    <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 font-medium"
                        onClick={() => toggleRound(round)}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        Runde {round + 1}
                        <Badge variant="outline" className="ml-2">
                          {roundMessages.length} meldinger
                        </Badge>
                      </Button>
                    </div>

                    {/* Round messages */}
                    {isExpanded && (
                      <div className="space-y-3 ml-4">
                        {roundMessages.map((message, index) => {
                          const agent = agents.find(a => a.key === message.agentKey);
                          const isLastInRound = index === roundMessages.length - 1;
                          
                          return (
                            <AgentMessage
                              key={message.id}
                              message={message}
                              agent={agent}
                              isLastInRound={isLastInRound}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Typing indicator */}
            {isLoading && hasMessages && (
              <div className="mt-4 flex items-center gap-2 text-muted-foreground text-sm">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="h-2 w-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="h-2 w-2 bg-primary/60 rounded-full animate-bounce"></div>
                </div>
                <span>Agentene diskuterer...</span>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TranscriptDisplay;