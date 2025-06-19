
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EnhancedClientDocument {
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
  ai_confidence_score?: number;
  ai_analysis_summary?: string;
  manual_category_override?: boolean;
  created_at: string;
  updated_at: string;
  extracted_text?: string;
  text_extraction_status?: string;
}

export const useEnhancedClientDocuments = (clientId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch documents with enhanced categorization info
  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ['enhanced-client-documents', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('client_documents_files')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EnhancedClientDocument[];
    },
    enabled: !!clientId
  });

  // Update document category
  const updateDocumentCategory = useMutation({
    mutationFn: async (data: {
      documentId: string;
      category: string;
      manualOverride?: boolean;
    }) => {
      const { error } = await supabase
        .from('client_documents_files')
        .update({
          category: data.category,
          manual_category_override: data.manualOverride || true,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.documentId);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-client-documents'] });
      toast({
        title: "Kategori oppdatert",
        description: "Dokumentkategorien har blitt endret.",
      });
    },
    onError: (error) => {
      toast({
        title: "Kunne ikke oppdatere kategori",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Get categorization statistics
  const getCategorizeionStats = () => {
    const highConfidence = documents.filter(d => d.ai_confidence_score && d.ai_confidence_score >= 0.8).length;
    const mediumConfidence = documents.filter(d => d.ai_confidence_score && d.ai_confidence_score >= 0.6 && d.ai_confidence_score < 0.8).length;
    const lowConfidence = documents.filter(d => d.ai_confidence_score && d.ai_confidence_score < 0.6).length;
    const uncategorized = documents.filter(d => !d.ai_confidence_score).length;
    
    return {
      highConfidence,
      mediumConfidence,
      lowConfidence,
      uncategorized,
      total: documents.length
    };
  };

  // Get documents by confidence level
  const getDocumentsByConfidence = (level: 'high' | 'medium' | 'low' | 'uncategorized') => {
    switch (level) {
      case 'high':
        return documents.filter(d => d.ai_confidence_score && d.ai_confidence_score >= 0.8);
      case 'medium':
        return documents.filter(d => d.ai_confidence_score && d.ai_confidence_score >= 0.6 && d.ai_confidence_score < 0.8);
      case 'low':
        return documents.filter(d => d.ai_confidence_score && d.ai_confidence_score < 0.6);
      case 'uncategorized':
        return documents.filter(d => !d.ai_confidence_score);
      default:
        return documents;
    }
  };

  return {
    documents,
    isLoading,
    refetch,
    updateDocumentCategory,
    getCategorizeionStats,
    getDocumentsByConfidence
  };
};
