import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Search, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';

const KnowledgeMonitor = () => {
  const [articles, setArticles] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    withEmbeddings: 0,
    recentlyUpdated: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadKnowledgeData();
  }, []);

  const loadKnowledgeData = async () => {
    setIsLoading(true);
    try {
      // Get articles with basic stats
      const { data: articlesData, error: articlesError } = await supabase
        .from('knowledge_articles')
        .select(`
          id,
          title,
          status,
          created_at,
          updated_at,
          published_at,
          view_count,
          reference_code,
          embedding,
          tags
        `)
        .order('updated_at', { ascending: false });

      if (articlesError) throw articlesError;

      setArticles(articlesData || []);

      // Calculate stats
      const total = articlesData?.length || 0;
      const published = articlesData?.filter(a => a.status === 'published').length || 0;
      const withEmbeddings = articlesData?.filter(a => a.embedding !== null).length || 0;
      const recentlyUpdated = articlesData?.filter(a => {
        const updatedAt = new Date(a.updated_at);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return updatedAt > dayAgo;
      }).length || 0;

      setStats({ total, published, withEmbeddings, recentlyUpdated });

    } catch (error) {
      console.error('Error loading knowledge data:', error);
      toast({
        title: "Feil ved lasting",
        description: "Kunne ikke laste kunnskapsbase-data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateEmbeddings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-embeddings');
      
      if (error) throw error;

      toast({
        title: "Embeddings regenerert",
        description: `${data.processed} artikler behandlet`
      });

      loadKnowledgeData();
    } catch (error) {
      toast({
        title: "Feil ved regenerering",
        description: "Kunne ikke regenerere embeddings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testSearch = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('revy-ai-chat', {
        body: {
          message: "Hva sier ISA 315 om risikovurdering?",
          context: "risk-assessment",
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      });

      if (error) throw error;

      toast({
        title: "Test søk utført",
        description: "Sjekk konsollen for detaljer"
      });

      console.log('Test search result:', data);
    } catch (error) {
      toast({
        title: "Test feilet",
        description: "Kunne ikke utføre test søk",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Publisert</Badge>;
      case 'draft':
        return <Badge variant="secondary">Utkast</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEmbeddingStatus = (hasEmbedding: boolean) => {
    return hasEmbedding ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-yellow-500" />
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Totalt artikler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Publiserte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Med embeddings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.withEmbeddings}</div>
            <div className="text-xs text-muted-foreground">
              {stats.published > 0 && `${Math.round((stats.withEmbeddings / stats.published) * 100)}% av publiserte`}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Nylig oppdatert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.recentlyUpdated}</div>
          </CardContent>
        </Card>
      </div>

      {/* Embedding Status Warning */}
      {stats.published > 0 && stats.withEmbeddings < stats.published && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <h4 className="font-semibold text-amber-800">
                  {stats.published - stats.withEmbeddings} artikler mangler embeddings
                </h4>
                <p className="text-amber-700 text-sm">
                  AI-Revi kan ikke finne disse artiklene før embeddings genereres.
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={regenerateEmbeddings}
              disabled={isLoading}
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Genererer...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generer embeddings
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Kunnskapsbase Administrasjon</CardTitle>
              <CardDescription>
                Overvåk og administrer artikler i kunnskapsbasen
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={testSearch}>
                <Search className="h-4 w-4 mr-2" />
                Test søk
              </Button>
              <Button variant="outline" onClick={regenerateEmbeddings} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Regenerer embeddings
              </Button>
              <Button onClick={loadKnowledgeData} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Oppdater
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tittel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Referanse</TableHead>
                <TableHead>Embeddings</TableHead>
                <TableHead>Visninger</TableHead>
                <TableHead>Oppdatert</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article: any) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium">{article.title}</TableCell>
                  <TableCell>{getStatusBadge(article.status)}</TableCell>
                  <TableCell>
                    {article.reference_code && (
                      <Badge variant="outline">{article.reference_code}</Badge>
                    )}
                  </TableCell>
                  <TableCell>{getEmbeddingStatus(article.embedding !== null)}</TableCell>
                  <TableCell>{article.view_count || 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {new Date(article.updated_at).toLocaleDateString('no-NO')}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeMonitor;
