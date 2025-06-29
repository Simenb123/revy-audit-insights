import { logger } from '@/utils/logger';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  messageType: string;
  parentMessageId?: string;
  isEdited: boolean;
  editedAt?: string;
  metadata?: any;
  createdAt: string;
  senderProfile?: {
    firstName?: string;
    lastName?: string;
  };
}

interface SendMessageParams {
  roomId: string;
  content: string;
  messageType?: string;
  parentMessageId?: string;
}

export function useMessages(roomId: string) {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ['messages', roomId],
    queryFn: async (): Promise<Message[]> => {
      if (!roomId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          room_id,
          sender_id,
          content,
          message_type,
          parent_message_id,
          is_edited,
          edited_at,
          metadata,
          created_at
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        logger.error('Error fetching messages:', error);
        return [];
      }

      // Fetch profiles separately to avoid join issues
      const senderIds = [...new Set(data.map(msg => msg.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', senderIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data.map(msg => {
        const profile = profileMap.get(msg.sender_id);
        return {
          id: msg.id,
          roomId: msg.room_id,
          senderId: msg.sender_id,
          content: msg.content,
          messageType: msg.message_type,
          parentMessageId: msg.parent_message_id,
          isEdited: msg.is_edited,
          editedAt: msg.edited_at,
          metadata: msg.metadata,
          createdAt: msg.created_at,
          senderProfile: profile ? {
            firstName: profile.first_name,
            lastName: profile.last_name
          } : undefined
        };
      });
    },
    enabled: !!roomId && !!session,
    staleTime: 0, // Always fetch fresh data for real-time
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!roomId || !session) return;

    const channel = supabase
      .channel(`messages:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', roomId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, session, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async (params: SendMessageParams) => {
      if (!session?.user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('messages')
        .insert({
          room_id: params.roomId,
          sender_id: session.user.id,
          content: params.content,
          message_type: params.messageType || 'text',
          parent_message_id: params.parentMessageId
        });

      if (error) throw error;
    },
    onError: (error: any) => {
      toast({
        title: "Feil ved sending av melding",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    sendMessage: sendMessage.mutate,
    isSending: sendMessage.isPending
  };
}
