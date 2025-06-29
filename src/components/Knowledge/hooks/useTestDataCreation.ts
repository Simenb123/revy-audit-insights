import { logger } from '@/utils/logger';

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { testArticles } from '../data/testArticlesData';
import { getOrCreateContentType, getOrCreateCategories, generateEmbeddings } from '../utils/testDataUtils';

export const useTestDataCreation = () => {
  const [isCreating, setIsCreating] = useState(false);

  const createTestData = async () => {
    setIsCreating(true);
    try {
      logger.log('🚀 Starter opprettelse av testartikler...');

      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error('Du må være logget inn for å opprette testdata');
        return;
      }

      // Create default content type if it doesn't exist
      const contentType = await getOrCreateContentType();

      // Create categories if they don't exist
      const categories = ['Revisjonsstandarder', 'Fagartikler'];
      const categoryMap = await getOrCreateCategories(categories);

      // Create articles
      let createdCount = 0;
      let skippedCount = 0;

      for (const article of testArticles) {
        // Check if article already exists
        const { data: existing } = await supabase
          .from('knowledge_articles')
          .select('id')
          .eq('title', article.title)
          .single();

        if (existing) {
          logger.log(`⏭️ Artikkel "${article.title}" eksisterer allerede`);
          skippedCount++;
          continue;
        }

        const categoryId = categoryMap.get(article.category_name);
        
        const { error } = await supabase
          .from('knowledge_articles')
          .insert({
            title: article.title,
            slug: article.slug,
            summary: article.summary,
            content: article.content,
            reference_code: article.reference_code,
            status: article.status,
            category_id: categoryId,
            content_type_id: contentType.id,
            author_id: user.id,
            published_at: new Date().toISOString(),
            view_count: 0
          });

        if (error) {
          logger.error(`Feil ved opprettelse av "${article.title}":`, error);
          throw error;
        }

        createdCount++;
        logger.log(`✅ Opprettet artikkel: "${article.title}"`);
      }

      // Generate embeddings for the new articles
      const embeddingResult = await generateEmbeddings();
      if (!embeddingResult.success) {
        // Don't throw error here, since articles are created
        console.warn('Embeddings kunne ikke genereres, men artikler er opprettet');
      }

      toast.success(`Testdata opprettet! ${createdCount} nye artikler lagt til. ${skippedCount} artikler eksisterte allerede.`);

    } catch (error) {
      logger.error('Feil ved opprettelse av testdata:', error);
      toast.error('Kunne ikke opprette testdata: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  return {
    isCreating,
    createTestData
  };
};
