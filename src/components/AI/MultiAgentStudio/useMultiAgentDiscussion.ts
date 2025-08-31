import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AgentConfig, DiscussionSettings, TranscriptMessage } from './types';
import { useToast } from '@/hooks/use-toast';

interface UseMultiAgentDiscussionArgs {
  clientId?: string;
  documentContext?: string;
  onError?: (e: Error) => void;
}

interface StartPayload {
  idea: string;
  agents: AgentConfig[];
  settings: DiscussionSettings;
}

export const useMultiAgentDiscussion = ({
  clientId,
  documentContext,
  onError,
}: UseMultiAgentDiscussionArgs) => {
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [roleTests, setRoleTests] = useState<Record<string, { 
    status: 'idle'|'loading'|'done'|'error'; 
    response?: string; 
    error?: string; 
    sources?: string[] 
  }>>({});
  const { toast } = useToast();

  const startDiscussion = useCallback(
    async ({ idea, agents, settings }: StartPayload) => {
      setIsLoading(true);
      setTranscript([]);
      try {
        const { data, error } = await supabase.functions.invoke('revy-multi-agent', {
          body: { idea, agents, settings, context: { clientId, documentContext } },
        });
        if (error) throw error;
        
        const messages: TranscriptMessage[] = data?.transcript ?? [];
        setTranscript(messages);
        
        // Log metadata hvis relevant
        if (data?.metadata) {
          console.log('🔄 Diskusjon metadata:', data.metadata);
        }
        
      } catch (e: any) {
        console.error('Multi-agent discussion error:', e);
        
        // Gi bedre feilmeldinger til bruker
        let errorMessage = 'En ukjent feil oppstod';
        if (e.message?.includes('AI-modeller utilgjengelig')) {
          errorMessage = 'AI-tjenesten er midlertidig utilgjengelig. Prøv igjen om litt.';
        } else if (e.message?.includes('OpenAI')) {
          errorMessage = 'Problem med AI-tjenesten. Kontakt support hvis problemet vedvarer.';
        } else if (e.message) {
          errorMessage = e.message;
        }
        
        toast({
          title: "Diskusjon feilet",
          description: errorMessage,
          variant: "destructive",
        });
        
        onError?.(e);
      } finally {
        setIsLoading(false);
      }
    },
    [clientId, documentContext, onError]
  );

  const stopDiscussion = useCallback(() => {
    // MVP: no streaming - future: abort controller / server-sent events
  }, []);

  const clear = useCallback(() => setTranscript([]), []);

  const testRole = useCallback(async (agent: AgentConfig, question: string) => {
    const key = agent.key as string;
    setRoleTests(prev => ({ ...prev, [key]: { status: 'loading' } }));
    try {
      const { data, error } = await supabase.functions.invoke('revy-role-test', {
        body: {
          agent,
          question,
          context: { clientId, documentContext },
        },
      });
      if (error) throw error;
      const resp = data?.answer ?? '';
      const sources: string[] = Array.isArray(data?.sources) ? data.sources : [];
      setRoleTests(prev => ({ ...prev, [key]: { status: 'done', response: resp, sources } }));
      return resp;
    } catch (e: any) {
      setRoleTests(prev => ({ ...prev, [key]: { status: 'error', error: e.message } }));
      onError?.(e);
      return '';
    }
  }, [clientId, documentContext, onError]);

  return { transcript, isLoading, startDiscussion, stopDiscussion, clear, roleTests, testRole };
};