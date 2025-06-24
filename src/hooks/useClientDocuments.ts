
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Export the types that other components need
export type ClientDocument = {
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
  extracted_text?: string;
  text_extraction_status?: string;
  ai_suggested_subject_areas?: string[];
  ai_revision_phase_relevance?: any;
  ai_isa_standard_references?: string[];
  manual_category_override?: boolean;
  created_at: string;
  updated_at: string;
};

export type DocumentCategory = {
  id: string;
  subject_area: string;
  category_name: string;
  description?: string;
  expected_file_patterns?: string[];
  is_standard?: boolean;
  created_at: string;
};

export const useClientDocuments = (clientId: string | undefined) => {
  const queryClient = useQueryClient();
  
  console.log('📄 [USE_CLIENT_DOCUMENTS] Hook initialized with clientId:', {
    clientId,
    type: typeof clientId,
    isString: typeof clientId === 'string',
    length: clientId?.length || 0,
    isEmpty: !clientId || clientId.length === 0,
    isUndefined: clientId === undefined,
    isNull: clientId === null
  });

  // Validate clientId
  const isValidClientId = Boolean(clientId && clientId.length > 0);
  
  if (!isValidClientId) {
    console.log('❌ [USE_CLIENT_DOCUMENTS] Invalid clientId provided:', {
      clientId,
      type: typeof clientId,
      isString: typeof clientId === 'string',
      length: clientId?.length || 0
    });
  }

  const documentsQuery = useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: async () => {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      console.log('📄 [USE_CLIENT_DOCUMENTS] Fetching documents for clientId:', clientId);

      const { data, error } = await supabase
        .from('client_documents_files')
        .select('*')
        .eq('client_id', clientId);

      if (error) {
        console.error('📄 [USE_CLIENT_DOCUMENTS] Query error:', error);
        throw error;
      }

      console.log('📄 [USE_CLIENT_DOCUMENTS] Documents fetched:', data?.length || 0);
      return (data || []) as ClientDocument[];
    },
    enabled: isValidClientId,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const categoriesQuery = useQuery({
    queryKey: ['document-categories'],
    queryFn: async () => {
      console.log('📄 [USE_CLIENT_DOCUMENTS] Fetching document categories');

      const { data, error } = await supabase
        .from('document_categories')
        .select('*');

      if (error) {
        console.error('📄 [USE_CLIENT_DOCUMENTS] Categories query error:', error);
        throw error;
      }

      console.log('📄 [USE_CLIENT_DOCUMENTS] Categories fetched:', data?.length || 0);
      return (data || []) as DocumentCategory[];
    },
    retry: 1,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Delete document mutation
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
    }
  });

  // Upload document mutation
  const uploadDocument = useMutation({
    mutationFn: async ({ file, clientId, category, subjectArea }: {
      file: File;
      clientId: string;
      category?: string;
      subjectArea?: string;
    }) => {
      // This would need to be implemented with actual file upload logic
      console.log('Upload document mutation called', { file: file.name, clientId, category, subjectArea });
      throw new Error('Upload functionality not implemented yet');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-documents', clientId] });
    }
  });

  // Get document URL function
  const getDocumentUrl = async (filePath: string): Promise<string | null> => {
    try {
      // This would need to be implemented with actual storage URL logic
      console.log('Getting document URL for:', filePath);
      return null;
    } catch (error) {
      console.error('Error getting document URL:', error);
      return null;
    }
  };

  const currentState = {
    clientId: clientId || '',
    isValidClientId,
    documentsCount: documentsQuery.data?.length || 0,
    categoriesCount: categoriesQuery.data?.length || 0,
    isLoading: documentsQuery.isLoading || categoriesQuery.isLoading,
    hasError: documentsQuery.isError || categoriesQuery.isError
  };

  console.log('📊 [USE_CLIENT_DOCUMENTS] Current state:', currentState);

  return {
    documents: documentsQuery.data || [],
    categories: categoriesQuery.data || [],
    documentsCount: documentsQuery.data?.length || 0,
    categoriesCount: categoriesQuery.data?.length || 0,
    isLoading: documentsQuery.isLoading || categoriesQuery.isLoading,
    error: documentsQuery.error || categoriesQuery.error,
    refetch: documentsQuery.refetch,
    deleteDocument,
    uploadDocument,
    getDocumentUrl
  };
};
