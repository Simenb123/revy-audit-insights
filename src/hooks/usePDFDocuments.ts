import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PDFDocument {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  title: string;
  description?: string;
  category: string;
  isa_number?: string;
  nrs_number?: string;
  tags?: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  extracted_text?: { page: number; content: string }[];
  text_extraction_status?: 'pending' | 'processing' | 'completed' | 'failed' | null;
}

export const usePDFDocuments = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all PDF documents for the current user
  const documentsQuery = useQuery({
    queryKey: ['pdf-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pdf_documents' as any)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return ((data || []) as unknown) as PDFDocument[];
    },
    refetchInterval: (query) => {
      const data = query.state.data as PDFDocument[] | undefined;
      const hasProcessing = data?.some(doc => 
        doc.text_extraction_status === 'processing' || doc.text_extraction_status === 'pending'
      );
      // Refetch every 5 seconds if there are processing jobs
      return hasProcessing ? 5000 : false;
    }
  });

  // Upload file and create document record
  const uploadDocument = useMutation({
    mutationFn: async (data: {
      file: File;
      title: string;
      description?: string;
      category: string;
      isaNumber?: string;
      nrsNumber?: string;
      tags?: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload file to storage
      const fileExt = 'pdf';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('pdf-documents')
        .upload(filePath, data.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Create document record
      const { data: document, error: insertError } = await supabase
        .from('pdf_documents')
        .insert({
          user_id: user.id,
          file_name: data.file.name,
          file_path: filePath,
          file_size: data.file.size,
          title: data.title,
          description: data.description,
          category: data.category,
          isa_number: data.isaNumber,
          nrs_number: data.nrsNumber,
          tags: data.tags
        })
        .select('*')
        .single();

      if (insertError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage
          .from('pdf-documents')
          .remove([filePath]);
        throw new Error(`Failed to create document record: ${insertError.message}`);
      }

      if (!document) {
        // Clean up uploaded file if database insert fails
        await supabase.storage
          .from('pdf-documents')
          .remove([filePath]);
        throw new Error('Failed to create document record: Document data could not be retrieved after insert.');
      }

      // Trigger the background text extraction function
      supabase.functions.invoke('pdf-text-extractor', {
        body: { documentId: document.id },
      }).catch(err => {
        // Log if the function invocation itself fails, but don't block the user
        console.error("Failed to invoke text extractor function:", err);
      });

      return document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-documents'] });
      toast({
        title: "Dokument lastet opp!",
        description: "PDF-en er lagret og tekstanalyse har startet.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload feilet",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Toggle favorite status
  const toggleFavorite = useMutation({
    mutationFn: async (documentId: string) => {
      const document = documentsQuery.data?.find(d => d.id === documentId);
      if (!document) throw new Error('Document not found');

      const { error } = await supabase
        .from('pdf_documents' as any)
        .update({ is_favorite: !document.is_favorite } as any)
        .eq('id', documentId);

      if (error) throw error;
      return documentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-documents'] });
    },
    onError: (error) => {
      toast({
        title: "Kunne ikke oppdatere favoritt",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete document
  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      const document = documentsQuery.data?.find(d => d.id === documentId);
      if (!document) throw new Error('Document not found');

      // Delete the document record
      const { error } = await supabase
        .from('pdf_documents' as any)
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      // Also delete the file from storage
      const { error: storageError } = await supabase.storage
        .from('pdf-documents')
        .remove([document.file_path]);

      if (storageError) {
        console.warn('Could not delete file from storage:', storageError);
      }

      return documentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-documents'] });
      toast({
        title: "Dokument slettet",
        description: "Dokumentet er fjernet.",
      });
    },
    onError: (error) => {
      toast({
        title: "Kunne ikke slette",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Get document URL for viewing/downloading - now async for signed URLs
  const getDocumentUrl = async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from('pdf-documents')
      .createSignedUrl(filePath, 60 * 15); // Signed URL valid for 15 minutes

    if (error) {
      console.error('Error creating signed URL:', error);
      toast({
        title: "Kunne ikke hente fil",
        description: "Klarte ikke å lage en sikker lenke til dokumentet.",
        variant: "destructive"
      });
      return null;
    }
    return data.signedUrl;
  };

  return {
    documents: documentsQuery.data || [],
    isLoading: documentsQuery.isLoading,
    error: documentsQuery.error,
    uploadDocument,
    toggleFavorite,
    deleteDocument,
    getDocumentUrl,
    refetch: documentsQuery.refetch
  };
};
