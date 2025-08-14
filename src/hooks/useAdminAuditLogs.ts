import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminAuditLog {
  id: string;
  user_id: string;
  action_type: string;
  target_user_id: string | null;
  description: string;
  old_values: any;
  new_values: any;
  metadata: any;
  created_at: string;
  user?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  target_user?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export const useAdminAuditLogs = () => {
  return useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async (): Promise<AdminAuditLog[]> => {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select(`
          *,
          user:profiles!admin_audit_logs_user_id_fkey(email, first_name, last_name),
          target_user:profiles!admin_audit_logs_target_user_id_fkey(email, first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []).map(log => ({
        id: log.id,
        user_id: log.user_id,
        action_type: log.action_type,
        target_user_id: log.target_user_id,
        description: log.description,
        old_values: log.old_values,
        new_values: log.new_values,
        metadata: log.metadata,
        created_at: log.created_at,
        user: Array.isArray(log.user) && log.user.length > 0 ? log.user[0] : undefined,
        target_user: Array.isArray(log.target_user) && log.target_user.length > 0 ? log.target_user[0] : undefined,
      })) as AdminAuditLog[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};