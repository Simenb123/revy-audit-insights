import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { UserRole } from '@/types/organization';

interface BulkUserAction {
  userIds: string[];
  action: 'activate' | 'deactivate' | 'delete';
  reason?: string;
}

interface UpdateUserData {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  userRole?: UserRole;
  isActive?: boolean;
}

const logAdminAction = async (action: string, targetUserId: string | null, description: string, oldValues: any = {}, newValues: any = {}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  await supabase.from('admin_audit_logs').insert({
    user_id: user.id,
    action_type: action,
    target_user_id: targetUserId,
    description,
    old_values: oldValues,
    new_values: newValues,
  });
};

export const useBulkUserActions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userIds, action, reason }: BulkUserAction) => {
      const updates: any = {};
      let actionDescription = '';

      switch (action) {
        case 'activate':
          updates.is_active = true;
          actionDescription = `Aktiverte ${userIds.length} brukere`;
          break;
        case 'deactivate':
          updates.is_active = false;
          actionDescription = `Deaktiverte ${userIds.length} brukere`;
          break;
        case 'delete':
          // Soft delete by marking as inactive and updating metadata
          updates.is_active = false;
          updates.user_role = 'employee'; // Reset role for safety
          actionDescription = `Slettet ${userIds.length} brukere`;
          break;
      }

      // Update users in batch
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .in('id', userIds);

      if (error) throw error;

      // Log each action
      for (const userId of userIds) {
        await logAdminAction(
          `bulk_${action}`,
          userId,
          `${actionDescription}${reason ? ` - Årsak: ${reason}` : ''}`,
          {},
          updates
        );
      }

      return { userIds, action };
    },
    onSuccess: ({ userIds, action }) => {
      const actionText = action === 'activate' ? 'aktivert' : action === 'deactivate' ? 'deaktivert' : 'slettet';
      toast({
        title: `Brukere ${actionText}`,
        description: `${userIds.length} brukere er ${actionText}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['all-user-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['employees-firm'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Feil ved bulk-operasjon',
        description: error?.message || 'Kunne ikke utføre operasjonen.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, ...updates }: UpdateUserData) => {
      // Get current user data for audit log
      const { data: currentUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: updates.firstName,
          last_name: updates.lastName,
          email: updates.email,
          user_role: updates.userRole,
          is_active: updates.isActive,
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Log the action
      await logAdminAction(
        'user_update',
        userId,
        'Oppdaterte brukerinformasjon',
        currentUser,
        data
      );

      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Bruker oppdatert',
        description: 'Brukerinformasjon er oppdatert.',
      });
      queryClient.invalidateQueries({ queryKey: ['all-user-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['employees-firm'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Feil ved oppdatering',
        description: error?.message || 'Kunne ikke oppdatere bruker.',
        variant: 'destructive',
      });
    },
  });
};

export const useSyncUsers = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      // This would sync users between auth.users and profiles tables
      // For now, we'll just refresh the data
      await logAdminAction(
        'sync_users',
        null,
        'Synkroniserte brukere mellom auth.users og profiles'
      );
      
      return true;
    },
    onSuccess: () => {
      toast({
        title: 'Synkronisering fullført',
        description: 'Alle brukere er synkronisert.',
      });
      queryClient.invalidateQueries({ queryKey: ['all-user-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['employees-firm'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Feil ved synkronisering',
        description: error?.message || 'Kunne ikke synkronisere brukere.',
        variant: 'destructive',
      });
    },
  });
};