import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { RevyChatMessage } from '@/types/revio';

export const useRevyChatMessages = (sessionId: string | null) => {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const supabaseReady = isSupabaseConfigured && !!supabase;

  useEffect(() => {
    if (!supabaseReady) {
      toast({ title: 'Supabase is not configured.' });
    }
  }, [supabaseReady, toast]);

  const queryKey = ['revy-chat-messages', sessionId];

  const { data: messages, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!supabaseReady || !sessionId) return [];
      const { data, error } = await supabase
        .from('revy_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as RevyChatMessage[];
    },
    enabled: !!sessionId && !!session?.user?.id && supabaseReady,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (params: { content: string; sender: 'user' | 'revy', metadata?: any }) => {
      if (!supabaseReady) {
        toast({ title: 'Supabase is not configured.' });
        return;
      }
      if (!sessionId) throw new Error('No active session');
      if (!session?.user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('revy_chat_messages')
        .insert({
          session_id: sessionId,
          sender: params.sender,
          content: params.content,
          metadata: params.metadata,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as RevyChatMessage;
    },
    onSuccess: () => {
      // Invalidate and refetch for consistency, realtime will also update
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['revy-chat-sessions'] });
    },
  });

  useEffect(() => {
    if (!sessionId || !supabaseReady) return;

    const channel = supabase!
      .channel(`revy_chat_messages:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'revy_chat_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMessage = payload.new as RevyChatMessage;
          queryClient.setQueryData(queryKey, (oldMessages: RevyChatMessage[] | undefined) => {
             if (oldMessages && oldMessages.find(m => m.id === newMessage.id)) {
              return oldMessages;
            }
            return oldMessages ? [...oldMessages, newMessage] : [newMessage]
          });
          queryClient.invalidateQueries({ queryKey: ['revy-chat-sessions'] });
        }
      )
      .subscribe();

    return () => {
      if (supabaseReady) {
        supabase!.removeChannel(channel);
      }
    };
  }, [sessionId, queryClient, queryKey, supabaseReady]);

  return {
    messages: messages || [],
    isLoading,
    sendMessage: sendMessageMutation.mutateAsync,
  };
};
