
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate unique filename
      const fileExt = params.file.name.split('.').pop() || 'unknown';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${params.clientId}/${fileName}`;

      devLog('Uploading file to client-documents bucket:', filePath);

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, params.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Create document record
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
          text_extraction_status: 'pending'
        })
        .select('*')
        .single();

      if (insertError) {
        // Remove uploaded file if database insert failed
        await supabase.storage.from('client-documents').remove([filePath]);
        throw new Error(`Failed to create document record: ${insertError.message}`);
      }

      if (!document) {
        await supabase.storage.from('client-documents').remove([filePath]);
        throw new Error('Failed to create document record');
      }

      devLog('Document uploaded successfully:', document);

      // Trigger text extraction for supported file types
      if (['application/pdf', 'text/plain'].includes(params.file.type)) {
        supabase.functions.invoke('document-text-extractor', {
          body: { documentId: document.id },
        }).catch(err => {
          devLog('Failed to invoke text extractor function:', err);
        });
      }

      return document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-documents', clientId] });
      toast({
        title: "Dokument lastet opp!",
        description: "Filen er lagret og behandling har startet.",
      });
    },
    onError: (error) => {
      devLog('Upload error:', error);
      toast({
        title: "Opplasting feilet",
        description: error.message,
        variant: "destructive"
      });
    }
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
