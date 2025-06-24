
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export interface DocumentCategory {
  id: string;
  subject_area: string;
  category_name: string;
  description?: string;
  expected_file_patterns?: string[];
  is_standard?: boolean;
  created_at: string;
}

export const useClientDocuments = (clientId?: string) => {
  const queryClient = useQueryClient();

  // Main query for documents
  const documentsQuery = useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: async () => {
      if (!clientId) {
        devLog('No client ID provided for document query');
        return [];
      }

      devLog('Fetching client documents for client:', clientId);

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

  // Categories query
  const categoriesQuery = useQuery({
    queryKey: ['document-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_categories')
        .select('*')
        .order('subject_area', { ascending: true });

      if (error) {
        devLog('Error fetching document categories:', error);
        throw error;
      }

      return data || [];
    },
  });

  // Upload mutation
  const uploadDocument = useMutation({
    mutationFn: async (params: {
      file: File;
      clientId: string;
      category?: string;
      subjectArea?: string;
    }) => {
      // This would need proper file upload implementation
      // For now, returning a placeholder
      throw new Error('File upload not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-documents', clientId] });
    },
  });

  // Delete mutation
  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from('client_documents_files')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-documents', clientId] });
    },
  });

  // Get document URL function
  const getDocumentUrl = async (filePath: string): Promise<string | null> => {
    try {
      const { data } = await supabase.storage
        .from('client-documents')
        .createSignedUrl(filePath, 3600);
      
      return data?.signedUrl || null;
    } catch (error) {
      devLog('Error getting document URL:', error);
      return null;
    }
  };

  // Text extraction trigger
  const triggerTextExtraction = useMutation({
    mutationFn: async (documentId: string) => {
      // Placeholder for text extraction trigger
      devLog('Text extraction triggered for document:', documentId);
    },
  });

  // Helper functions
  const documents = documentsQuery.data || [];
  const categories = categoriesQuery.data || [];
  const documentsCount = documents.length;
  const categoriesCount = [...new Set(documents.map(doc => doc.category).filter(Boolean))].length;

  return {
    // Data
    documents,
    categories,
    documentsCount,
    categoriesCount,
    
    // Loading states
    isLoading: documentsQuery.isLoading || categoriesQuery.isLoading,
    error: documentsQuery.error || categoriesQuery.error,
    
    // Mutations
    uploadDocument,
    deleteDocument,
    triggerTextExtraction,
    
    // Functions
    getDocumentUrl,
    
    // Refetch
    refetch: documentsQuery.refetch,
  };
};
