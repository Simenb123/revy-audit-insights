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
  uploaded_by: string; // This maps to user_id from database
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

  const queryClient = useQueryClient();

  // Enhanced validation with consistent return structure
  const isValidClientId = !!(clientId && 
    clientId.trim() !== '' && 
    clientId !== 'undefined' && 
    clientId !== 'null' &&
    typeof clientId === 'string');

  if (!isValidClientId) {
    console.error('❌ [USE_CLIENT_DOCUMENTS] Invalid clientId provided:', {
      clientId,
      type: typeof clientId,
      isString: typeof clientId === 'string',
      length: clientId?.length
    });
  }

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

      // Map database fields to ClientDocument interface
      return (data || []).map(doc => ({
        ...doc,
        uploaded_by: doc.user_id, // Map user_id to uploaded_by
        category: doc.category || '',
        description: doc.ai_analysis_summary || undefined,
        subject_area: doc.subject_area || undefined,
        ai_suggested_category: doc.ai_suggested_category || undefined,
        ai_confidence_score: doc.ai_confidence_score || undefined,
        ai_suggested_subject_areas: doc.ai_suggested_subject_areas || undefined,
        ai_isa_standard_references: doc.ai_isa_standard_references || undefined,
        ai_revision_phase_relevance: doc.ai_revision_phase_relevance || undefined,
        manual_category_override: doc.manual_category_override || undefined,
        text_extraction_status: doc.text_extraction_status as 'pending' | 'processing' | 'completed' | 'failed' || 'pending'
      }));
    },
    enabled: isValidClientId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Fetch document categories
  const { data: categoriesData = [] } = useQuery({
    queryKey: ['document-categories'],
    queryFn: async (): Promise<DocumentCategory[]> => {
      const { data, error } = await supabase
        .from('document_categories')
        .select('*')
        .order('category_name');

      if (error) {
        console.error('❌ [USE_CLIENT_DOCUMENTS] Categories error:', error);
        throw error;
      }

      return data || [];
    },
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

  // Upload document mutation - FIXED: Get actual user ID
  const uploadDocument = useMutation({
    mutationFn: async (params: { file: File; clientId: string; category?: string; subjectArea?: string }) => {
      const { file, category, subjectArea } = params;
      
      // Get the authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User must be authenticated to upload documents');
      }
      
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${clientId}/${fileName}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Create database record with actual user ID
      const { error: dbError } = await supabase
        .from('client_documents_files')
        .insert({
          client_id: clientId,
          file_name: file.name,
          file_path: filePath,
          mime_type: file.type,
          file_size: file.size,
          user_id: user.id, // Use actual authenticated user ID
          category: category || null,
          subject_area: subjectArea || null
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

  console.log('📊 [USE_CLIENT_DOCUMENTS] Current state:', {
    clientId,
    isValidClientId,
    documentsCount: Array.isArray(documents) ? documents.length : 0,
    categoriesCount: Array.isArray(categoriesData) ? categoriesData.length : 0,
    isLoading,
    hasError: !!error
  });

  // Always return a consistent structure with guaranteed arrays
  return {
    documents: Array.isArray(documents) ? documents : [],
    categories: Array.isArray(categoriesData) ? categoriesData : [],
    isLoading: isValidClientId ? isLoading : false,
    error: isValidClientId ? error : new Error('Invalid client ID'),
    refetch: isValidClientId ? refetch : () => Promise.resolve(),
    deleteDocument,
    getDocumentUrl,
    uploadDocument,
    downloadDocument,
    triggerTextExtraction
  };
};
