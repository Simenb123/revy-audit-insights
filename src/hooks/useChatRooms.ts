import { logger } from '@/utils/logger';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';

export interface ChatRoom {
  id: string;
  roomType: 'team' | 'department' | 'firm';
  referenceId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useChatRooms(roomType?: 'team' | 'department' | 'firm') {
  const { data: userProfile } = useUserProfile();
  
  return useQuery({
    queryKey: ['chatRooms', roomType, userProfile?.id],
    queryFn: async (): Promise<ChatRoom[]> => {
      if (!userProfile) return [];

      let query = supabase
        .from('chat_rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (roomType) {
        query = query.eq('room_type', roomType);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching chat rooms:', error);
        return [];
      }

      return data.map(room => ({
        id: room.id,
        roomType: room.room_type,
        referenceId: room.reference_id,
        name: room.name,
        description: room.description,
        isActive: room.is_active,
        createdAt: room.created_at,
        updatedAt: room.updated_at
      }));
    },
    enabled: !!userProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
