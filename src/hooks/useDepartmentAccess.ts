import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DepartmentAccess {
  id: string;
  user_id: string;
  department_id: string;
  access_type: 'full' | 'read' | 'limited';
  granted_by: string | null;
  granted_at: string;
  expires_at: string | null;
  is_active: boolean;
  user?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  department?: {
    name: string;
  };
  granted_by_user?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export const useDepartmentAccess = () => {
  return useQuery({
    queryKey: ['department-access'],
    queryFn: async (): Promise<DepartmentAccess[]> => {
      const { data, error } = await supabase
        .from('department_access')
        .select(`
          *,
          user:profiles!department_access_user_id_fkey(email, first_name, last_name),
          department:departments!department_access_department_id_fkey(name),
          granted_by_user:profiles!department_access_granted_by_fkey(email, first_name, last_name)
        `)
        .eq('is_active', true)
        .order('granted_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(access => ({
        id: access.id,
        user_id: access.user_id,
        department_id: access.department_id,
        access_type: access.access_type as 'full' | 'read' | 'limited',
        granted_by: access.granted_by,
        granted_at: access.granted_at,
        expires_at: access.expires_at,
        is_active: access.is_active,
        user: Array.isArray(access.user) && access.user.length > 0 ? access.user[0] : undefined,
        department: Array.isArray(access.department) && access.department.length > 0 ? access.department[0] : undefined,
        granted_by_user: Array.isArray(access.granted_by_user) && access.granted_by_user.length > 0 ? access.granted_by_user[0] : undefined,
      })) as DepartmentAccess[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useGrantDepartmentAccess = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      userId: string;
      departmentId: string;
      accessType: 'full' | 'read' | 'limited';
      expiresAt?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('department_access')
        .upsert({
          user_id: params.userId,
          department_id: params.departmentId,
          access_type: params.accessType,
          granted_by: user.id,
          expires_at: params.expiresAt,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Avdelingstilgang gitt',
        description: 'Bruker har fått tilgang til avdelingen.',
      });
      queryClient.invalidateQueries({ queryKey: ['department-access'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Feil ved tildeling',
        description: error?.message || 'Kunne ikke gi avdelingstilgang.',
        variant: 'destructive',
      });
    },
  });
};

export const useRevokeDepartmentAccess = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (accessId: string) => {
      const { data, error } = await supabase
        .from('department_access')
        .update({ is_active: false })
        .eq('id', accessId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Tilgang tilbakekalt',
        description: 'Avdelingstilgang er tilbakekalt.',
      });
      queryClient.invalidateQueries({ queryKey: ['department-access'] });
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