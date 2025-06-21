
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isDevelopment } from '@/utils/networkHelpers';

export interface ClientDocument {
  id: string;
  client_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  category?: string;
  subject_area?: string;
  ai_suggested_category?: string;
  ai_analysis_summary?: string;
  ai_confidence_score?: number;
  extracted_text?: string;
  text_extraction_status?: string;
  ai_suggested_subject_areas?: string[];
  ai_isa_standard_references?: string[];
  ai_revision_phase_relevance?: any;
  manual_category_override?: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentCategory {
  id: string;
  category_name: string;
  subject_area: string;
  description?: string;
  expected_file_patterns: string[];
  is_standard?: boolean;
  created_at: string;
}

export const useClientDocuments = (clientId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  // Fetch documents
  const {
    data: documents = [],
    isLoading: documentsLoading,
    refetch
  } = useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      console.log('📄 Fetching documents for client:', clientId);
      
      const { data, error } = await supabase
        .from('client_documents_files')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        throw error;
      }

      // Check for documents missing text extraction
      const needsExtraction = data?.filter(d => 
        !d.extracted_text && 
        d.text_extraction_status !== 'processing' && 
        d.text_extraction_status !== 'failed'
      ) || [];
      
      if (needsExtraction.length > 0) {
        console.log(`📄 Found ${needsExtraction.length} documents needing text extraction`);
        // Trigger text extraction for these documents
        needsExtraction.forEach(doc => {
          triggerTextExtraction(doc.id, doc.file_path, doc.mime_type);
        });
      }

      return data as ClientDocument[];
    },
    enabled: !!clientId,
    refetchInterval: (query) => {
      // Refetch every 10 seconds if there are documents being processed
      const data = query.state.data as ClientDocument[] | undefined;
      const hasProcessing = data?.some(doc => 
        doc.text_extraction_status === 'processing' || 
        (!doc.extracted_text && !doc.text_extraction_status)
      );
      return hasProcessing ? 10000 : false;
    }
  });

  // Trigger text extraction for a document
  const triggerTextExtraction = async (documentId: string, filePath: string, mimeType: string) => {
    try {
      console.log('🔄 Triggering text extraction for document:', documentId);
      
      // Update status to processing
      await supabase
        .from('client_documents_files')
        .update({ text_extraction_status: 'processing' })
        .eq('id', documentId);

      // Call appropriate extraction based on file type
      if (mimeType?.includes('pdf')) {
        // Use PDF text extractor
        const { error } = await supabase.functions.invoke('pdf-text-extractor', {
          body: { documentId }
        });
        
        if (error) {
          console.error('PDF text extraction failed:', error);
          await supabase
            .from('client_documents_files')
            .update({ text_extraction_status: 'failed' })
            .eq('id', documentId);
        }
      } else if (mimeType?.includes('text/') || mimeType?.includes('application/json')) {
        // Handle text files directly
        try {
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('client-documents')
            .download(filePath);

          if (!downloadError && fileData) {
            const textContent = await fileData.text();
            await supabase
              .from('client_documents_files')
              .update({ 
                extracted_text: textContent,
                text_extraction_status: 'completed'
              })
              .eq('id', documentId);
            
            console.log('✅ Text extraction completed for:', documentId);
          }
        } catch (error) {
          console.error('Text extraction failed:', error);
          await supabase
            .from('client_documents_files')
            .update({ text_extraction_status: 'failed' })
            .eq('id', documentId);
        }
      }
      
    } catch (error) {
      console.error('Error triggering text extraction:', error);
    }
  };

  // Fetch document categories
  const { data: categories = [] } = useQuery({
    queryKey: ['document-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_categories')
        .select('*')
        .order('subject_area', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }

      return data as DocumentCategory[];
    }
  });

  // Upload document mutation with auto text extraction
  const uploadDocument = useMutation({
    mutationFn: async ({ file, clientId, category, subjectArea }: {
      file: File;
      clientId: string;
      category?: string;
      subjectArea?: string;
    }) => {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${clientId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Save file metadata to database
      const { data, error: dbError } = await supabase
        .from('client_documents_files')
        .insert({
          client_id: clientId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          category: category,
          subject_area: subjectArea,
          text_extraction_status: 'pending'
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Trigger text extraction immediately
      setTimeout(() => {
        triggerTextExtraction(data.id, filePath, file.type);
      }, 1000);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-documents', clientId] });
      toast.success('Dokument lastet opp og tekstekstraksjon startet');
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Feil ved opplasting av dokument');
    }
  });

  // Delete document mutation
  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      // First get the document to find the file path
      const { data: document, error: fetchError } = await supabase
        .from('client_documents_files')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (fetchError) {
        throw new Error(`Error fetching document: ${fetchError.message}`);
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('client-documents')
        .remove([document.file_path]);

      if (storageError) {
        console.warn('Storage deletion warning:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('client_documents_files')
        .delete()
        .eq('id', documentId);

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      return documentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-documents', clientId] });
      toast.success('Dokument slettet');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Feil ved sletting av dokument');
    }
  });

  // Get signed URL for document viewing with enhanced error handling
  const getDocumentUrl = useCallback(async (filePath: string) => {
    try {
      console.log('📄 Getting document URL for path:', filePath);
      
      const { data, error } = await supabase.storage
        .from('client-documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        console.error('Error creating signed URL:', error);
        
        // Try alternative approach for development
        if (isDevelopment()) {
          console.warn('Development environment: Trying alternative URL approach');
          try {
            const { data: publicData } = supabase.storage
              .from('client-documents')
              .getPublicUrl(filePath);
            
            if (publicData?.publicUrl) {
              console.log('Using public URL as fallback');
              return publicData.publicUrl;
            }
          } catch (fallbackError) {
            console.warn('Fallback approach also failed:', fallbackError);
          }
        }
        
        return null;
      }

      console.log('✅ Successfully created signed URL');
      return data.signedUrl;
    } catch (error) {
      console.error('Error in getDocumentUrl:', error);
      return null;
    }
  }, []);

  // Download document
  const downloadDocument = useCallback(async (filePath: string, fileName: string) => {
    try {
      console.log('📄 Downloading document:', filePath, fileName);
      
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

      console.log('✅ Document downloaded successfully');
    } catch (error) {
      console.error('Error in downloadDocument:', error);
      throw error;
    }
  }, []);

  return {
    documents,
    categories,
    isLoading: documentsLoading || isLoading,
    refetch,
    uploadDocument,
    deleteDocument,
    getDocumentUrl,
    downloadDocument,
    triggerTextExtraction
  };
};
