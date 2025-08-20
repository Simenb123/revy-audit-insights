import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { UserRole } from '@/types/organization';

export interface PendingUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  workplace_company_name: string;
  created_at: string;
}

export const usePendingUsers = () => {
  return useQuery({
    queryKey: ['pending-users'],
    queryFn: async (): Promise<PendingUser[]> => {
      const { data, error } = await supabase.rpc('get_pending_users');
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useApproveUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, role = 'employee' }: { userId: string; role?: UserRole }) => {
      const { data, error } = await supabase.rpc('approve_user', {
        user_id_to_approve: userId,
        assign_role: role
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      toast({
        title: "Bruker godkjent",
        description: "Brukeren har blitt aktivert og kan nå logge inn.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Feil ved godkjenning",
        description: error.message || "Kunne ikke godkjenne brukeren.",
        variant: "destructive",
      });
    },
  });
};

export const useRejectUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      const { data, error } = await supabase.rpc('reject_user', {
        user_id_to_reject: userId,
        rejection_reason: reason
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      toast({
        title: "Bruker avvist",
        description: "Brukeren har blitt slettet fra systemet.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Feil ved avvisning", 
        description: error.message || "Kunne ikke avvise brukeren.",
        variant: "destructive",
      });
    },
  });
};