
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { KnowledgeArticle } from '@/types/knowledge';
import { Eye, Clock, Edit, Star, StarOff } from 'lucide-react';

const ArticleView = () => {
  const { slug } = useParams<{ slug: string }>();
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const { data: article, isLoading } = useQuery({
    queryKey: ['knowledge-article', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select(`
          *,
          category:knowledge_categories(name, parent_category_id)
        `)
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      
      // Increment view count
      await supabase
        .from('knowledge_articles')
        .update({ view_count: data.view_count + 1 })
        .eq('id', data.id);
      
      return data as KnowledgeArticle & { category: { name: string; parent_category_id?: string } };
    }
  });

  const { data: isFavorite } = useQuery({
    queryKey: ['knowledge-favorite', article?.id],
    queryFn: async () => {
      if (!article?.id || !session?.user?.id) return false;
      
      const { data } = await supabase
        .from('knowledge_favorites')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('article_id', article.id)
        .single();
      
      return !!data;
    },
    enabled: !!article?.id && !!session?.user?.id
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!article?.id || !session?.user?.id) return;
      
      if (isFavorite) {
        await supabase
          .from('knowledge_favorites')
          .delete()
          .eq('user_id', session.user.id)
          .eq('article_id', article.id);
      } else {
        await supabase
          .from('knowledge_favorites')
          .insert({
            user_id: session.user.id,
            article_id: article.id
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-favorite', article?.id] });
    }
  });

  // Improved function to format text content by converting newlines to HTML
  const formatTextContent = (content: string) => {
    // Check if content already contains HTML tags
    const hasHtmlTags = /<[^>]*>/g.test(content);
    
    if (hasHtmlTags) {
      // If it already has HTML, return as is
      return content;
    }
    
    // Split content by double newlines to create paragraphs
    const paragraphs = content.split(/\n\n+/);
    
    // Process each paragraph
    const formattedParagraphs = paragraphs
      .filter(p => p.trim()) // Remove empty paragraphs
      .map(paragraph => {
        // Convert single newlines within paragraphs to line breaks
        const withLineBreaks = paragraph.replace(/\n/g, '<br>');
        return `<p class="mb-4">${withLineBreaks}</p>`;
      });
    
    return formattedParagraphs.join('');
  };

  if (isLoading) return <div>Loading...</div>;
  if (!article) return <div>Article not found</div>;

  const canEdit = session?.user?.id === article.author_id;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/fag">Fagområder</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/fag/kategori/${article.category_id}`}>
                {article.category?.name}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{article.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Article Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
          {article.summary && (
            <p className="text-lg text-muted-foreground mb-4">{article.summary}</p>
          )}
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {article.view_count} visninger
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {new Date(article.published_at || article.created_at).toLocaleDateString('nb-NO')}
            </span>
          </div>
          
          {article.tags && article.tags.length > 0 && (
            <div className="flex gap-2 mt-3">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleFavoriteMutation.mutate()}
            disabled={toggleFavoriteMutation.isPending}
          >
            {isFavorite ? (
              <StarOff className="w-4 h-4" />
            ) : (
              <Star className="w-4 h-4" />
            )}
          </Button>
          
          {canEdit && (
            <Button asChild size="sm">
              <Link to={`/fag/rediger/${article.id}`}>
                <Edit className="w-4 h-4 mr-2" />
                Rediger
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Article Content */}
      <Card>
        <CardContent className="p-6">
          <div 
            className="prose prose-gray max-w-none prose-p:mb-4 prose-p:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatTextContent(article.content) }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ArticleView;
