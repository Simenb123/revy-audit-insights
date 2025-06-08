
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { KnowledgeArticle } from '@/types/knowledge';
import { 
  Edit, 
  Eye, 
  Clock, 
  FileText,
  Archive,
  Plus
} from 'lucide-react';

const MyArticles = () => {
  const { session } = useAuth();
  
  const { data: articles, isLoading } = useQuery({
    queryKey: ['my-articles', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select(`
          *,
          category:knowledge_categories(name)
        `)
        .eq('author_id', session.user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as (KnowledgeArticle & { category: { name: string } })[];
    },
    enabled: !!session?.user?.id
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Utkast</Badge>;
      case 'published':
        return <Badge variant="default">Publisert</Badge>;
      case 'archived':
        return <Badge variant="outline">Arkivert</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="w-4 h-4" />;
      case 'published':
        return <Eye className="w-4 h-4" />;
      case 'archived':
        return <Archive className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const filterArticlesByStatus = (status?: string) => {
    if (!articles) return [];
    if (!status) return articles;
    return articles.filter(article => article.status === status);
  };

  if (isLoading) {
    return <div className="space-y-4">Laster artikler...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Mine artikler</h2>
        <Button asChild>
          <Link to="/fag/ny-artikkel">
            <Plus className="w-4 h-4 mr-2" />
            Ny artikkel
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Alle ({articles?.length || 0})</TabsTrigger>
          <TabsTrigger value="draft">
            Utkast ({filterArticlesByStatus('draft').length})
          </TabsTrigger>
          <TabsTrigger value="published">
            Publisert ({filterArticlesByStatus('published').length})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Arkivert ({filterArticlesByStatus('archived').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {articles?.map((article) => (
            <ArticleCard key={article.id} article={article} getStatusBadge={getStatusBadge} getStatusIcon={getStatusIcon} />
          ))}
          {articles?.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Du har ikke skrevet noen artikler ennå.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          {filterArticlesByStatus('draft').map((article) => (
            <ArticleCard key={article.id} article={article} getStatusBadge={getStatusBadge} getStatusIcon={getStatusIcon} />
          ))}
          {filterArticlesByStatus('draft').length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Ingen utkast funnet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="published" className="space-y-4">
          {filterArticlesByStatus('published').map((article) => (
            <ArticleCard key={article.id} article={article} getStatusBadge={getStatusBadge} getStatusIcon={getStatusIcon} />
          ))}
          {filterArticlesByStatus('published').length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Ingen publiserte artikler funnet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="archived" className="space-y-4">
          {filterArticlesByStatus('archived').map((article) => (
            <ArticleCard key={article.id} article={article} getStatusBadge={getStatusBadge} getStatusIcon={getStatusIcon} />
          ))}
          {filterArticlesByStatus('archived').length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Ingen arkiverte artikler funnet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ArticleCard = ({ 
  article, 
  getStatusBadge, 
  getStatusIcon 
}: { 
  article: KnowledgeArticle & { category: { name: string } };
  getStatusBadge: (status: string) => React.ReactNode;
  getStatusIcon: (status: string) => React.ReactNode;
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {getStatusIcon(article.status)}
            <h3 className="font-medium">{article.title}</h3>
            {getStatusBadge(article.status)}
          </div>
          
          {article.summary && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {article.summary}
            </p>
          )}
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(article.updated_at).toLocaleDateString('nb-NO')}
            </span>
            <Badge variant="outline" className="text-xs">
              {article.category?.name}
            </Badge>
            {article.status === 'published' && (
              <span>{article.view_count} visninger</span>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          {article.status === 'published' && (
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/fag/artikkel/${article.slug}`}>
                <Eye className="w-4 h-4" />
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/fag/rediger/${article.id}`}>
              <Edit className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default MyArticles;
