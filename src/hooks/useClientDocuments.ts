
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useClientDocuments = (clientId: string | undefined) => {
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
      return data || [];
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
      return data || [];
    },
    retry: 1,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

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
    refetch: documentsQuery.refetch
  };
};
