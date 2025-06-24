
import { useClientLookup } from './useClientLookup';
import { useClientDocumentsList } from './useClientDocumentsList';
import { useDocumentCategories } from './useDocumentCategories';
import { useDocumentOperations } from './useDocumentOperations';

// Re-export types for backward compatibility
export type { ClientDocument } from './useClientDocumentsList';
export type { DocumentCategory } from './useDocumentCategories';

export const useClientDocuments = (clientIdOrOrgNumber?: string) => {
  // Get client UUID from organization number or use directly if it's a UUID
  const clientLookupQuery = useClientLookup(clientIdOrOrgNumber);
  const clientId = clientLookupQuery.data?.id;

  // Get documents for the client
  const documentsQuery = useClientDocumentsList(clientId);
  
  // Get available categories
  const categoriesQuery = useDocumentCategories();
  
  // Get document operations
  const documentOperations = useDocumentOperations(clientId);

  // Helper functions and computed values
  const documents = documentsQuery.data || [];
  const categories = categoriesQuery.data || [];
  const documentsCount = documents.length;
  const categoriesCount = [...new Set(documents.map(doc => doc.category).filter(Boolean))].length;

  return {
    // Data
    documents,
    categories,
    documentsCount,
    categoriesCount,
    
    // Loading states
    isLoading: documentsQuery.isLoading || categoriesQuery.isLoading || clientLookupQuery.isLoading,
    error: documentsQuery.error || categoriesQuery.error || clientLookupQuery.error,
    
    // Operations from useDocumentOperations
    ...documentOperations,
    
    // Refetch
    refetch: documentsQuery.refetch,
  };
};
