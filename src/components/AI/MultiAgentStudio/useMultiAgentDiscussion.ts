import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AgentConfig, DiscussionSettings, TranscriptMessage } from './types';

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
      } catch (e: any) {
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