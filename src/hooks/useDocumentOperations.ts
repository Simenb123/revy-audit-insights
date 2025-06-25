
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { devLog } from '@/utils/devLogger';
import { useToast } from '@/hooks/use-toast';

export const useDocumentOperations = (clientId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Upload mutation
  const uploadDocument = useMutation({
    mutationFn: async (params: {
      file: File;
      clientId: string;
      category?: string;
      subjectArea?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = params.file.name.split('.').pop();
      const randomName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${randomName}`;

      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, params.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: document, error: insertError } = await supabase
        .from('client_documents_files')
        .insert({
          client_id: params.clientId,
          user_id: user.id,
          file_name: params.file.name,
          file_path: filePath,
          file_size: params.file.size,
          mime_type: params.file.type,
          category: params.category,
          subject_area: params.subjectArea,
        })
        .select('*')
        .single();

      if (insertError || !document) {
        await supabase.storage.from('client-documents').remove([filePath]);
        throw new Error(insertError?.message || 'Failed to create document');
      }

      return document;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-documents', clientId] });
      toast({
        title: 'Dokument lastet opp!',
        description: `AI-prosessering startet for ${data.file_name}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Upload feilet',
        description: error.message,
        variant: 'destructive',
      });
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
      const { error } = await supabase.functions.invoke('pdf-text-extractor', {
        body: { documentId },
      });

      if (error) {
        throw new Error(error.message);
      }

      devLog('Text extraction triggered for document:', documentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-documents', clientId] });
      toast({
        title: 'Analyse startet',
        description: 'Tekstanalyse for dokumentet er satt i gang.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Feil ved analyse',
        description: error.message,
        variant: 'destructive',
      });
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
