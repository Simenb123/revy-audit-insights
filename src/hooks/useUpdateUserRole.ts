import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { UserRole } from '@/types/organization';

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      // Use the secure server-side function instead of direct database update
      const { data, error } = await supabase.rpc('secure_update_user_role', {
        p_user_id: userId,
        p_new_role: role
      });
      
      if (error) {
        // Log security event for failed role change attempt
        await supabase.rpc('log_security_event', {
          p_event_type: 'role_change_failed',
          p_severity: 'warning',
          p_description: `Failed to update role for user ${userId}: ${error.message}`,
          p_metadata: { userId, attemptedRole: role, error: error.message }
        });
        throw error;
      }
      
      // Log successful role change
      await supabase.rpc('log_security_event', {
        p_event_type: 'role_change_success',
        p_severity: 'info',
        p_description: `Successfully updated role for user ${userId} to ${role}`,
        p_metadata: { userId, newRole: role }
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-user-profiles'] });
    },
  });
};
