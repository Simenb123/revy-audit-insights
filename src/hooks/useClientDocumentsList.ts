
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { devLog } from '@/utils/devLogger';

export interface ClientDocument {
  id: string;
  client_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  category?: string;
  subject_area?: string;
  ai_suggested_category?: string;
  ai_analysis_summary?: string;
  ai_confidence_score?: number;
  manual_category_override?: boolean;
  extracted_text?: string;
  text_extraction_status?: string;
  ai_suggested_subject_areas?: string[];
  ai_revision_phase_relevance?: any;
  ai_isa_standard_references?: string[];
  created_at: string;
  updated_at: string;
}

export const useClientDocumentsList = (clientId?: string) => {
  return useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: async () => {
      if (!clientId) {
        devLog('No client ID available for document query');
        return [];
      }

      devLog('Fetching client documents for client UUID:', clientId);

      const { data: documents, error } = await supabase
        .from('client_documents_files')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        devLog('Error fetching client documents:', error);
        throw error;
      }

      devLog('Client documents fetched:', { count: documents?.length || 0 });
      return documents || [];
    },
    enabled: !!clientId,
  });
};
