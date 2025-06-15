
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PDFDocument } from '@/types/pdf';

export const useRetryTextExtraction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (documentId: string) => {
      // The edge function itself should handle setting the 'failed' status on error.
      // We throw here so react-query knows it's an error.
      const { error } = await supabase.functions.invoke('pdf-text-extractor', {
        body: { documentId },
      });

      if (error) {
        throw new Error(`Failed to invoke text extractor: ${error.message}`);
      }

      return documentId;
    },
    onMutate: async (documentId: string) => {
        await queryClient.cancelQueries({ queryKey: ['pdf-documents'] });

        const previousDocuments = queryClient.getQueryData<PDFDocument[]>(['pdf-documents']);

        queryClient.setQueryData<PDFDocument[]>(['pdf-documents'], (old) =>
            old?.map((doc) =>
                doc.id === documentId
                    ? { ...doc, text_extraction_status: 'processing' }
                    : doc
            )
        );

        return { previousDocuments };
    },
    onSuccess: () => {
      toast({
        title: "Analyse startet på nytt",
        description: "Tekstanalyse for dokumentet er satt i gang.",
      });
      queryClient.invalidateQueries({ queryKey: ['pdf-documents'] });
    },
    onError: (error: Error, documentId, context) => {
        if (context?.previousDocuments) {
            queryClient.setQueryData(['pdf-documents'], context.previousDocuments);
        }
        toast({
            title: "Feil ved omstart av analyse",
            description: error.message,
            variant: "destructive",
        });
    },
  });
};
