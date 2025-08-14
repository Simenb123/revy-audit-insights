import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TemporaryAccess {
  id: string;
  user_id: string;
  resource_type: 'client' | 'department' | 'system';
  resource_id: string | null;
  granted_by: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'revoked';
  reason: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  user?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  granted_by_user?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export const useTemporaryAccess = () => {
  return useQuery({
    queryKey: ['temporary-access'],
    queryFn: async (): Promise<TemporaryAccess[]> => {
      const { data, error } = await supabase
        .from('temporary_access')
        .select(`
          *,
          user:profiles!temporary_access_user_id_fkey(email, first_name, last_name),
          granted_by_user:profiles!temporary_access_granted_by_fkey(email, first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(access => ({
        id: access.id,
        user_id: access.user_id,
        resource_type: access.resource_type as 'client' | 'department' | 'system',
        resource_id: access.resource_id,
        granted_by: access.granted_by,
        start_date: access.start_date,
        end_date: access.end_date,
        status: access.status as 'active' | 'expired' | 'revoked',
        reason: access.reason,
        metadata: access.metadata,
        created_at: access.created_at,
        updated_at: access.updated_at,
        user: Array.isArray(access.user) && access.user.length > 0 ? access.user[0] : undefined,
        granted_by_user: Array.isArray(access.granted_by_user) && access.granted_by_user.length > 0 ? access.granted_by_user[0] : undefined,
      })) as TemporaryAccess[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useGrantTemporaryAccess = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      userId: string;
      resourceType: 'client' | 'department' | 'system';
      resourceId?: string;
      startDate: string;
      endDate: string;
      reason?: string;
    }) => {
      const { data, error } = await supabase
        .from('temporary_access')
        .insert({
          user_id: params.userId,
          resource_type: params.resourceType,
          resource_id: params.resourceId,
          start_date: params.startDate,
          end_date: params.endDate,
          reason: params.reason,
          granted_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Midlertidig tilgang gitt',
        description: 'Bruker har fått midlertidig tilgang.',
      });
      queryClient.invalidateQueries({ queryKey: ['temporary-access'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Feil ved tildeling',
        description: error?.message || 'Kunne ikke gi midlertidig tilgang.',
        variant: 'destructive',
      });
    },
  });
};

export const useRevokeTemporaryAccess = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (accessId: string) => {
      const { data, error } = await supabase
        .from('temporary_access')
        .update({ status: 'revoked' })
        .eq('id', accessId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Tilgang tilbakekalt',
        description: 'Midlertidig tilgang er tilbakekalt.',
      });
      queryClient.invalidateQueries({ queryKey: ['temporary-access'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Feil ved tilbakekalling',
        description: error?.message || 'Kunne ikke tilbakekalle tilgang.',
        variant: 'destructive',
      });
    },
  });
};