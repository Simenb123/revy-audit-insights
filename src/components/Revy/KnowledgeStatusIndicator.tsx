
import React, { useState, useEffect } from 'react';
import { Brain, Database, Zap, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { generateEmbeddingsForExistingArticles } from '@/services/revy/generateEmbeddingsService';
import { toast } from 'sonner';

const KnowledgeStatusIndicator = () => {
  const [embeddingStatus, setEmbeddingStatus] = useState<'checking' | 'missing' | 'partial' | 'ready' | 'error'>('checking');
  const [articleCount, setArticleCount] = useState(0);
  const [embeddedCount, setEmbeddedCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTestResult, setSearchTestResult] = useState<'pending' | 'success' | 'error'>('pending');

  const checkEmbeddingStatus = async () => {
    try {
      console.log('🔍 Checking knowledge base status...');
      
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

      console.log('📊 Knowledge base status:', { totalCount, embeddedCount });

      if (totalCount === 0) {
        setEmbeddingStatus('missing');
      } else if (embeddedCount === 0) {
        setEmbeddingStatus('missing');
      } else if (embeddedCount < totalCount) {
        setEmbeddingStatus('partial');
      } else {
        setEmbeddingStatus('ready');
        // Test knowledge search if everything looks good
        await testKnowledgeSearch();
      }
    } catch (error) {
      console.error('❌ Error checking embedding status:', error);
      setEmbeddingStatus('error');
    }
  };

  const testKnowledgeSearch = async () => {
    try {
      console.log('🧪 Testing knowledge search functionality...');
      
      const { data, error } = await supabase.functions.invoke('knowledge-search', {
        body: { query: 'ISA revisjon' }
      });

      if (error) {
        console.error('❌ Knowledge search test failed:', error);
        setSearchTestResult('error');
      } else if (data && Array.isArray(data) && data.length > 0) {
        console.log('✅ Knowledge search test successful:', data.length, 'results');
        setSearchTestResult('success');
      } else {
        console.log('⚠️ Knowledge search returned no results');
        setSearchTestResult('success'); // Still working, just no results
      }
    } catch (error) {
      console.error('❌ Knowledge search test error:', error);
      setSearchTestResult('error');
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
        return searchTestResult === 'error' ? 
          <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Søk fungerer ikke</Badge> :
          <Badge variant="default"><Brain className="w-3 h-3 mr-1" />Klar ({embeddedCount} artikler)</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Feil ved sjekking</Badge>;
    }
  };

  if (embeddingStatus === 'ready' && searchTestResult === 'success') {
    return null; // Don't show when everything is working perfectly
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <span className="text-sm text-blue-700">
            {embeddingStatus === 'missing' && 'Kunnskapsbase trenger oppsett'}
            {embeddingStatus === 'partial' && 'Noen artikler mangler embeddings'}
            {embeddingStatus === 'error' && 'Feil ved tilgang til kunnskapsbase'}
            {embeddingStatus === 'ready' && searchTestResult === 'error' && 'Søkefunksjon fungerer ikke'}
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
        {(embeddingStatus === 'error' || searchTestResult === 'error') && (
          <Button
            size="sm"
            onClick={checkEmbeddingStatus}
            className="text-xs"
            variant="outline"
          >
            Prøv igjen
          </Button>
        )}
      </div>
    </div>
  );
};

export default KnowledgeStatusIndicator;
