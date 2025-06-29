import { logger } from '@/utils/logger';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      file: File;
      title: string;
      description?: string;
      category: string;
      isaNumber?: string;
      nrsNumber?: string;
      tags?: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload file to storage
      const fileExt = 'pdf';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('pdf-documents')
        .upload(filePath, data.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Create document record
      const { data: document, error: insertError } = await supabase
        .from('pdf_documents')
        .insert({
          user_id: user.id,
          file_name: data.file.name,
          file_path: filePath,
          file_size: data.file.size,
          title: data.title,
          description: data.description,
          category: data.category,
          isa_number: data.isaNumber,
          nrs_number: data.nrsNumber,
          tags: data.tags
        })
        .select('*')
        .single();

      if (insertError) {
        await supabase.storage.from('pdf-documents').remove([filePath]);
        throw new Error(`Failed to create document record: ${insertError.message}`);
      }

      if (!document) {
        await supabase.storage.from('pdf-documents').remove([filePath]);
        throw new Error('Failed to create document record: Document data could not be retrieved after insert.');
      }

      // Trigger the background text extraction function
      supabase.functions.invoke('pdf-text-extractor', {
        body: { documentId: document.id },
      }).catch(err => {
        logger.error("Failed to invoke text extractor function:", err);
      });

      return document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-documents'] });
      toast({
        title: "Dokument lastet opp!",
        description: "PDF-en er lagret og tekstanalyse har startet.",
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
};
