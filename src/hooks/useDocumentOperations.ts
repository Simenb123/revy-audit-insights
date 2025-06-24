
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { devLog } from '@/utils/devLogger';

export const useDocumentOperations = (clientId?: string) => {
  const queryClient = useQueryClient();

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

  // Download document function
  const downloadDocument = async (documentId: string) => {
    try {
      devLog('Downloading document:', documentId);
      
      // Get document data
      const { data: documentData, error } = await supabase
        .from('client_documents_files')
        .select('file_path, file_name')
        .eq('id', documentId)
        .single();

      if (error || !documentData) {
        throw new Error('Document not found');
      }

      // Get signed URL for download
      const { data } = await supabase.storage
        .from('client-documents')
        .createSignedUrl(documentData.file_path, 3600);
      
      if (data?.signedUrl) {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = documentData.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        devLog('Document download initiated:', documentData.file_name);
      } else {
        throw new Error('Could not generate download URL');
      }
    } catch (error) {
      devLog('Error downloading document:', error);
      throw error;
    }
  };

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

  return {
    uploadDocument,
    deleteDocument,
    downloadDocument,
    getDocumentUrl,
    triggerTextExtraction,
  };
};
