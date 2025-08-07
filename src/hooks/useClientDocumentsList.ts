
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

      // EXTENSIVE DEBUG LOGGING FOR DOCUMENT LEAKAGE INVESTIGATION
      devLog('=== DOCUMENT QUERY DEBUG START ===');
      devLog('Requested client ID:', clientId);
      
      // Check current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        devLog('❌ Auth error:', authError);
        throw authError;
      }
      
      devLog('Current user ID:', user?.id);
      devLog('Current user email:', user?.email);

      // Perform the query
      devLog('Executing query with client_id filter:', clientId);
      const { data: documents, error } = await supabase
        .from('client_documents_files')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        devLog('❌ Database error:', error);
        throw error;
      }

      // DETAILED ANALYSIS OF RETURNED DOCUMENTS
      devLog('✅ Query executed successfully');
      devLog('Total documents returned:', documents?.length || 0);
      
      if (documents && documents.length > 0) {
        devLog('=== DOCUMENT ANALYSIS ===');
        
        // Group by client_id to detect leakage
        const clientGroups = documents.reduce((acc, doc) => {
          const clientId = doc.client_id;
          if (!acc[clientId]) {
            acc[clientId] = [];
          }
          acc[clientId].push(doc);
          return acc;
        }, {} as Record<string, typeof documents>);
        
        devLog('Documents grouped by client_id:', Object.keys(clientGroups).map(cId => ({
          client_id: cId,
          count: clientGroups[cId].length,
          matches_requested: cId === clientId
        })));
        
        // Check for data leakage
        const wrongClientDocs = documents.filter(doc => doc.client_id !== clientId);
        if (wrongClientDocs.length > 0) {
          devLog('🚨 CRITICAL: Documents from wrong clients detected!');
          devLog('Wrong client documents:', wrongClientDocs.map(doc => ({
            id: doc.id,
            file_name: doc.file_name,
            actual_client_id: doc.client_id,
            expected_client_id: clientId,
            user_id: doc.user_id
          })));
        }
        
        // Sample first few documents for detailed inspection
        const sampleDocs = documents.slice(0, 3);
        devLog('Sample documents:', sampleDocs.map(doc => ({
          id: doc.id,
          file_name: doc.file_name,
          client_id: doc.client_id,
          user_id: doc.user_id,
          created_at: doc.created_at
        })));
      }
      
      devLog('=== DOCUMENT QUERY DEBUG END ===');
      return documents || [];
    },
    enabled: !!clientId,
  });
};
