
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PDFConversion {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  title: string;
  category_id: string;
  conversion_type: 'full' | 'summary' | 'checklist';
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  extracted_text?: string;
  structured_content?: any;
  error_message?: string;
  estimated_time?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  category?: { name: string };
}

export const usePDFConversions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all conversions for the current user
  const conversionsQuery = useQuery({
    queryKey: ['pdf-conversions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pdf_conversions')
        .select(`
          *,
          category:knowledge_categories(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PDFConversion[];
    },
    refetchInterval: (data) => {
      // Refetch every 2 seconds if there are processing jobs
      const hasProcessing = data?.some(job => 
        job.status === 'uploading' || job.status === 'processing'
      );
      return hasProcessing ? 2000 : false;
    }
  });

  // Create a new conversion
  const createConversion = useMutation({
    mutationFn: async (data: {
      filePath: string;
      fileName: string;
      fileSize: number;
      title: string;
      categoryId: string;
      conversionType: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: conversion, error } = await supabase
        .from('pdf_conversions')
        .insert({
          user_id: user.id,
          file_name: data.fileName,
          file_path: data.filePath,
          file_size: data.fileSize,
          title: data.title,
          category_id: data.categoryId,
          conversion_type: data.conversionType,
          status: 'uploading'
        })
        .select('*')
        .single();

      if (error) throw error;
      return conversion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-conversions'] });
    }
  });

  // Retry a failed conversion
  const retryConversion = useMutation({
    mutationFn: async (conversionId: string) => {
      const conversion = conversionsQuery.data?.find(c => c.id === conversionId);
      if (!conversion) throw new Error('Conversion not found');

      // Reset status
      const { error: updateError } = await supabase
        .from('pdf_conversions')
        .update({ 
          status: 'processing', 
          progress: 0, 
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversionId);

      if (updateError) throw updateError;

      // Start conversion process
      const { error: functionError } = await supabase.functions.invoke('pdf-converter', {
        body: {
          conversionId,
          filePath: conversion.file_path,
          conversionType: conversion.conversion_type,
          title: conversion.title,
          categoryId: conversion.category_id
        }
      });

      if (functionError) throw functionError;
      
      return conversionId;
    },
    onSuccess: (conversionId) => {
      queryClient.invalidateQueries({ queryKey: ['pdf-conversions'] });
      toast({
        title: "Konvertering startet på nytt",
        description: "Konverteringsprosessen har startet på nytt.",
      });
    },
    onError: (error) => {
      toast({
        title: "Kunne ikke starte på nytt",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete a conversion
  const deleteConversion = useMutation({
    mutationFn: async (conversionId: string) => {
      const conversion = conversionsQuery.data?.find(c => c.id === conversionId);
      if (!conversion) throw new Error('Conversion not found');

      // Delete the conversion record
      const { error } = await supabase
        .from('pdf_conversions')
        .delete()
        .eq('id', conversionId);

      if (error) throw error;

      // Also delete the file from storage
      const { error: storageError } = await supabase.storage
        .from('pdf-documents')
        .remove([conversion.file_path]);

      if (storageError) {
        console.warn('Could not delete file from storage:', storageError);
      }

      return conversionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pdf-conversions'] });
      toast({
        title: "Konverteringsjobb slettet",
        description: "Konverteringsjobben er fjernet.",
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

  return {
    conversions: conversionsQuery.data || [],
    isLoading: conversionsQuery.isLoading,
    error: conversionsQuery.error,
    createConversion,
    retryConversion,
    deleteConversion,
    refetch: conversionsQuery.refetch
  };
};
