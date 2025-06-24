import React, { useState, useEffect } from 'react';
import { Brain, Database, Zap, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
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
  const [lastTestError, setLastTestError] = useState<string>('');
  const [isRetesting, setIsRetesting] = useState(false);

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
        setSearchTestResult('pending');
      } else if (embeddedCount === 0) {
        setEmbeddingStatus('missing');
        setSearchTestResult('pending');
      } else if (embeddedCount < totalCount) {
        setEmbeddingStatus('partial');
        await testKnowledgeSearch();
      } else {
        setEmbeddingStatus('ready');
        // Test knowledge search if everything looks good
        await testKnowledgeSearch();
      }
    } catch (error) {
      console.error('❌ Error checking embedding status:', error);
      setEmbeddingStatus('error');
      setSearchTestResult('error');
      setLastTestError(error.message || 'Unknown error');
    }
  };

  const testKnowledgeSearch = async () => {
    try {
      console.log('🧪 Testing knowledge search functionality...');
      setSearchTestResult('pending');
      setLastTestError('');
      
      const { data, error } = await supabase.functions.invoke('knowledge-search', {
        body: { query: 'ISA revisjon' }
      });

      if (error) {
        console.error('❌ Knowledge search test failed:', error);
        setSearchTestResult('error');
        setLastTestError(error.message || 'Edge function error');
      } else if (data && data.articles && Array.isArray(data.articles)) {
        if (data.articles.length > 0) {
          console.log('✅ Knowledge search test successful:', data.articles.length, 'results');
          setSearchTestResult('success');
        } else {
          console.log('⚠️ Knowledge search returned no results but function works');
          setSearchTestResult('success'); // Function works, just no results for this query
        }
      } else {
        console.error('❌ Unexpected response format:', data);
        setSearchTestResult('error');
        setLastTestError('Unexpected response format from search function');
      }
    } catch (error) {
      console.error('❌ Knowledge search test error:', error);
      setSearchTestResult('error');
      setLastTestError(error.message || 'Network or function error');
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

  const handleRetry = async () => {
    setIsRetesting(true);
    try {
      await checkEmbeddingStatus();
    } finally {
      setIsRetesting(false);
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
          searchTestResult === 'success' ?
          <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Klar ({embeddedCount} artikler)</Badge> :
          <Badge variant="outline"><Brain className="w-3 h-3 mr-1" />Tester søk...</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Feil ved sjekking</Badge>;
    }
  };

  const getStatusMessage = () => {
    if (embeddingStatus === 'missing') return 'Kunnskapsbase trenger oppsett';
    if (embeddingStatus === 'partial') return 'Noen artikler mangler embeddings';
    if (embeddingStatus === 'error') return 'Feil ved tilgang til kunnskapsbase';
    if (embeddingStatus === 'ready' && searchTestResult === 'error') {
      return `Søkefunksjon fungerer ikke: ${lastTestError}`;
    }
    if (embeddingStatus === 'ready' && searchTestResult === 'success') {
      return 'Kunnskapsbase er klar og fungerer!';
    }
    return '';
  };

  // Only show if there's an issue or if we're testing
  if (embeddingStatus === 'ready' && searchTestResult === 'success') {
    return null; // Don't show when everything works perfectly
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <span className="text-sm text-blue-700">
            {getStatusMessage()}
          </span>
        </div>
        <div className="flex gap-2">
          {(embeddingStatus === 'missing' || embeddingStatus === 'partial') && (
            <Button
              size="sm"
              onClick={handleGenerateEmbeddings}
              disabled={isGenerating}
              className="text-xs"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Genererer...
                </>
              ) : (
                'Aktiver kunnskapsbase'
              )}
            </Button>
          )}
          {(embeddingStatus === 'error' || searchTestResult === 'error' || embeddingStatus === 'ready') && (
            <Button
              size="sm"
              onClick={handleRetry}
              disabled={isRetesting}
              className="text-xs"
              variant="outline"
            >
              {isRetesting ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Tester...
                </>
              ) : (
                'Test på nytt'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeStatusIndicator;
