import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SaftImportSession {
  id: string;
  client_id: string;
  file_name: string;
  file_size: number;
  import_status: string;
  saft_version: string;
  processing_started_at: string;
  processing_completed_at?: string;
  created_by: string;
  upload_batch_id?: string;
  metadata: {
    header?: any;
    company?: any;
    total_accounts?: number;
    total_transactions?: number;
    total_customers?: number;
    total_suppliers?: number;
    total_analysis_types?: number;
    total_journals?: number;
  };
  created_at: string;
  updated_at: string;
}

export const useSaftImportSessions = (clientId?: string) => {
  return useQuery({
    queryKey: ['saft-import-sessions', clientId],
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('saft_import_sessions')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SaftImportSession[];
    },
    enabled: !!clientId,
  });
};