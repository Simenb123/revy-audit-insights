
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface CreateChatRoomParams {
  roomType: 'team' | 'department' | 'firm';
  referenceId: string;
  name: string;
  description?: string;
}

export function useCreateChatRoom() {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateChatRoomParams) => {
      if (!session?.user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('chat_rooms')
        .insert({
          room_type: params.roomType,
          reference_id: params.referenceId,
          name: params.name,
          description: params.description,
          is_active: true
        });

      if (error) throw error;

      return params;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      toast({
        title: "Chat-rom opprettet",
        description: "Det nye chat-rommet er nå tilgjengelig.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Feil ved oppretting av chat-rom",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}
