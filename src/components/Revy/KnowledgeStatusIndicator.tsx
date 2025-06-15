
import React, { useState, useEffect } from 'react';
import { Brain, Database, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { generateEmbeddingsForExistingArticles } from '@/services/revy/generateEmbeddingsService';
import { toast } from 'sonner';

const KnowledgeStatusIndicator = () => {
  const [embeddingStatus, setEmbeddingStatus] = useState<'checking' | 'missing' | 'partial' | 'ready'>('checking');
  const [articleCount, setArticleCount] = useState(0);
  const [embeddedCount, setEmbeddedCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const checkEmbeddingStatus = async () => {
    try {
      // Count total published articles
      const { count: totalCount } = await supabase
        .from('knowledge_articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      // Count articles with embeddings
      const { count: embeddedCount } = await supabase
        .from('knowledge_articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .not('embedding', 'is', null);

      setArticleCount(totalCount || 0);
      setEmbeddedCount(embeddedCount || 0);

      if (totalCount === 0) {
        setEmbeddingStatus('missing');
      } else if (embeddedCount === 0) {
        setEmbeddingStatus('missing');
      } else if (embeddedCount < totalCount) {
        setEmbeddingStatus('partial');
      } else {
        setEmbeddingStatus('ready');
      }
    } catch (error) {
      console.error('Error checking embedding status:', error);
      setEmbeddingStatus('missing');
    }
  };

  const handleGenerateEmbeddings = async () => {
    setIsGenerating(true);
    try {
      toast.info('Starter generering av embeddings for kunnskapsbasen...');
      
      const result = await generateEmbeddingsForExistingArticles();
      
      if (result.success) {
        toast.success(`Embeddings generert for ${result.processed} artikler!`);
        await checkEmbeddingStatus();
      } else {
        toast.error(`Feil ved generering: ${result.message}`);
      }
    } catch (error) {
      console.error('Error generating embeddings:', error);
      toast.error('Kunne ikke generere embeddings');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    checkEmbeddingStatus();
  }, []);

  const getStatusBadge = () => {
    switch (embeddingStatus) {
      case 'checking':
        return <Badge variant="secondary"><Database className="w-3 h-3 mr-1" />Sjekker...</Badge>;
      case 'missing':
        return <Badge variant="destructive"><Brain className="w-3 h-3 mr-1" />Ingen embeddings</Badge>;
      case 'partial':
        return <Badge variant="outline"><Zap className="w-3 h-3 mr-1" />{embeddedCount}/{articleCount} artikler</Badge>;
      case 'ready':
        return <Badge variant="default"><Brain className="w-3 h-3 mr-1" />Klar ({embeddedCount} artikler)</Badge>;
    }
  };

  if (embeddingStatus === 'ready') {
    return null; // Don't show when everything is working
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <span className="text-sm text-blue-700">
            {embeddingStatus === 'missing' && 'Kunnskapsbase trenger oppsett'}
            {embeddingStatus === 'partial' && 'Noen artikler mangler embeddings'}
          </span>
        </div>
        {(embeddingStatus === 'missing' || embeddingStatus === 'partial') && (
          <Button
            size="sm"
            onClick={handleGenerateEmbeddings}
            disabled={isGenerating}
            className="text-xs"
          >
            {isGenerating ? 'Genererer...' : 'Aktiver kunnskapsbase'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default KnowledgeStatusIndicator;
