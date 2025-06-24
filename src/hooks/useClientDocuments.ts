
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { devLog } from '@/utils/devLogger';

export const useClientDocuments = (clientId?: string) => {
  return useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: async () => {
      if (!clientId) {
        devLog('No client ID provided for document query');
        return { documentsCount: 0, categoriesCount: 0 };
      }

      devLog('Fetching client documents for client:', clientId);

      const { data: documents, error } = await supabase
        .from('client_documents_files')
        .select('category')
        .eq('client_id', clientId);

      if (error) {
        devLog('Error fetching client documents:', error);
        throw error;
      }

      const documentsCount = documents?.length || 0;
      const categories = [...new Set(documents?.map(doc => doc.category).filter(Boolean))];
      const categoriesCount = categories.length;

      devLog('Client documents result:', { documentsCount, categoriesCount });

      return {
        documentsCount,
        categoriesCount
      };
    },
    enabled: !!clientId,
  });
};
