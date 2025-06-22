import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/Auth/AuthProvider";
import {
  KnowledgeCategory,
  KnowledgeArticle,
  ArticleStatus,
} from "@/types/knowledge";
import { Save, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "./RichTextEditor";
import { useContentTypes } from "@/hooks/knowledge/useContentTypes";
import { useSubjectAreas } from "@/hooks/knowledge/useSubjectAreas";
import AIMetadataSuggestions from "./AIMetadataSuggestions";
import TagSuggestions from "./TagSuggestions";

interface ArticleFormData {
  title: string;
  slug: string;
  summary: string;
  content: string;
  categoryId: string;
  contentTypeId: string;
  subjectAreaIds: string[];
  tags: string;
  status: ArticleStatus;
  reference_code: string;
}

// Simple slug generation function
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[æøå]/g, (match) => {
      const replacements: { [key: string]: string } = {
        æ: "ae",
        ø: "o",
        å: "a",
      };
      return replacements[match] || match;
    })
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

const ArticleEditor = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  const initialCategoryId = location.state?.categoryId;
  const isEditing = !!articleId;

  const { data: categories } = useQuery({
    queryKey: ["knowledge-categories-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_categories")
        .select("*")
        .order("display_order");

      if (error) throw error;
      return data as KnowledgeCategory[];
    },
  });

  // Use hooks to get content types and subject areas from database
  const { data: contentTypes = [] } = useContentTypes();
  const { data: subjectAreas = [] } = useSubjectAreas();

  const { data: article, isLoading: isLoadingArticle } = useQuery({
    queryKey: ["knowledge-article-edit", articleId],
    queryFn: async () => {
      if (!articleId) return null;

      const { data: articleData, error: articleError } = await supabase
        .from("knowledge_articles")
        .select("*")
        .eq("id", articleId)
        .single();

      if (articleError) throw articleError;

      return {
        ...articleData,
        subject_area_ids: [] // Will be populated when database is updated
      } as KnowledgeArticle & { subject_area_ids: string[] };
    },
    enabled: isEditing,
  });

  const form = useForm<ArticleFormData>({
    defaultValues: {
      title: "",
      slug: "",
      summary: "",
      content: "<p>Skriv artikkelinnholdet her...</p>",
      categoryId: initialCategoryId || "",
      contentTypeId: contentTypes.length > 0 ? contentTypes[0]?.id : "",
      subjectAreaIds: [],
      tags: "",
      status: "draft",
      reference_code: "",
    },
  });

  const [slugError, setSlugError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (article && !isLoadingArticle) {
      console.log("Setting form values from article:", article);
      // Find the content type ID based on the article's content_type_id or legacy content_type field
      let contentTypeId = contentTypes.length > 0 ? contentTypes[0]?.id : "";
      if (article.content_type_id) {
        contentTypeId = article.content_type_id;
      } else if (article.content_type) {
        // Map legacy content_type to new ID
        const foundType = contentTypes.find(ct => ct.name === article.content_type);
        contentTypeId = foundType?.id || (contentTypes.length > 0 ? contentTypes[0]?.id : "");
      }

      form.reset({
        title: article.title || "",
        slug: article.slug || "",
        summary: article.summary || "",
        content: article.content || "<p>Skriv artikkelinnholdet her...</p>",
        categoryId: article.category_id || "",
        contentTypeId: contentTypeId,
        subjectAreaIds: [],
        tags: article.tags?.join(", ") || "",
        status: article.status || "draft",
        reference_code: article.reference_code || "",
      });
    }
  }, [article, isLoadingArticle, form, contentTypes]);

  // Update form default when content types are loaded
  React.useEffect(() => {
    if (contentTypes.length > 0 && !form.getValues("contentTypeId")) {
      form.setValue("contentTypeId", contentTypes[0].id);
    }
  }, [contentTypes, form]);

  const handleApplyAISuggestions = ({ tags, subjectAreaIds, categoryId, contentTypeId }: {
    tags: string[];
    subjectAreaIds: string[];
    categoryId: string;
    contentTypeId: string;
  }) => {
    // Apply suggestions to form
    if (tags.length > 0) {
      form.setValue("tags", tags.join(", "));
    }
    if (subjectAreaIds.length > 0) {
      form.setValue("subjectAreaIds", subjectAreaIds);
    }
    if (categoryId) {
      form.setValue("categoryId", categoryId);
    }
    if (contentTypeId) {
      form.setValue("contentTypeId", contentTypeId);
    }
  };

  const checkSlugUnique = async (slug: string) => {
    if (!slug) return;
    const unique = await generateUniqueSlug(slug);
    if (unique !== slug) {
      form.setValue("slug", unique);
      setSlugError("URL-slug eksisterte, så den ble endret til en unik verdi.");
    } else {
      setSlugError(null);
    }
  };

  // Improved slug generation with uniqueness handling
  const generateUniqueSlug = async (value: string): Promise<string> => {
    // value might already be a slug or just a title
    const baseSlug = generateSlug(value);

    try {
      const { data } = await supabase
        .from("knowledge_articles")
        .select("id")
        .eq("slug", baseSlug)
        .maybeSingle();

      if (!data) {
        return baseSlug;
      }
    } catch (error) {
      console.error("Slug uniqueness check failed:", error);
      return `${baseSlug}-${Date.now().toString().slice(-6)}`;
    }

    // If base slug exists, add timestamp suffix
    return `${baseSlug}-${Date.now().toString().slice(-6)}`;
  };

  const saveMutation = useMutation({
    mutationFn: async (data: ArticleFormData) => {
      if (!session?.user?.id) throw new Error("Not authenticated");

      console.log("Saving article with data:", data);

      // Validate required fields
      if (!data.title.trim()) {
        throw new Error("Tittel er påkrevd");
      }
      if (
        !data.content ||
        data.content.trim() === "<p></p>" ||
        data.content.trim() === "<p>Skriv artikkelinnholdet her...</p>"
      ) {
        throw new Error("Artikkelinnhold er påkrevd");
      }
      if (!data.categoryId) {
        throw new Error("Kategori er påkrevd");
      }

      // Generate unique slug
      const desiredSlug = data.slug || data.title;
      const finalSlug = await generateUniqueSlug(desiredSlug);

      // Get the content type name from the selected ID
      const selectedContentType = contentTypes.find(ct => ct.id === data.contentTypeId);
      
      const articleData = {
        title: data.title.trim(),
        slug: finalSlug,
        summary: data.summary || null,
        content: data.content,
        category_id: data.categoryId,
        content_type_id: data.contentTypeId || null, // Store the ID
        content_type: selectedContentType?.name || null, // Store the legacy field as well for compatibility
        tags: data.tags
          ? data.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : null,
        status: data.status,
        author_id: session.user.id,
        published_at:
          data.status === "published" ? new Date().toISOString() : null,
        reference_code: data.reference_code || null,
      };

      console.log("Article data to save:", articleData);

      let savedArticle;
      if (isEditing && articleId) {
        const { data: result, error } = await supabase
          .from("knowledge_articles")
          .update(articleData)
          .eq("id", articleId)
          .select()
          .single();

        if (error) {
          console.error("Update error:", error);
          if (error.code === "23505" && error.message.includes("slug")) {
            setSlugError("URL-slug eksisterer allerede.");
            throw new Error("Slug conflict");
          }
          throw error;
        }
        savedArticle = result;
      } else {
        const { data: result, error } = await supabase
          .from("knowledge_articles")
          .insert(articleData)
          .select()
          .single();

        if (error) {
          console.error("Insert error:", error);
          if (error.code === "23505" && error.message.includes("slug")) {
            setSlugError("URL-slug eksisterer allerede.");
            throw new Error("Slug conflict");
          }
          throw error;
        }
        savedArticle = result;
      }

      return savedArticle;
    },
    onSuccess: (result) => {
      toast.success(isEditing ? "Artikkel oppdatert" : "Artikkel opprettet");
      console.log("Article saved successfully:", result);
      navigate(`/fag/artikkel/${result.slug}`);
    },
    onError: (error: any) => {
      console.error("Save error:", error);
      if (error.message && error.message.includes("slug")) {
        toast.error("URL-slug eksisterer allerede. Prøv et annet.");
      } else {
        toast.error("Feil ved lagring: " + error.message);
      }
    },
  });

  const onSubmit = async (data: ArticleFormData) => {
    console.log("Form submitted with data:", data);
    data.slug = await generateUniqueSlug(data.slug || data.title);
    saveMutation.mutate(data);
  };

  if (isLoadingArticle) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/fag')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbake til fagstoff
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Rediger artikkel" : "Ny artikkel"}
          </h1>
        </div>
        <Button variant="outline" onClick={() => navigate('/fag')}>
          <X className="w-4 h-4 mr-2" />
          Avbryt
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* AI Metadata Suggestions */}
        <AIMetadataSuggestions
          title={form.watch("title")}
          content={form.watch("content")}
          summary={form.watch("summary")}
          onApplySuggestions={handleApplyAISuggestions}
          availableCategories={categories || []}
          availableContentTypes={contentTypes}
          availableSubjectAreas={subjectAreas}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content area */}
          <div className="lg:col-span-2 space-y-6">
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
                      {...form.register("title", { required: "Tittel er påkrevd" })}
                      onBlur={(e) => {
                        if (!form.getValues("slug")) {
                          const base = generateSlug(e.target.value);
                          form.setValue("slug", base);
                          checkSlugUnique(base);
                        }
                      }}
                    />
                    {form.formState.errors.title && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.title.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">URL-slug *</Label>
                    <Input
                      id="slug"
                      {...form.register("slug", {
                        required: "URL-slug er påkrevd",
                      })}
                      onBlur={(e) => checkSlugUnique(e.target.value)}
                    />
                    {form.formState.errors.slug && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.slug.message}
                      </p>
                    )}
                    {slugError && (
                      <p className="text-sm text-destructive">{slugError}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary">Sammendrag</Label>
                  <Textarea
                    id="summary"
                    {...form.register("summary")}
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
                      rules={{ required: "Kategori er påkrevd" }}
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
                      <p className="text-sm text-destructive">
                        {form.formState.errors.categoryId.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contentTypeId">Innholdstype</Label>
                    <Controller
                      name="contentTypeId"
                      control={form.control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Velg innholdstype" />
                          </SelectTrigger>
                          <SelectContent>
                            {contentTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded" 
                                    style={{ backgroundColor: type.color }}
                                  />
                                  {type.display_name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                {/* Subject Areas */}
                <div className="space-y-2">
                  <Label>Emneområder</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {subjectAreas.map((area) => (
                      <Controller
                        key={area.id}
                        name="subjectAreaIds"
                        control={form.control}
                        render={({ field }) => (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`area-${area.id}`}
                              checked={field.value.includes(area.id)}
                              onCheckedChange={(checked) => {
                                const newValue = checked
                                  ? [...field.value, area.id]
                                  : field.value.filter(id => id !== area.id);
                                field.onChange(newValue);
                              }}
                            />
                            <Label
                              htmlFor={`area-${area.id}`}
                              className="text-sm font-normal cursor-pointer flex items-center gap-2"
                            >
                              <div 
                                className="w-3 h-3 rounded" 
                                style={{ backgroundColor: area.color }}
                              />
                              {area.display_name}
                            </Label>
                          </div>
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="reference_code">Referansekode</Label>
                    <Input
                      id="reference_code"
                      {...form.register("reference_code")}
                      placeholder="f.eks. ISA 200.15"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Innhold *</Label>
                  <Controller
                    name="content"
                    control={form.control}
                    rules={{ required: "Innhold er påkrevd" }}
                    render={({ field }) => (
                      <RichTextEditor
                        content={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  {form.formState.errors.content && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.content.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar with tags and suggestions */}
          <div className="space-y-6">
            <TagSuggestions
              currentTags={form.watch("tags")}
              onTagsChange={(tags) => form.setValue("tags", tags)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={saveMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Lagrer..." : "Lagre"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ArticleEditor;
