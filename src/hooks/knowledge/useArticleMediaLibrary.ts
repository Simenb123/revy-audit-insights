
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArticleMedia } from '@/types/knowledge';
import { useAuth } from '@/components/Auth/AuthProvider';

export const useArticleMediaLibrary = (searchTerm: string = '') => {
  const { session } = useAuth();
  
  const fetchMedia = async () => {
    if (!session?.user) {
      throw new Error('User not authenticated');
    }

    let query = supabase
      .from('article_media')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (searchTerm) {
      // Using 'ilike' for case-insensitive search on both file_name and alt_text
      query = query.or(`file_name.ilike.%${searchTerm}%,alt_text.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch media: ${error.message}`);
    }
    
    return data as ArticleMedia[];
  };

  return useQuery<ArticleMedia[], Error>({
    queryKey: ['article-media', session?.user?.id, searchTerm],
    queryFn: fetchMedia,
    enabled: !!session?.user,
  });
};
