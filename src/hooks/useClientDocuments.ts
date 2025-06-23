
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
  subject_area?: string;
  ai_suggested_category?: string;
  ai_confidence_score?: number;
  ai_suggested_subject_areas?: string[];
  ai_isa_standard_references?: string[];
  ai_revision_phase_relevance?: any;
  manual_category_override?: boolean;
}

export interface DocumentCategory {
  id: string;
  category_name: string;
  subject_area: string;
  description?: string;
  expected_file_patterns?: string[];
  is_standard: boolean;
  created_at: string;
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
      refetch: () => Promise.resolve(),
      deleteDocument: { mutate: () => {}, isPending: false },
      getDocumentUrl: async () => null,
      uploadDocument: { mutate: () => {}, isPending: false },
      downloadDocument: async () => {},
      triggerTextExtraction: async () => {}
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
      toast({
        title: "Dokument slettet",
        description: "Dokumentet har blitt slettet",
      });
    },
    onError: (error) => {
      toast({
        title: "Feil ved sletting",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Upload document mutation
  const uploadDocument = useMutation({
    mutationFn: async (file: File) => {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${clientId}/${fileName}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Create database record
      const { error: dbError } = await supabase
        .from('client_documents_files')
        .insert({
          client_id: clientId,
          file_name: file.name,
          file_path: filePath,
          mime_type: file.type,
          file_size: file.size,
          user_id: 'placeholder-user-id' // This should come from auth
        });
      
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-documents', clientId] });
      toast({
        title: "Dokument lastet opp",
        description: "Dokumentet har blitt lastet opp",
      });
    },
    onError: (error) => {
      toast({
        title: "Feil ved opplasting",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Get document URL function
  const getDocumentUrl = async (filePath: string): Promise<string | null> => {
    try {
      const { data } = await supabase.storage
        .from('client-documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry
      
      return data?.signedUrl || null;
    } catch (error) {
      console.error('Error getting document URL:', error);
      return null;
    }
  };

  // Download document function
  const downloadDocument = async (document: ClientDocument) => {
    const url = await getDocumentUrl(document.file_path);
    if (!url) return;
    
    const link = window.document.createElement('a');
    link.href = url;
    link.download = document.file_name;
    link.click();
  };

  // Trigger text extraction function
  const triggerTextExtraction = async (documentId: string) => {
    try {
      const { error } = await supabase.functions.invoke('extract-document-text', {
        body: { documentId }
      });
      
      if (error) throw error;
      
      toast({
        title: "Tekstekstraksjon startet",
        description: "Prosessering av dokumentet har startet",
      });
    } catch (error) {
      toast({
        title: "Feil ved tekstekstraksjon",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
    refetch,
    deleteDocument,
    getDocumentUrl,
    uploadDocument,
    downloadDocument,
    triggerTextExtraction
  };
};
