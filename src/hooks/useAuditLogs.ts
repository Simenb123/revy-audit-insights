import { logger } from '@/utils/logger';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';
import { AuditLogAction } from '@/types/organization';

interface AuditLog {
  id: string;
  clientId: string;
  userId: string;
  reviewerId?: string;
  actionType: AuditLogAction;
  areaName: string;
  description?: string;
  isReviewed: boolean;
  reviewedAt?: string;
  metadata?: any;
  createdAt: string;
}

interface UseAuditLogsParams {
  searchTerm?: string;
  actionType?: AuditLogAction;
  isReviewed?: boolean;
  clientId?: string;
}

export function useAuditLogs(params: UseAuditLogsParams = {}) {
  const { data: userProfile } = useUserProfile();
  
  return useQuery({
    queryKey: ['auditLogs', userProfile?.auditFirmId, params],
    queryFn: async (): Promise<AuditLog[]> => {
      if (!userProfile?.auditFirmId) return [];
      
      let query = supabase
        .from('audit_logs')
        .select(`
          id,
          client_id,
          user_id,
          reviewer_id,
          action_type,
          area_name,
          description,
          is_reviewed,
          reviewed_at,
          metadata,
          created_at
        `)
        .order('created_at', { ascending: false });

      // Filter by client if specified
      if (params.clientId) {
        query = query.eq('client_id', params.clientId);
      }

      // Filter by action type if specified
      if (params.actionType) {
        query = query.eq('action_type', params.actionType);
      }

      // Filter by review status if specified
      if (params.isReviewed !== undefined) {
        query = query.eq('is_reviewed', params.isReviewed);
      }

      // Search in description if specified
      if (params.searchTerm) {
        query = query.ilike('description', `%${params.searchTerm}%`);
      }

      const { data, error } = await query.limit(100);

      if (error) {
        logger.error('Error fetching audit logs:', error);
        return [];
      }

      return data.map(log => ({
        id: log.id,
        clientId: log.client_id,
        userId: log.user_id,
        reviewerId: log.reviewer_id,
        actionType: log.action_type as AuditLogAction,
        areaName: log.area_name,
        description: log.description,
        isReviewed: log.is_reviewed,
        reviewedAt: log.reviewed_at,
        metadata: log.metadata,
        createdAt: log.created_at
      }));
    },
    enabled: !!userProfile?.auditFirmId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
