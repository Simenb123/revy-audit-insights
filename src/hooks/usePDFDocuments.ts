
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
  tags?: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
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
      return (data || []) as PDFDocument[];
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
        .from('pdf_documents' as any)
        .insert({
          user_id: user.id,
          file_name: data.file.name,
          file_path: filePath,
          file_size: data.file.size,
          title: data.title,
          description: data.description,
          category: data.category,
          isa_number: data.isaNumber,
          tags: data.tags
        } as any)
        .select('*')
        .single();

      if (insertError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage
          .from('pdf-documents')
          .remove([filePath]);
        throw new Error(`Failed to create document record: ${insertError.message}`);
      }

      return document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-documents'] });
      toast({
        title: "Dokument lastet opp!",
        description: "PDF-en er lastet opp og lagret.",
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

  // Get document URL for viewing/downloading
  const getDocumentUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('pdf-documents')
      .getPublicUrl(filePath);
    return data.publicUrl;
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
