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

// Add interface for text extraction response
interface TextExtractionResponse {
  success: boolean;
  documentId: string;
  textLength?: number;
  fileType?: string;
  message?: string;
  preview?: string;
  error?: string;
}

export const useClientDocuments = (clientId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  // Enhanced validation for clientId
  console.log('📄 [USE_CLIENT_DOCUMENTS] Hook called with clientId:', clientId);
  
  if (!clientId || clientId === 'undefined') {
    console.error('❌ [USE_CLIENT_DOCUMENTS] Invalid clientId provided:', clientId);
  }

  // Fetch documents
  const {
    data: documents = [],
    isLoading: documentsLoading,
    refetch
  } = useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: async () => {
      if (!clientId || clientId === 'undefined') {
        console.error('❌ [USE_CLIENT_DOCUMENTS] Cannot fetch documents without valid clientId');
        return [];
      }
      
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

      console.log('✅ Documents fetched:', data?.length || 0);
      return data as ClientDocument[];
    },
    enabled: !!(clientId && clientId !== 'undefined'),
    refetchInterval: (query) => {
      // Refetch every 5 seconds if there are documents being processed
      const data = query.state.data as ClientDocument[] | undefined;
      const hasProcessing = data?.some(doc => 
        doc.text_extraction_status === 'processing' || doc.text_extraction_status === 'pending'
      );
      return hasProcessing ? 5000 : false;
    }
  });

  // Enhanced text extraction mutation using the new edge function
  const textExtractionMutation = useMutation<TextExtractionResponse, Error, { documentId: string; retryCount?: number }>({
    mutationFn: async ({ documentId, retryCount = 0 }) => {
      console.log(`🔄 [ENHANCED_TEXT_EXTRACTION] Starting for document:`, documentId);
      console.log(`🔄 [ENHANCED_TEXT_EXTRACTION] Attempt ${retryCount + 1}/3`);
      
      try {
        // Validate inputs
        if (!documentId) {
          throw new Error('DocumentId er påkrevd men mangler');
        }

        if (!clientId || clientId === 'undefined') {
          throw new Error('ClientId er påkrevd men mangler');
        }

        console.log('✅ [ENHANCED_TEXT_EXTRACTION] Input validation passed');

        // Update status to processing first
        console.log('🔄 [ENHANCED_TEXT_EXTRACTION] Updating document status...');
        const { error: updateError } = await supabase
          .from('client_documents_files')
          .update({ 
            text_extraction_status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);

        if (updateError) {
          console.error('❌ [ENHANCED_TEXT_EXTRACTION] Status update failed:', updateError);
          throw new Error(`Status update feilet: ${updateError.message}`);
        }

        console.log('✅ [ENHANCED_TEXT_EXTRACTION] Status updated to processing');

        // Call the enhanced edge function
        console.log('🚀 [ENHANCED_TEXT_EXTRACTION] Calling enhanced edge function...');
        
        const functionResponse = await supabase.functions.invoke('enhanced-pdf-text-extractor', {
          body: { documentId },
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('📄 [ENHANCED_TEXT_EXTRACTION] Function response:', functionResponse);
        
        if (functionResponse.error) {
          console.error('❌ [ENHANCED_TEXT_EXTRACTION] Function error:', functionResponse.error);
          throw new Error(`Edge function feil: ${functionResponse.error.message || functionResponse.error}`);
        }

        if (!functionResponse.data) {
          console.error('❌ [ENHANCED_TEXT_EXTRACTION] No data in response');
          throw new Error('Ingen data returnert fra tekstekstraksjon');
        }

        const { data } = functionResponse;
        console.log('📊 [ENHANCED_TEXT_EXTRACTION] Function data:', data);

        if (!data.success) {
          console.error('❌ [ENHANCED_TEXT_EXTRACTION] Function indicates failure:', data);
          throw new Error(data.error || 'Tekstekstraksjon indikerte feil');
        }

        console.log('✅ [ENHANCED_TEXT_EXTRACTION] Extraction successful');
        return data as TextExtractionResponse;

      } catch (error) {
        console.error('❌ [ENHANCED_TEXT_EXTRACTION] Error:', error);
        
        // Enhanced retry logic
        if (retryCount < 2) {
          const retryableErrors = [
            'timeout',
            'network',
            'FunctionsHttpError',
            'AbortError',
            'fetch'
          ];
          
          const isRetryable = retryableErrors.some(errorType => 
            error.message?.toLowerCase().includes(errorType.toLowerCase())
          );
          
          if (isRetryable) {
            console.log(`🔄 [ENHANCED_TEXT_EXTRACTION] Retrying in 3 seconds (attempt ${retryCount + 2}/3)...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            return textExtractionMutation.mutateAsync({ documentId, retryCount: retryCount + 1 });
          }
        }
        
        // Update status to failed
        try {
          console.log('🔄 [ENHANCED_TEXT_EXTRACTION] Updating status to failed...');
          await supabase
            .from('client_documents_files')
            .update({ 
              text_extraction_status: 'failed',
              extracted_text: `[Tekstekstraksjon feilet: ${error.message}]`,
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId);
          console.log('✅ [ENHANCED_TEXT_EXTRACTION] Status updated to failed');
        } catch (updateError) {
          console.error('❌ [ENHANCED_TEXT_EXTRACTION] Failed to update status:', updateError);
        }
        
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('🎉 [ENHANCED_TEXT_EXTRACTION] Mutation successful:', data);
      
      if (data?.textLength && data.textLength > 0) {
        toast.success(`✅ Avansert tekstekstraksjon fullført! Ekstraherte ${data.textLength} tegn.`, {
          duration: 5000,
        });
      } else {
        toast.success('✅ Dokumentbehandling fullført!', {
          duration: 5000,
        });
      }
      
      // Refetch documents to update UI
      setTimeout(() => refetch(), 1000);
    },
    onError: (error) => {
      console.error('💥 [ENHANCED_TEXT_EXTRACTION] Final error:', error);
      
      // Enhanced error messages
      let errorMessage = 'Avansert tekstekstraksjon feilet';
      let errorDescription = error.message;
      
      if (error.message?.includes('ClientId er påkrevd')) {
        errorMessage = '👤 Klient ID mangler';
        errorDescription = 'Kunde-informasjon er ikke tilgjengelig. Prøv å laste siden på nytt.';
      } else if (error.message?.includes('DocumentId er påkrevd')) {
        errorMessage = '📄 Dokument ID mangler';
        errorDescription = 'Kunne ikke identifisere dokumentet som skal prosesseres.';
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 8000,
        action: {
          label: 'Prøv igjen',
          onClick: () => {
            // User can manually retry
          }
        }
      });
      
      refetch();
    }
  });

  // Enhanced trigger function
  const triggerTextExtraction = async (documentId: string) => {
    console.log('🎯 [TRIGGER_EXTRACTION] Called with:', { documentId, clientId });
    
    if (!documentId) {
      console.error('❌ [TRIGGER_EXTRACTION] No documentId provided');
      toast.error('❌ Dokument-ID mangler');
      return;
    }
    
    if (!clientId || clientId === 'undefined') {
      console.error('❌ [TRIGGER_EXTRACTION] No valid clientId available');
      toast.error('❌ Klient-ID mangler', {
        description: 'Last siden på nytt for å løse problemet.',
        duration: 5000
      });
      return;
    }
    
    try {
      console.log('🚀 [TRIGGER_EXTRACTION] Starting enhanced extraction...');
      
      toast.info('🤖 Starter avansert tekstekstraksjon...', {
        description: 'Bruker AI for å lese og analysere dokumentet.',
        duration: 3000
      });
      
      await textExtractionMutation.mutateAsync({ documentId });
      
    } catch (error) {
      console.error('❌ [TRIGGER_EXTRACTION] Error:', error);
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

  // Upload document mutation
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

      console.log('📤 Uploading file to storage:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
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
        console.error('Database insert error:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log('✅ Document metadata saved:', data);

      // Trigger text extraction for PDFs and text files
      if (file.type === 'application/pdf' || file.type?.includes('text/')) {
        setTimeout(() => {
          triggerTextExtraction(data.id);
        }, 1000);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-documents', clientId] });
      toast.success('Dokument lastet opp');
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

  // Get signed URL for document viewing with improved error handling
  const getDocumentUrl = useCallback(async (filePath: string) => {
    try {
      console.log('📄 Getting document URL for path:', filePath);
      
      // Ensure the file path is clean (no leading slashes)
      const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
      
      const { data, error } = await supabase.storage
        .from('client-documents')
        .createSignedUrl(cleanPath, 3600); // 1 hour expiry

      if (error) {
        console.error('Error creating signed URL:', error);
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error('No signed URL returned');
      }

      console.log('✅ Successfully created signed URL');
      return data.signedUrl;
    } catch (error) {
      console.error('Error in getDocumentUrl:', error);
      toast.error('Kunne ikke generere dokument-URL');
      return null;
    }
  }, []);

  // Download document with improved error handling
  const downloadDocument = useCallback(async (filePath: string, fileName: string) => {
    try {
      console.log('📄 Downloading document:', filePath, fileName);
      
      // Clean the file path
      const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
      
      const { data, error } = await supabase.storage
        .from('client-documents')
        .download(cleanPath);

      if (error) {
        console.error('Error downloading document:', error);
        throw error;
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
      toast.success('Dokument lastet ned');
    } catch (error) {
      console.error('Error in downloadDocument:', error);
      toast.error('Kunne ikke laste ned dokumentet');
      throw error;
    }
  }, []);

  return {
    documents,
    categories,
    isLoading: documentsLoading || isLoading || textExtractionMutation.isPending,
    refetch,
    uploadDocument,
    deleteDocument,
    getDocumentUrl,
    downloadDocument,
    triggerTextExtraction
  };
};
