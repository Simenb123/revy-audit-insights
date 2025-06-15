import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { RevyChatMessage } from '@/types/revio';

export const useRevyChatMessages = (sessionId: string | null) => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['revy-chat-messages', sessionId];

  const { data: messages, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from('revy_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as RevyChatMessage[];
    },
    enabled: !!sessionId && !!session?.user?.id,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (params: { content: string; sender: 'user' | 'revy', metadata?: any }) => {
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
    if (!sessionId) return;

    const channel = supabase
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
      supabase.removeChannel(channel);
    };
  }, [sessionId, queryClient, queryKey]);

  return {
    messages: messages || [],
    isLoading,
    sendMessage: sendMessageMutation.mutateAsync,
  };
};
