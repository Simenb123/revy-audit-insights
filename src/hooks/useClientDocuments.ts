
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ClientDocument {
  id: string;
  client_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  category: string;
  description?: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  extracted_text?: string;
  ai_analysis_summary?: string;
  text_extraction_status?: 'pending' | 'processing' | 'completed' | 'failed';
}

export const useClientDocuments = (clientId: string) => {
  console.log('📄 [USE_CLIENT_DOCUMENTS] Hook initialized with clientId:', clientId, {
    type: typeof clientId,
    isString: typeof clientId === 'string',
    length: clientId?.length,
    isEmpty: !clientId || clientId.trim() === '',
    isUndefined: clientId === 'undefined',
    isNull: clientId === 'null'
  });

  // Enhanced validation
  if (!clientId || clientId.trim() === '' || clientId === 'undefined' || clientId === 'null') {
    console.error('❌ [USE_CLIENT_DOCUMENTS] Invalid clientId provided:', {
      clientId,
      type: typeof clientId,
      isString: typeof clientId === 'string',
      length: clientId?.length
    });
    
    // Return empty state for invalid client ID
    return {
      documents: [],
      categories: [],
      isLoading: false,
      error: new Error('Invalid client ID'),
      refetch: () => Promise.resolve()
    };
  }

  const queryClient = useQueryClient();

  const { data: documents = [], isLoading, error, refetch } = useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: async (): Promise<ClientDocument[]> => {
      console.log('🔍 [USE_CLIENT_DOCUMENTS] Fetching documents for clientId:', clientId);
      
      const { data, error } = await supabase
        .from('client_documents_files')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [USE_CLIENT_DOCUMENTS] Database error:', error);
        throw error;
      }

      console.log('✅ [USE_CLIENT_DOCUMENTS] Successfully fetched documents:', {
        clientId,
        count: data?.length || 0,
        documents: data?.map(d => ({
          id: d.id,
          fileName: d.file_name,
          status: d.text_extraction_status
        }))
      });

      return data || [];
    },
    enabled: !!(clientId && clientId.trim() !== '' && clientId !== 'undefined' && clientId !== 'null'),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Get unique categories
  const categories = [...new Set(documents.map(doc => doc.category))].filter(Boolean);

  console.log('📊 [USE_CLIENT_DOCUMENTS] Current state:', {
    clientId,
    documentsCount: documents.length,
    categoriesCount: categories.length,
    isLoading,
    hasError: !!error
  });

  return {
    documents,
    categories,
    isLoading,
    error,
    refetch
  };
};
