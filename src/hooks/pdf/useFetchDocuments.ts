
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PDFDocument } from '@/types/pdf';

export const useFetchDocuments = () => {
  return useQuery({
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
};
