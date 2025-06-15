
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useFetchDocuments } from './pdf/useFetchDocuments';
import { useUploadDocument } from './pdf/useUploadDocument';
import { useToggleFavorite } from './pdf/useToggleFavorite';
import { useDeleteDocument } from './pdf/useDeleteDocument';
import { useRetryTextExtraction } from './pdf/useRetryTextExtraction';
export type { PDFDocument } from '@/types/pdf';

export const usePDFDocuments = () => {
  const { toast } = useToast();
  const { data, isLoading, error, refetch } = useFetchDocuments();
  const uploadDocument = useUploadDocument();
  const toggleFavorite = useToggleFavorite();
  const deleteDocument = useDeleteDocument();
  const retryTextExtraction = useRetryTextExtraction();

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
    documents: data || [],
    isLoading,
    error,
    uploadDocument,
    toggleFavorite,
    deleteDocument,
    getDocumentUrl,
    refetch,
    retryTextExtraction,
  };
};
