
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  workplaceCompanyName?: string;
}

export function useUpdateUserProfile() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      if (!session?.user?.id) {
        throw new Error('No authenticated user');
      }

      const updateData: any = {};
      if (data.firstName !== undefined) updateData.first_name = data.firstName;
      if (data.lastName !== undefined) updateData.last_name = data.lastName;
      if (data.workplaceCompanyName !== undefined) updateData.workplace_company_name = data.workplaceCompanyName;
      
      updateData.updated_at = new Date().toISOString();

      const { data: result, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', session.user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      // Invalidate and refetch user profile
      queryClient.invalidateQueries({ queryKey: ['userProfile', session?.user?.id] });
    },
  });
}
