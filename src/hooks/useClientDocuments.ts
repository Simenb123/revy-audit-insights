
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

// Enhanced interface for text extraction response
interface TextExtractionResponse {
  success: boolean;
  documentId: string;
  fileName?: string;
  textLength?: number;
  extractionMethod?: string;
  hasAiAnalysis?: boolean;
  preview?: string;
  message?: string;
  error?: string;
}

export const useClientDocuments = (clientId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  // Enhanced validation for clientId with better logging
  console.log('📄 [USE_CLIENT_DOCUMENTS] Hook initialized with clientId:', clientId);
  
  // Helper function to validate clientId - this creates a stable function
  const validateClientId = useCallback((id: string) => {
    return id && 
      typeof id === 'string' && 
      id !== 'undefined' && 
      id !== 'null' && 
      id.trim().length > 0;
  }, []);

  const isValidClientId = validateClientId(clientId);
  
  if (!isValidClientId) {
    console.error('❌ [USE_CLIENT_DOCUMENTS] Invalid clientId provided:', { 
      clientId, 
      type: typeof clientId,
      isString: typeof clientId === 'string',
      length: clientId?.length
    });
  }

  // Fetch documents with better error handling
  const {
    data: documents = [],
    isLoading: documentsLoading,
    refetch
  } = useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: async () => {
      if (!validateClientId(clientId)) {
        console.error('❌ [USE_CLIENT_DOCUMENTS] Cannot fetch documents without valid clientId:', clientId);
        return [];
      }
      
      console.log('📄 [USE_CLIENT_DOCUMENTS] Fetching documents for client:', clientId);
      
      const { data, error } = await supabase
        .from('client_documents_files')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [USE_CLIENT_DOCUMENTS] Error fetching documents:', error);
        throw error;
      }

      console.log('✅ [USE_CLIENT_DOCUMENTS] Documents fetched successfully:', {
        count: data?.length || 0,
        withExtractedText: data?.filter(d => d.extracted_text && !d.extracted_text.startsWith('[Kunne ikke')).length || 0
      });
      
      return data as ClientDocument[];
    },
    enabled: () => validateClientId(clientId),
    refetchInterval: (query) => {
      const data = query.state.data as ClientDocument[] | undefined;
      const hasProcessing = data?.some(doc => 
        doc.text_extraction_status === 'processing' || doc.text_extraction_status === 'pending'
      );
      
      if (hasProcessing) {
        console.log('🔄 [USE_CLIENT_DOCUMENTS] Documents still processing, will refetch in 3 seconds');
        return 3000;
      }
      
      return false;
    }
  });

  // Enhanced text extraction mutation with better retry logic and error handling
  const textExtractionMutation = useMutation<TextExtractionResponse, Error, { documentId: string; retryCount?: number }>({
    mutationFn: async ({ documentId, retryCount = 0 }) => {
      console.log(`🔄 [TEXT_EXTRACTION] Starting extraction for document: ${documentId} (attempt ${retryCount + 1}/3)`);
      
      try {
        if (!documentId || documentId === 'undefined') {
          throw new Error('DocumentId er påkrevd men mangler');
        }

        if (!validateClientId(clientId)) {
          throw new Error('ClientId er påkrevd men mangler eller er ugyldig');
        }

        console.log('✅ [TEXT_EXTRACTION] Input validation passed');

        // Update status to processing immediately for better UX
        console.log('🔄 [TEXT_EXTRACTION] Updating document status to processing...');
        const { error: updateError } = await supabase
          .from('client_documents_files')
          .update({ 
            text_extraction_status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);

        if (updateError) {
          console.error('❌ [TEXT_EXTRACTION] Status update failed:', updateError);
          throw new Error(`Status update feilet: ${updateError.message}`);
        }

        console.log('✅ [TEXT_EXTRACTION] Status updated, calling enhanced extraction function...');

        // Call the enhanced edge function with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
        
        try {
          const functionResponse = await supabase.functions.invoke('enhanced-pdf-text-extractor', {
            body: { documentId },
            headers: {
              'Content-Type': 'application/json'
            }
          });

          clearTimeout(timeoutId);
          
          console.log('📄 [TEXT_EXTRACTION] Function response received:', {
            hasError: !!functionResponse.error,
            hasData: !!functionResponse.data,
            errorMessage: functionResponse.error?.message
          });
          
          if (functionResponse.error) {
            console.error('❌ [TEXT_EXTRACTION] Function error:', functionResponse.error);
            throw new Error(`Edge function feil: ${functionResponse.error.message || 'Ukjent feil'}`);
          }

          if (!functionResponse.data) {
            console.error('❌ [TEXT_EXTRACTION] No data in response');
            throw new Error('Ingen data returnert fra tekstekstraksjon');
          }

          const { data } = functionResponse;
          console.log('📊 [TEXT_EXTRACTION] Function result:', {
            success: data.success,
            textLength: data.textLength,
            extractionMethod: data.extractionMethod,
            fileName: data.fileName
          });

          if (!data.success) {
            console.error('❌ [TEXT_EXTRACTION] Function indicates failure:', data.error);
            throw new Error(data.error || 'Tekstekstraksjon feilet');
          }

          console.log('✅ [TEXT_EXTRACTION] Extraction completed successfully');
          return data as TextExtractionResponse;

        } catch (fetchError) {
          clearTimeout(timeoutId);
          throw fetchError;
        }

      } catch (error) {
        console.error('❌ [TEXT_EXTRACTION] Error in attempt', retryCount + 1, ':', error.message);
        
        // Enhanced retry logic with better error classification
        if (retryCount < 2) {
          const retryableErrors = [
            'timeout',
            'network',
            'FunctionsHttpError',
            'AbortError',
            'fetch',
            'ECONNRESET',
            'ETIMEDOUT'
          ];
          
          const isRetryable = retryableErrors.some(errorType => 
            error.message?.toLowerCase().includes(errorType.toLowerCase())
          );
          
          if (isRetryable) {
            const delay = Math.pow(2, retryCount) * 2000; // Exponential backoff: 2s, 4s
            console.log(`🔄 [TEXT_EXTRACTION] Retrying in ${delay}ms (attempt ${retryCount + 2}/3)...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return textExtractionMutation.mutateAsync({ documentId, retryCount: retryCount + 1 });
          }
        }
        
        // Update status to failed with detailed error info
        try {
          console.log('🔄 [TEXT_EXTRACTION] Updating status to failed...');
          await supabase
            .from('client_documents_files')
            .update({ 
              text_extraction_status: 'failed',
              extracted_text: `[Tekstekstraksjon feilet: ${error.message}]`,
              updated_at: new Date().toISOString()
            })
            .eq('id', documentId);
          console.log('✅ [TEXT_EXTRACTION] Status updated to failed');
        } catch (updateError) {
          console.error('❌ [TEXT_EXTRACTION] Failed to update error status:', updateError);
        }
        
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('🎉 [TEXT_EXTRACTION] Mutation successful:', {
        documentId: data.documentId,
        textLength: data.textLength,
        extractionMethod: data.extractionMethod
      });
      
      if (data?.textLength && data.textLength > 0) {
        toast.success(`✅ Avansert tekstekstraksjon fullført!`, {
          description: `Ekstraherte ${data.textLength} tegn med ${data.extractionMethod || 'AI Vision'}.`,
          duration: 8000,
        });
      } else {
        toast.success('✅ Dokumentbehandling fullført!', {
          description: 'Dokumentet ble behandlet, men lite tekst ble funnet.',
          duration: 6000,
        });
      }
      
      // Refetch documents to update UI
      setTimeout(() => {
        console.log('🔄 [TEXT_EXTRACTION] Refetching documents after successful extraction');
        refetch();
      }, 1000);
    },
    onError: (error) => {
      console.error('💥 [TEXT_EXTRACTION] Final error after retries:', error);
      
      // Enhanced error messages based on error type
      let errorMessage = 'Avansert tekstekstraksjon feilet';
      let errorDescription = error.message;
      
      if (error.message?.includes('ClientId er påkrevd')) {
        errorMessage = '👤 Klient ID mangler';
        errorDescription = 'Kunde-informasjon er ikke tilgjengelig. Last siden på nytt.';
      } else if (error.message?.includes('DocumentId er påkrevd')) {
        errorMessage = '📄 Dokument ID mangler';
        errorDescription = 'Kunne ikke identifisere dokumentet som skal prosesseres.';
      } else if (error.message?.includes('OpenAI')) {
        errorMessage = '🤖 AI-tjeneste utilgjengelig';
        errorDescription = 'OpenAI API er ikke tilgjengelig. Prøv igjen senere.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = '⏱️ Prosessering tok for lang tid';
        errorDescription = 'Dokumentet er for stort eller komplekst. Prøv et mindre dokument.';
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 10000,
        action: {
          label: 'Prøv igjen',
          onClick: () => {
            console.log('🔄 [TEXT_EXTRACTION] User requested manual retry');
          }
        }
      });
      
      // Refetch to update UI state
      setTimeout(() => refetch(), 2000);
    }
  });

  // Enhanced trigger function with better validation
  const triggerTextExtraction = async (documentId: string) => {
    console.log('🎯 [TRIGGER_EXTRACTION] Called with:', { documentId, clientId });
    
    if (!documentId || documentId === 'undefined') {
      console.error('❌ [TRIGGER_EXTRACTION] No valid documentId provided');
      toast.error('❌ Dokument-ID mangler');
      return;
    }
    
    if (!validateClientId(clientId)) {
      console.error('❌ [TRIGGER_EXTRACTION] No valid clientId available');
      toast.error('❌ Klient-ID mangler eller er ugyldig', {
        description: 'Last siden på nytt for å løse problemet.',
        duration: 5000
      });
      return;
    }
    
    try {
      console.log('🚀 [TRIGGER_EXTRACTION] Starting enhanced extraction with improved AI...');
      
      toast.info('🤖 Starter avansert tekstekstraksjon...', {
        description: 'Bruker AI for å lese og analysere dokumentet grundig.',
        duration: 4000
      });
      
      await textExtractionMutation.mutateAsync({ documentId });
      
    } catch (error) {
      console.error('❌ [TRIGGER_EXTRACTION] Trigger error:', error);
    }
  };

  // Fetch document categories and subject areas from database
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

  // Upload document mutation with improved file path structure for new storage policies
  const uploadDocument = useMutation({
    mutationFn: async ({ file, clientId, category, subjectArea }: {
      file: File;
      clientId: string;
      category?: string;
      subjectArea?: string;
    }) => {
      console.log('📤 [UPLOAD] Starting file upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        clientId
      });

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Du må være logget inn for å laste opp dokumenter');
      }

      // Create file path with improved structure for new storage policies
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${clientId}/${fileName}`;

      console.log('📤 Uploading file to storage:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Save file metadata to database
      const { data, error: dbError } = await supabase
        .from('client_documents_files')
        .insert({
          client_id: clientId,
          user_id: user.id,
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
        // Clean up uploaded file
        await supabase.storage
          .from('client-documents')
          .remove([filePath]);
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log('✅ Document metadata saved:', data);

      // Automatically trigger text extraction for supported file types
      setTimeout(() => {
        console.log('🤖 Auto-triggering text extraction for uploaded document...');
        triggerTextExtraction(data.id);
      }, 1000);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-documents', clientId] });
      toast.success('✅ Dokument lastet opp!', {
        description: 'AI vil automatisk starte tekstekstraksjon.',
        duration: 5000
      });
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('❌ Feil ved opplasting', {
        description: error.message,
        duration: 8000
      });
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
