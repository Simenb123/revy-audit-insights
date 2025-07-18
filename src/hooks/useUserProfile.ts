
import { logger } from '@/utils/logger';

import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/organization';
import { useAuth } from '@/components/Auth/AuthProvider';

export function useUserProfile() {
  const { session, connectionStatus } = useAuth();
  
  return useQuery({
    queryKey: ['userProfile', session?.user?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      // If no connection to Supabase, return demo profile
      if (connectionStatus === 'disconnected' || !isSupabaseConfigured) {
        logger.log('useUserProfile: No Supabase connection, returning demo profile');
        return {
          id: 'demo-user-id',
          email: 'demo@example.com',
          firstName: 'Demo',
          lastName: 'User',
          workplaceCompanyName: 'Demo Revisjonsselskap',
          auditFirmId: null,
          departmentId: null,
          userRole: 'employee',
          hireDate: null,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      if (!session?.user?.id) {
        logger.log('useUserProfile: No session or user ID available');
        return null;
      }
      
      logger.log('useUserProfile: Fetching profile for user:', session.user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        logger.error('Error fetching user profile:', error);
        throw error;
      }

      if (!data) {
        logger.log('useUserProfile: No profile data found');
        return null;
      }

      logger.log('useUserProfile: Profile data received:', data);

      return {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        workplaceCompanyName: data.workplace_company_name,
        auditFirmId: data.audit_firm_id,
        departmentId: data.department_id,
        userRole: data.user_role || 'employee', // Default to employee, not admin
        hireDate: data.hire_date,
        isActive: data.is_active ?? true,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    },
    enabled: true, // Always enabled, will handle connection status internally
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}
