
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  ai_confidence_score?: number;
  ai_analysis_summary?: string;
  manual_category_override?: boolean;
  created_at: string;
  updated_at: string;
  extracted_text?: string;
  text_extraction_status?: string;
}

export interface DocumentCategory {
  id: string;
  subject_area: string;
  category_name: string;
  description?: string;
  expected_file_patterns: string[];
  is_standard: boolean;
  created_at: string;
}

export const useClientDocuments = (clientId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch documents for client
  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('client_documents_files')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ClientDocument[];
    },
    enabled: !!clientId
  });

  // Fetch document categories
  const { data: categories = [] } = useQuery({
    queryKey: ['document-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_categories')
        .select('*')
        .order('subject_area', { ascending: true });
      
      if (error) throw error;
      return data as DocumentCategory[];
    }
  });

  // Upload document
  const uploadDocument = useMutation({
    mutationFn: async (data: {
      file: File;
      clientId: string;
      category?: string;
      subjectArea?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload file to storage
      const fileExt = data.file.name.split('.').pop() || '';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${data.clientId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, data.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Create document record with AI categorization
      const suggestedCategory = await categorizeDocument(data.file.name, categories);
      
      const { data: document, error: insertError } = await supabase
        .from('client_documents_files')
        .insert({
          client_id: data.clientId,
          user_id: user.id,
          file_name: data.file.name,
          file_path: filePath,
          file_size: data.file.size,
          mime_type: data.file.type,
          category: data.category || suggestedCategory?.category,
          subject_area: data.subjectArea || suggestedCategory?.subjectArea,
          ai_suggested_category: suggestedCategory?.category,
          ai_confidence_score: suggestedCategory?.confidence,
          text_extraction_status: 'pending'
        })
        .select('*')
        .single();

      if (insertError) {
        await supabase.storage.from('client-documents').remove([filePath]);
        throw new Error(`Failed to create document record: ${insertError.message}`);
      }

      // Trigger text extraction for supported file types
      if (['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(data.file.type)) {
        supabase.functions.invoke('document-text-extractor', {
          body: { documentId: document.id },
        }).catch(err => {
          console.error("Failed to invoke text extractor function:", err);
        });
      }

      return document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-documents'] });
      toast({
        title: "Dokument lastet opp!",
        description: "Dokumentet er lagret og behandling har startet.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload feilet",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete document
  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      const document = documents.find(d => d.id === documentId);
      if (!document) throw new Error('Document not found');

      const { error } = await supabase
        .from('client_documents_files')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      // Also delete the file from storage
      const { error: storageError } = await supabase.storage
        .from('client-documents')
        .remove([document.file_path]);

      if (storageError) {
        console.warn('Could not delete file from storage:', storageError);
      }

      return documentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-documents'] });
      toast({
        title: "Dokument slettet",
        description: "Dokumentet er fjernet.",
      });
    },
    onError: (error) => {
      toast({
        title: "Kunne ikke slette",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Get document URL
  const getDocumentUrl = async (filePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from('client-documents')
      .createSignedUrl(filePath, 60 * 15); // 15 minutes

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
    return data.signedUrl;
  };

  return {
    documents,
    categories,
    isLoading,
    uploadDocument,
    deleteDocument,
    getDocumentUrl,
    refetch
  };
};

// Helper function to categorize documents based on filename
async function categorizeDocument(fileName: string, categories: DocumentCategory[]) {
  const lowerFileName = fileName.toLowerCase();
  
  for (const category of categories) {
    for (const pattern of category.expected_file_patterns) {
      if (lowerFileName.includes(pattern.toLowerCase())) {
        return {
          category: category.category_name,
          subjectArea: category.subject_area,
          confidence: 0.8 // High confidence for pattern match
        };
      }
    }
  }
  
  return {
    category: null,
    subjectArea: null,
    confidence: 0
  };
}
