
import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { KnowledgeCategory, KnowledgeArticle, ArticleStatus } from '@/types/knowledge';
import { Save, X } from 'lucide-react';
import { toast } from 'sonner';
import RichTextEditor from './RichTextEditor';

interface ArticleFormData {
  title: string;
  slug: string;
  summary: string;
  content: string;
  categoryId: string;
  tags: string;
  status: ArticleStatus;
  reference_code: string;
}

const ArticleEditor = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  
  const initialCategoryId = location.state?.categoryId;
  const isEditing = !!articleId;

  const { data: categories } = useQuery({
    queryKey: ['knowledge-categories-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_categories')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      return data as KnowledgeCategory[];
    }
  });

  const { data: article, isLoading: isLoadingArticle } = useQuery({
    queryKey: ['knowledge-article-edit', articleId],
    queryFn: async () => {
      if (!articleId) return null;
      
      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .eq('id', articleId)
        .single();
      
      if (error) throw error;
      return data as KnowledgeArticle;
    },
    enabled: isEditing
  });

  const form = useForm<ArticleFormData>({
    defaultValues: {
      title: '',
      slug: '',
      summary: '',
      content: '<p>Skriv artikkelinnholdet her...</p>',
      categoryId: initialCategoryId || '',
      tags: '',
      status: 'draft',
      reference_code: ''
    }
  });

  React.useEffect(() => {
    if (article && !isLoadingArticle) {
      console.log('Setting form values from article:', article);
      form.reset({
        title: article.title || '',
        slug: article.slug || '',
        summary: article.summary || '',
        content: article.content || '<p>Skriv artikkelinnholdet her...</p>',
        categoryId: article.category_id || '',
        tags: article.tags?.join(', ') || '',
        status: article.status || 'draft',
        reference_code: article.reference_code || ''
      });
    }
  }, [article, isLoadingArticle, form]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[æøå]/g, (match) => {
        const replacements: { [key: string]: string } = { 'æ': 'ae', 'ø': 'o', 'å': 'a' };
        return replacements[match] || match;
      })
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const saveMutation = useMutation({
    mutationFn: async (data: ArticleFormData) => {
      if (!session?.user?.id) throw new Error('Not authenticated');

      console.log('Saving article with data:', data);

      // Validate required fields
      if (!data.title.trim()) {
        throw new Error('Tittel er påkrevd');
      }
      if (!data.content || data.content.trim() === '<p></p>' || data.content.trim() === '<p>Skriv artikkelinnholdet her...</p>') {
        throw new Error('Artikkelinnhold er påkrevd');
      }
      if (!data.categoryId) {
        throw new Error('Kategori er påkrevd');
      }

      const articleData = {
        title: data.title.trim(),
        slug: data.slug || generateSlug(data.title),
        summary: data.summary || null,
        content: data.content,
        category_id: data.categoryId,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : null,
        status: data.status,
        author_id: session.user.id,
        published_at: data.status === 'published' ? new Date().toISOString() : null,
        reference_code: data.reference_code || null,
      };

      console.log('Article data to save:', articleData);

      if (isEditing && articleId) {
        const { data: result, error } = await supabase
          .from('knowledge_articles')
          .update(articleData)
          .eq('id', articleId)
          .select()
          .single();
        
        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('knowledge_articles')
          .insert(articleData)
          .select()
          .single();
        
        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        return result;
      }
    },
    onSuccess: (result) => {
      toast.success(isEditing ? 'Artikkel oppdatert' : 'Artikkel opprettet');
      navigate(`/fag/artikkel/${result.slug}`);
    },
    onError: (error: any) => {
      console.error('Save error:', error);
      toast.error('Feil ved lagring: ' + error.message);
    }
  });

  const onSubmit = (data: ArticleFormData) => {
    console.log('Form submitted with data:', data);
    if (!data.slug) {
      data.slug = generateSlug(data.title);
    }
    saveMutation.mutate(data);
  };

  if (isLoadingArticle) {
    return <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="h-96 bg-gray-200 rounded"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Rediger artikkel' : 'Ny artikkel'}
        </h1>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <X className="w-4 h-4 mr-2" />
          Avbryt
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Artikkeldetaljer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tittel *</Label>
                <Input
                  id="title"
                  {...form.register('title', { required: 'Tittel er påkrevd' })}
                  onBlur={(e) => {
                    if (!form.getValues('slug')) {
                      form.setValue('slug', generateSlug(e.target.value));
                    }
                  }}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug">URL-slug *</Label>
                <Input
                  id="slug"
                  {...form.register('slug', { required: 'URL-slug er påkrevd' })}
                />
                {form.formState.errors.slug && (
                  <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Sammendrag</Label>
              <Textarea
                id="summary"
                {...form.register('summary')}
                rows={3}
                placeholder="Kort beskrivelse av artikkelen..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoryId">Kategori *</Label>
                <Controller
                  name="categoryId"
                  control={form.control}
                  rules={{ required: 'Kategori er påkrevd' }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.categoryId && (
                  <p className="text-sm text-destructive">{form.formState.errors.categoryId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Utkast</SelectItem>
                        <SelectItem value="published">Publisert</SelectItem>
                        <SelectItem value="archived">Arkivert</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (kommaseparert)</Label>
                <Input
                  id="tags"
                  {...form.register('tags')}
                  placeholder="revisjon, isa-315, risikovurdering"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference_code">Referansekode</Label>
                <Input
                  id="reference_code"
                  {...form.register('reference_code')}
                  placeholder="f.eks. ISA 200.15"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Innhold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="content">Artikkelinnhold *</Label>
              <Controller
                name="content"
                control={form.control}
                rules={{ required: 'Artikkelinnhold kan ikke være tomt.' }}
                render={({ field, fieldState }) => (
                  <>
                    <RichTextEditor
                      content={field.value || '<p>Skriv artikkelinnholdet her...</p>'}
                      onChange={field.onChange}
                    />
                    {fieldState.error && (
                      <p className="text-sm font-medium text-destructive mt-1">
                        {fieldState.error.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            disabled={saveMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Lagrer...' : 'Lagre'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ArticleEditor;
