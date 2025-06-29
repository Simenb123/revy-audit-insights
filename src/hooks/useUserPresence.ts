import { logger } from '@/utils/logger';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useEffect } from 'react';

export interface UserPresence {
  id: string;
  userId: string;
  isOnline: boolean;
  lastSeen: string;
  currentRoomId?: string;
  userProfile?: {
    firstName?: string;
    lastName?: string;
  };
}

export function useUserPresence() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const presenceQuery = useQuery({
    queryKey: ['userPresence'],
    queryFn: async (): Promise<UserPresence[]> => {
      const { data, error } = await supabase
        .from('user_presence')
        .select(`
          id,
          user_id,
          is_online,
          last_seen,
          current_room_id
        `)
        .eq('is_online', true);

      if (error) {
        logger.error('Error fetching user presence:', error);
        return [];
      }

      // Fetch profiles separately to avoid join issues
      const userIds = [...new Set(data.map(presence => presence.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data.map(presence => {
        const profile = profileMap.get(presence.user_id);
        return {
          id: presence.id,
          userId: presence.user_id,
          isOnline: presence.is_online,
          lastSeen: presence.last_seen,
          currentRoomId: presence.current_room_id,
          userProfile: profile ? {
            firstName: profile.first_name,
            lastName: profile.last_name
          } : undefined
        };
      });
    },
    enabled: !!session,
    staleTime: 1000 * 30, // 30 seconds
  });

  const updatePresence = useMutation({
    mutationFn: async (params: { isOnline: boolean; currentRoomId?: string }) => {
      if (!session?.user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: session.user.id,
          is_online: params.isOnline,
          current_room_id: params.currentRoomId,
          last_seen: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPresence'] });
    }
  });

  // Set up real-time subscription for presence changes
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('user-presence')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['userPresence'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, queryClient]);

  // Update presence when component mounts/unmounts
  useEffect(() => {
    if (session?.user?.id) {
      updatePresence.mutate({ isOnline: true });

      // Set offline when page unloads
      const handleBeforeUnload = () => {
        updatePresence.mutate({ isOnline: false });
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        updatePresence.mutate({ isOnline: false });
      };
    }
  }, [session?.user?.id]);

  return {
    presenceData: presenceQuery.data || [],
    isLoading: presenceQuery.isLoading,
    updatePresence: updatePresence.mutate
  };
}
