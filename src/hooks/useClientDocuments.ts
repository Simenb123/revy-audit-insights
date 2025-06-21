
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useClientDocuments = (clientId: string) => {
  const [isLoading, setIsLoading] = useState(false);

  const getDocumentUrl = useCallback(async (filePath: string) => {
    try {
      console.log('Getting document URL for path:', filePath);
      
      // Get signed URL for the document with longer expiry
      const { data, error } = await supabase.storage
        .from('client-documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }

      console.log('Successfully created signed URL');
      return data.signedUrl;
    } catch (error) {
      console.error('Error in getDocumentUrl:', error);
      return null;
    }
  }, []);

  const downloadDocument = useCallback(async (filePath: string, fileName: string) => {
    try {
      console.log('Downloading document:', filePath, fileName);
      
      const { data, error } = await supabase.storage
        .from('client-documents')
        .download(filePath);

      if (error) {
        console.error('Error downloading document:', error);
        throw new Error('Could not download document');
      }

      // Create blob URL and trigger download
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('Document downloaded successfully');
    } catch (error) {
      console.error('Error in downloadDocument:', error);
      throw error;
    }
  }, []);

  return {
    isLoading,
    getDocumentUrl,
    downloadDocument
  };
};
