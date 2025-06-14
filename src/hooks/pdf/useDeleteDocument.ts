
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PDFDocument } from '@/types/pdf';

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const documents = queryClient.getQueryData<PDFDocument[]>(['pdf-documents']);
      const document = documents?.find(d => d.id === documentId);
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
};
