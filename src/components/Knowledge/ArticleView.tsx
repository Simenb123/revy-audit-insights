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
import { Eye, Clock, Edit, Star, StarOff, FileText, CheckCircle2, Square, CalendarDays } from 'lucide-react';

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

  // Check if article is PDF-converted and parse structured content
  const isPdfConverted = article?.tags?.includes('pdf-konvertert');
  
  const renderStructuredContent = (content: string) => {
    try {
      const structuredData = JSON.parse(content);
      
      if (structuredData.type === 'full_article' && structuredData.sections) {
        return (
          <div className="space-y-8">
            {structuredData.sections.map((section: any, index: number) => (
              <div key={index} className="border-b border-border last:border-b-0 pb-6 last:pb-0">
                <h3 className="text-xl font-semibold mb-4 text-foreground">{section.title}</h3>
                <div className="prose prose-gray max-w-none">
                  <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {section.content}
                  </div>
                </div>
              </div>
            ))}
            {structuredData.metadata && (
              <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Metadata:</strong> {structuredData.metadata.wordCount} ord • {structuredData.metadata.sectionCount} seksjoner • {structuredData.metadata.processingType} konvertering
                </p>
              </div>
            )}
          </div>
        );
      }
      
      if (structuredData.type === 'summary') {
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Sammendrag</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">{structuredData.summary}</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Nøkkelpunkter</h3>
              <ul className="list-disc list-inside space-y-2">
                {structuredData.keyPoints?.map((point: string, index: number) => (
                  <li key={index} className="text-muted-foreground">{point}</li>
                ))}
              </ul>
            </div>
            
            {structuredData.metadata && (
              <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Sammendrag:</strong> {Math.round(structuredData.metadata.summaryRatio * 100)}% av original tekst • {structuredData.metadata.originalLength} tegn i original • {structuredData.metadata.keyPointsCount} nøkkelpunkter
                </p>
              </div>
            )}
          </div>
        );
      }
      
      if (structuredData.type === 'checklist') {
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">Sjekkliste</h3>
              <div className="space-y-3">
                {structuredData.items?.map((item: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-4 border rounded-lg bg-card">
                    <div className="mt-1 flex-shrink-0">
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Square className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground font-medium">{item.text}</p>
                      {item.reference && (
                        <p className="text-sm text-muted-foreground mt-1">Referanse: {item.reference}</p>
                      )}
                      {item.required && (
                        <Badge variant="outline" className="mt-2 text-xs">Påkrevd</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {structuredData.metadata && (
              <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Sjekkliste:</strong> {structuredData.metadata.totalItems} punkter • {structuredData.metadata.requiredItems} påkrevde • {structuredData.metadata.standardReference}
                </p>
              </div>
            )}
          </div>
        );
      }
      
      // Fallback for unknown structured data
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">Strukturert innhold av type "{structuredData.type}" støttes ikke ennå.</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-yellow-700">Vis rå data</summary>
            <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-40">
              {JSON.stringify(structuredData, null, 2)}
            </pre>
          </details>
        </div>
      );
    } catch (error) {
      // If it's not valid JSON, treat as regular text
      return formatTextContent(content);
    }
  };

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
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">{article.title}</h1>
            {isPdfConverted && (
              <Badge variant="outline" className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                PDF-konvertert
              </Badge>
            )}
          </div>
          {article.summary && (
            <p className="text-lg text-muted-foreground mb-4">{article.summary}</p>
          )}
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {article.view_count} visninger
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {new Date(article.published_at || article.created_at).toLocaleDateString('nb-NO')}
            </span>
            {article.reference_code && (
              <Badge variant="secondary">{article.reference_code}</Badge>
            )}
          </div>
          
          {(article.valid_from || article.valid_until) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <CalendarDays className="w-4 h-4" />
              <span>
                Gyldig: {article.valid_from ? new Date(article.valid_from).toLocaleDateString('nb-NO') : '...'}
                {' - '}
                {article.valid_until ? new Date(article.valid_until).toLocaleDateString('nb-NO') : '...'}
              </span>
            </div>
          )}

          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="outline">
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
          {isPdfConverted ? (
            renderStructuredContent(article.content)
          ) : (
            <div 
              className="prose prose-gray max-w-none prose-p:mb-4 prose-p:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatTextContent(article.content) }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ArticleView;
