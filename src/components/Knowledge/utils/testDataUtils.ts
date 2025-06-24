
import { supabase } from '@/integrations/supabase/client';

export const getOrCreateContentType = async () => {
  let { data: contentType, error: contentTypeError } = await supabase
    .from('content_types')
    .select('id')
    .eq('name', 'fagartikkel')
    .single();

  if (contentTypeError || !contentType) {
    const { data: newContentType, error: createError } = await supabase
      .from('content_types')
      .insert({
        name: 'fagartikkel',
        display_name: 'Fagartikkel',
        description: 'Standard fagartikkel',
        color: '#3B82F6',
        sort_order: 1,
        is_active: true
      })
      .select()
      .single();

    if (createError) {
      console.error('Feil ved opprettelse av innholdstype:', createError);
      throw createError;
    }
    contentType = newContentType;
  }

  return contentType;
};

export const getOrCreateCategories = async (categoryNames: string[]) => {
  const categoryMap = new Map();

  for (const categoryName of categoryNames) {
    const { data: existingCategory } = await supabase
      .from('knowledge_categories')
      .select('id, name')
      .eq('name', categoryName)
      .single();

    if (existingCategory) {
      categoryMap.set(categoryName, existingCategory.id);
    } else {
      const { data: newCategory, error } = await supabase
        .from('knowledge_categories')
        .insert({
          name: categoryName,
          description: `Kategori for ${categoryName}`,
          display_order: categoryName === 'Revisjonsstandarder' ? 1 : 2
        })
        .select()
        .single();

      if (error) {
        console.error('Feil ved opprettelse av kategori:', error);
        throw error;
      }
      categoryMap.set(categoryName, newCategory.id);
    }
  }

  return categoryMap;
};

export const generateEmbeddings = async () => {
  console.log('🔄 Genererer embeddings...');
  const { data: embeddingResult, error: embeddingError } = await supabase.functions.invoke('generate-embeddings', {
    body: {}
  });

  if (embeddingError) {
    console.error('Feil ved generering av embeddings:', embeddingError);
    return { success: false, error: embeddingError };
  }

  console.log('✅ Embeddings generert:', embeddingResult);
  return { success: true, data: embeddingResult };
};
