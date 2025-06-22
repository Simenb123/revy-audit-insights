
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SuggestionResult {
  suggested_tags: string[];
  suggested_subject_areas: string[];
  suggested_category: string;
  suggested_content_type: string;
  confidence_score: number;
  reasoning: string;
}

interface AIMetadataSuggestionsProps {
  title: string;
  content: string;
  summary?: string;
  onApplySuggestions: (suggestions: {
    tags: string[];
    subjectAreaIds: string[];
    categoryId: string;
    contentTypeId: string;
  }) => void;
  availableCategories: Array<{ id: string; name: string }>;
  availableContentTypes: Array<{ id: string; name: string; display_name: string }>;
  availableSubjectAreas: Array<{ id: string; name: string; display_name: string }>;
}

const AIMetadataSuggestions = ({
  title,
  content,
  summary,
  onApplySuggestions,
  availableCategories,
  availableContentTypes,
  availableSubjectAreas
}: AIMetadataSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<SuggestionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSubjectAreas, setSelectedSubjectAreas] = useState<string[]>([]);

  const generateSuggestions = async () => {
    if (!title && !content) {
      toast.error('Tittel eller innhold må være fylt ut for å generere forslag');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('revy-ai-chat', {
        body: {
          message: `Analyser følgende artikkel og foreslå metadata:

TITTEL: ${title}
SAMMENDRAG: ${summary || 'Ikke oppgitt'}
INNHOLD: ${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}

Tilgjengelige kategorier: ${availableCategories.map(c => c.name).join(', ')}
Tilgjengelige innholdstyper: ${availableContentTypes.map(c => c.display_name).join(', ')}
Tilgjengelige emneområder: ${availableSubjectAreas.map(s => s.display_name).join(', ')}

Analyser innholdet og returner JSON med:
{
  "suggested_tags": ["tag1", "tag2", "tag3"],
  "suggested_subject_areas": ["område1", "område2"],
  "suggested_category": "kategori_navn",
  "suggested_content_type": "innholdstype_navn",
  "confidence_score": 0.85,
  "reasoning": "Forklaring av valgene"
}

Bruk kun kategorier, innholdstyper og emneområder fra listene over.`,
          context: 'knowledge',
          variant: {
            name: 'methodology-expert',
            display_name: 'Metodikk-ekspert',
            description: 'Ekspert på revisjon og fagstoff'
          }
        }
      });

      if (error) throw error;

      // Extract JSON from AI response
      const responseText = data.response;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        setSuggestions(result);
        setSelectedTags(result.suggested_tags || []);
        setSelectedSubjectAreas(result.suggested_subject_areas || []);
      } else {
        throw new Error('Kunne ikke parse AI-svar');
      }

    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast.error('Feil ved generering av forslag: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const applySuggestions = () => {
    if (!suggestions) return;

    // Map category name to ID
    const categoryId = availableCategories.find(
      c => c.name.toLowerCase() === suggestions.suggested_category.toLowerCase()
    )?.id || '';

    // Map content type name to ID
    const contentTypeId = availableContentTypes.find(
      ct => ct.display_name.toLowerCase() === suggestions.suggested_content_type.toLowerCase() ||
            ct.name.toLowerCase() === suggestions.suggested_content_type.toLowerCase()
    )?.id || '';

    // Map subject area names to IDs
    const subjectAreaIds = suggestions.suggested_subject_areas
      .map(areaName => 
        availableSubjectAreas.find(
          area => area.display_name.toLowerCase() === areaName.toLowerCase() ||
                  area.name.toLowerCase() === areaName.toLowerCase()
        )?.id
      )
      .filter(Boolean) as string[];

    onApplySuggestions({
      tags: selectedTags,
      subjectAreaIds: selectedSubjectAreas.map(areaName => 
        availableSubjectAreas.find(
          area => area.display_name.toLowerCase() === areaName.toLowerCase()
        )?.id
      ).filter(Boolean) as string[],
      categoryId,
      contentTypeId
    });

    toast.success('Forslag anvendt på artikkelen');
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const toggleSubjectArea = (area: string) => {
    setSelectedSubjectAreas(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          AI Metadata-forslag
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={generateSuggestions}
            disabled={isLoading || (!title && !content)}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isLoading ? 'Genererer forslag...' : 'Generer AI-forslag'}
          </Button>
          
          {suggestions && (
            <Button 
              onClick={applySuggestions}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Bruk forslag
            </Button>
          )}
        </div>

        {suggestions && (
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">AI-forslag</h4>
              <Badge variant="secondary">
                Tillit: {Math.round(suggestions.confidence_score * 100)}%
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Foreslått kategori:
                </label>
                <p className="text-sm">{suggestions.suggested_category}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Foreslått innholdstype:
                </label>
                <p className="text-sm">{suggestions.suggested_content_type}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Foreslåtte tags:
                </label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {suggestions.suggested_tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                      {selectedTags.includes(tag) ? (
                        <Check className="h-3 w-3 ml-1" />
                      ) : (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Foreslåtte emneområder:
                </label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {suggestions.suggested_subject_areas.map((area) => (
                    <Badge
                      key={area}
                      variant={selectedSubjectAreas.includes(area) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleSubjectArea(area)}
                    >
                      {area}
                      {selectedSubjectAreas.includes(area) ? (
                        <Check className="h-3 w-3 ml-1" />
                      ) : (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {suggestions.reasoning && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    AI-begrunnelse:
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {suggestions.reasoning}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIMetadataSuggestions;
