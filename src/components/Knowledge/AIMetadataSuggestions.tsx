import { logger } from '@/utils/logger';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Sparkles, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SuggestionResult {
  suggested_tags: string[];
  suggested_subject_areas: string[];
  suggested_category: string;
  suggested_content_type: string;
  suggested_summary: string;
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
    summary?: string;
  }) => void;
  availableCategories: Array<{ id: string; name: string }>;
  availableContentTypes: Array<{ id: string; name: string; display_name: string; color?: string }>;
  availableSubjectAreas: Array<{ id: string; name: string; display_name: string; color?: string }>;
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedContentTypeId, setSelectedContentTypeId] = useState<string>('');
  const [useSuggestedSummary, setUseSuggestedSummary] = useState(true);

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

Analyser innholdet og returner kun ren JSON uten ekstra tekst:
{
  "suggested_tags": ["tag1", "tag2", "tag3"],
  "suggested_subject_areas": ["område1", "område2"],
  "suggested_category": "kategori_navn",
  "suggested_content_type": "innholdstype_navn",
  "suggested_summary": "Et kort og konsist sammendrag av artikkelens hovedinnhold (1-2 setninger)",
  "confidence_score": 0.85,
  "reasoning": "Forklaring av valgene"
}

VIKTIG: Svar kun med gyldig JSON, ingen ekstra tekst eller formatering.`,
          context: 'knowledge',
          variant: {
            name: 'methodology-expert',
            display_name: 'Metodikk-ekspert',
            description: 'Ekspert på revisjon og fagstoff'
          }
        }
      });

      if (error) throw error;

      // Try to extract JSON from the response
      const responseText = data.response;
      logger.log('AI Response:', responseText);
      
      // Look for JSON in the response
      let jsonMatch = responseText.match(/\{[\s\S]*?\}/);
      
      if (!jsonMatch) {
        // Try to find JSON that might span multiple lines
        const jsonStart = responseText.indexOf('{');
        const jsonEnd = responseText.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          jsonMatch = [responseText.substring(jsonStart, jsonEnd + 1)];
        }
      }
      
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[0]);
          setSuggestions(result);
          setSelectedTags(result.suggested_tags || []);
          setSelectedSubjectAreas(result.suggested_subject_areas || []);
          setUseSuggestedSummary(!!result.suggested_summary);
          
          // Map category and content type names to IDs
          const categoryId = availableCategories.find(
            c => c.name.toLowerCase() === result.suggested_category.toLowerCase()
          )?.id || '';
          setSelectedCategoryId(categoryId);

          const contentTypeId = availableContentTypes.find(
            ct => ct.display_name.toLowerCase() === result.suggested_content_type.toLowerCase() ||
                  ct.name.toLowerCase() === result.suggested_content_type.toLowerCase()
          )?.id || '';
          setSelectedContentTypeId(contentTypeId);
          
          toast.success('AI-forslag generert');
        } catch (parseError) {
          logger.error('JSON Parse Error:', parseError, 'Raw JSON:', jsonMatch[0]);
          throw new Error('Kunne ikke parse AI-svar som JSON');
        }
      } else {
        logger.error('No JSON found in response:', responseText);
        throw new Error('Ingen gyldig JSON funnet i AI-svar');
      }

    } catch (error) {
      logger.error('Error generating suggestions:', error);
      toast.error('Feil ved generering av forslag: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const applySuggestions = () => {
    if (!suggestions) return;

    // Map subject area names to IDs
    const subjectAreaIds = selectedSubjectAreas
      .map(areaName => 
        availableSubjectAreas.find(
          area => area.display_name.toLowerCase() === areaName.toLowerCase() ||
                  area.name.toLowerCase() === areaName.toLowerCase()
        )?.id
      )
      .filter(Boolean) as string[];

    onApplySuggestions({
      tags: selectedTags,
      subjectAreaIds,
      categoryId: selectedCategoryId,
      contentTypeId: selectedContentTypeId,
      summary: useSuggestedSummary ? suggestions.suggested_summary : undefined
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

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Kategori:
                  </Label>
                  <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Velg kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Innholdstype:
                  </Label>
                  <Select value={selectedContentTypeId} onValueChange={setSelectedContentTypeId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Velg innholdstype" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableContentTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded" 
                              style={{ backgroundColor: type.color || '#3B82F6' }}
                            />
                            {type.display_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {suggestions.suggested_summary && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Foreslått sammendrag:
                    </Label>
                    <Badge
                      variant={useSuggestedSummary ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => setUseSuggestedSummary(!useSuggestedSummary)}
                    >
                      {useSuggestedSummary ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Bruk
                        </>
                      ) : (
                        <>
                          <X className="h-3 w-3 mr-1" />
                          Ikke bruk
                        </>
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm bg-background p-2 rounded border">
                    {suggestions.suggested_summary}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Foreslåtte tags:
                </Label>
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
                <Label className="text-sm font-medium text-muted-foreground">
                  Foreslåtte emneområder:
                </Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {availableSubjectAreas.map((area) => (
                    <div key={area.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`suggest-area-${area.id}`}
                        checked={selectedSubjectAreas.some(selectedArea => 
                          area.display_name.toLowerCase() === selectedArea.toLowerCase() ||
                          area.name.toLowerCase() === selectedArea.toLowerCase()
                        )}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSubjectAreas(prev => [...prev, area.display_name]);
                          } else {
                            setSelectedSubjectAreas(prev => 
                              prev.filter(selectedArea => 
                                area.display_name.toLowerCase() !== selectedArea.toLowerCase() &&
                                area.name.toLowerCase() !== selectedArea.toLowerCase()
                              )
                            );
                          }
                        }}
                      />
                      <Label
                        htmlFor={`suggest-area-${area.id}`}
                        className="text-sm font-normal cursor-pointer flex items-center gap-2"
                      >
                        <div 
                          className="w-3 h-3 rounded" 
                          style={{ backgroundColor: area.color || '#10B981' }}
                        />
                        {area.display_name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {suggestions.reasoning && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    AI-begrunnelse:
                  </Label>
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
