import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { RevyChatSession } from '@/types/revio';

export const useRevyChatSessions = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const supabaseReady = isSupabaseConfigured && !!supabase;

  useEffect(() => {
    if (!supabaseReady) {
      toast({ title: 'Supabase is not configured.' });
    }
  }, [supabaseReady, toast]);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['revy-chat-sessions', session?.user?.id],
    queryFn: async () => {
      if (!supabaseReady || !session?.user?.id) return [];
      const { data, error } = await supabase
        .from('revy_chat_sessions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as RevyChatSession[];
    },
    enabled: !!session?.user?.id && supabaseReady,
  });

  const createSessionMutation = useMutation({
    mutationFn: async (params: { title?: string; context?: string; clientId?: string }) => {
      if (!supabaseReady) {
        toast({ title: 'Supabase is not configured.' });
        return;
      }
      if (!session?.user?.id) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('revy_chat_sessions')
        .insert({
          user_id: session.user.id,
          title: params.title || 'Ny samtale',
          context: params.context,
          client_id: params.clientId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as RevyChatSession;
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ['revy-chat-sessions'] });
      queryClient.setQueryData(['revy-chat-sessions', session?.user?.id], (old: RevyChatSession[] | undefined) => {
        return old ? [newSession, ...old] : [newSession];
      });
    },
  });

  return {
    sessions: sessions || [],
    isLoading,
    createSession: createSessionMutation.mutateAsync,
  };
};
