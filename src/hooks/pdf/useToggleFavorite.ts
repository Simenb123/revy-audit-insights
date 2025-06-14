
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PDFDocument } from '@/types/pdf';

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const documents = queryClient.getQueryData<PDFDocument[]>(['pdf-documents']);
      const document = documents?.find(d => d.id === documentId);
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
};
