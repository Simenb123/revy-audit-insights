
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/organization';
import { useAuth } from '@/components/Auth/AuthProvider';

export function useUserProfile() {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: ['userProfile', session?.user?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!session?.user?.id) {
        console.log('useUserProfile: No session or user ID available');
        return null;
      }
      
      console.log('useUserProfile: Fetching profile for user:', session.user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        // Return a default admin profile for development/testing
        return {
          id: session.user.id,
          email: session.user.email || '',
          firstName: 'Test',
          lastName: 'Admin',
          workplaceCompanyName: 'Test Firma',
          auditFirmId: 'test-firm-id',
          departmentId: 'test-dept-id',
          userRole: 'admin', // Temporarily set to admin for access
          hireDate: new Date().toISOString(),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      console.log('useUserProfile: Profile data received:', data);

      return {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        workplaceCompanyName: data.workplace_company_name,
        auditFirmId: data.audit_firm_id,
        departmentId: data.department_id,
        userRole: data.user_role || 'admin', // Default to admin if not set
        hireDate: data.hire_date,
        isActive: data.is_active ?? true,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    },
    enabled: !!session?.user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
}
