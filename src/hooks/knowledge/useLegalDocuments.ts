import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { LegalDocument, DocumentNodeType } from '@/types/legal-knowledge';

interface FetchLegalDocumentsParams {
  documentType?: DocumentNodeType;
  limit?: number;
  enabled?: boolean;
}

/**
 * Hook for fetching legal documents from Supabase
 * Supports filtering by document type and includes document type information
 */
export const useLegalDocuments = ({ 
  documentType, 
  limit = 50, 
  enabled = true 
}: FetchLegalDocumentsParams = {}) => {
  return useQuery({
    queryKey: ['legal-documents', { documentType, limit }],
    queryFn: async () => {
      let query = supabase
        .from('legal_documents')
        .select(`
          *,
          document_type:legal_document_types(*)
        `)
        .eq('document_status', 'active')
        .order('title', { ascending: true });

      // Filter by document type if specified
      if (documentType && documentType !== 'ukjent') {
        // Join with document types to filter by name
        query = query.eq('legal_document_types.name', documentType);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching legal documents:', error);
        throw error;
      }

      return (data || []) as LegalDocument[];
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for fetching a single legal document by ID
 */
export const useLegalDocument = (id?: string) => {
  return useQuery({
    queryKey: ['legal-document', id],
    queryFn: async () => {
      if (!id) throw new Error('Document ID is required');

      const { data, error } = await supabase
        .from('legal_documents')
        .select(`
          *,
          document_type:legal_document_types(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching legal document:', error);
        throw error;
      }

      return data as LegalDocument;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook for fetching legal document types
 */
export const useLegalDocumentTypes = () => {
  return useQuery({
    queryKey: ['legal-document-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legal_document_types')
        .select('*')
        .eq('is_active', true)
        .order('hierarchy_level', { ascending: true })
        .order('display_name', { ascending: true });

      if (error) {
        console.error('Error fetching legal document types:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};