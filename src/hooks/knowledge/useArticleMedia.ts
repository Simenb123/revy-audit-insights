
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { toast } from 'sonner';

export const useArticleMedia = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!session?.user) {
        throw new Error('User not authenticated');
      }

      const userId = session.user.id;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('article-media')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Storage error: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from('article-media')
        .getPublicUrl(filePath);

      if (!publicUrlData) {
        throw new Error('Could not get public URL for the image.');
      }

      const { error: dbError } = await supabase
        .from('article_media')
        .insert({
          user_id: userId,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
        });

      if (dbError) {
        // Attempt to clean up storage if DB insert fails
        await supabase.storage.from('article-media').remove([filePath]);
        throw new Error(`Database error: ${dbError.message}`);
      }

      return publicUrlData.publicUrl;
    },
    onSuccess: () => {
      toast.success('Image uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['article-media'] });
    },
    onError: (error: Error) => {
      toast.error(`Image upload failed: ${error.message}`);
    },
  });

  return {
    uploadImage: uploadImageMutation.mutateAsync,
    isUploading: uploadImageMutation.isPending,
  };
};
