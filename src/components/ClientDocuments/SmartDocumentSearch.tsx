
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Brain, 
  Loader2,
  CheckCircle,
  AlertTriangle,
  Calendar,
  FileText,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { 
  performSemanticSearch, 
  generateSearchSuggestions,
  SearchQuery,
  SearchResult,
  SearchSuggestion 
} from '@/services/documentSearch/semanticSearchService';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import SearchRecommendationEngine from './SearchRecommendationEngine';
import { toast } from 'sonner';
import AIRevyVariantSelector from '@/components/AI/AIRevyVariantSelector';
import { useAIRevyVariants } from '@/hooks/useAIRevyVariants';
import { generateEnhancedAIResponseWithVariant } from '@/services/revy/enhancedAiInteractionService';

interface SmartDocumentSearchProps {
  clientId: string;
}

const SmartDocumentSearch: React.FC<SmartDocumentSearchProps> = ({ clientId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<SearchQuery['filters']>({});
  const [isAISearchMode, setIsAISearchMode] = useState(false);

  const { getDocumentUrl } = useClientDocuments(clientId);
  const { selectedVariant, handleVariantChange } = useAIRevyVariants('documentation');

  useEffect(() => {
    loadSearchSuggestions();
  }, [clientId]);

  const loadSearchSuggestions = async () => {
    try {
      const suggestionData = await generateSearchSuggestions(clientId);
      setSuggestions(suggestionData);
    } catch (error) {
      console.error('Failed to load search suggestions:', error);
    }
  };

  const handleSearch = async (queryTerm?: string) => {
    const term = queryTerm || searchTerm;
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const query: SearchQuery = {
        term,
        clientId,
        filters: selectedFilters
      };

      const results = await performSemanticSearch(query);
      setSearchResults(results);

      if (results.length === 0) {
        toast.error(`Ingen resultater funnet for "${term}"`);
      } else {
        toast.success(`Fant ${results.length} relevante dokumenter`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Søket feilet - prøv igjen');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAIAssistedSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    try {
      const aiPrompt = `Hjælp meg å finne dokumenter relatert til: "${searchTerm}". 
      Basert på mine opplastede dokumenter, foreslå:
      1. Spesifikke søkefiltre 
      2. Relaterte dokumenttyper jeg bør se etter
      3. Revisjonshandlinger som er relevante
      4. ISA-standarder som gjelder`;

      const aiResponse = await generateEnhancedAIResponseWithVariant(
        aiPrompt,
        'documentation',
        [],
        { id: clientId },
        'employee',
        undefined,
        selectedVariant
      );

      // Parse AI response for actionable suggestions
      const aiSuggestions = parseAISearchSuggestions(aiResponse);
      
      // Execute the actual search with AI-suggested parameters
      const enhancedQuery: SearchQuery = {
        term: searchTerm,
        clientId,
        filters: {
          ...selectedFilters,
          ...aiSuggestions.suggestedFilters
        }
      };

      const results = await performSemanticSearch(enhancedQuery);
      setSearchResults(results);

      if (results.length === 0) {
        toast.error(`AI-søk fant ingen resultater for "${searchTerm}". ${aiSuggestions.alternativeSuggestion || ''}`);
      } else {
        toast.success(`AI-søk fant ${results.length} relevante dokumenter med forbedrede kriterier`);
      }
    } catch (error) {
      console.error('AI-assisted search error:', error);
      // Fallback to regular search
      await handleSearch();
    } finally {
      setIsSearching(false);
    }
  };

  const parseAISearchSuggestions = (aiResponse: string) => {
    // Simple parsing of AI response for suggestions
    const suggestedFilters: any = {};
    const alternativeSuggestion = '';

    // Look for confidence level suggestions
    if (aiResponse.toLowerCase().includes('lav sikkerhet') || aiResponse.toLowerCase().includes('trenger gjennomgang')) {
      suggestedFilters.confidenceLevel = 'low';
    }
    if (aiResponse.toLowerCase().includes('høy kvalitet') || aiResponse.toLowerCase().includes('validert')) {
      suggestedFilters.aiValidated = true;
    }

    // Look for category suggestions
    const categoryMatches = aiResponse.match(/kategori[:\s]+([^.]+)/i);
    if (categoryMatches) {
      suggestedFilters.category = categoryMatches[1].trim();
    }

    return { suggestedFilters, alternativeSuggestion };
  };

  const handleRecommendationSearch = (query: string) => {
    setSearchTerm(query);
    handleSearch(query);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchTerm(suggestion.query);
    handleSearch(suggestion.query);
  };

  const handleDownload = async (result: SearchResult) => {
    try {
      const url = await getDocumentUrl(result.document.file_path);
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      toast.error('Kunne ikke laste ned dokumentet');
    }
  };

  const getConfidenceIcon = (score?: number) => {
    if (!score) return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    if (score >= 0.8) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (score >= 0.6) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const formatRelevanceScore = (score: number) => {
    return `${Math.round(score * 100)}% match`;
  };

  const handleSearchClick = () => {
    if (isAISearchMode) {
      handleAIAssistedSearch();
    } else {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI-Revi Smart Søk
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Intelligente søk som forstår mening og sammenheng
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AI Variant Selector */}
          <AIRevyVariantSelector 
            currentContext="documentation"
            onVariantChange={handleVariantChange}
            compact={true}
          />

          {/* Search Input */}
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder={
                selectedVariant?.name === 'methodology' 
                  ? "Søk på ISA-standarder som 'ISA 315 risikovurdering', 'kontroller for lønn'..."
                  : selectedVariant?.name === 'professional'
                  ? "Søk på faglige emner som 'IFRS 16 leasingavtaler', 'regnskapsestimater'..."
                  : "Søk på konsepter som 'manglende bilag Q4', 'lønn desember', eller 'dokumenter som trenger gjennomgang'..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchClick()}
              className="pl-10 pr-32"
            />
            <div className="absolute right-2 top-1.5 flex gap-1">
              <Button
                onClick={() => setIsAISearchMode(!isAISearchMode)}
                size="sm"
                variant={isAISearchMode ? "default" : "outline"}
                className="h-7 text-xs"
              >
                {isAISearchMode ? 'AI' : 'Vanlig'}
              </Button>
              <Button
                onClick={handleSearchClick}
                disabled={isSearching || !searchTerm.trim()}
                className="h-7"
                size="sm"
              >
                {isSearching ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          {/* Enhanced Mode Indicator */}
          {isAISearchMode && selectedVariant && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-sm text-purple-900">
                  AI-assistert søk med {selectedVariant.display_name}
                </span>
              </div>
              <p className="text-xs text-purple-700">
                Søket vil bli forbedret med AI-forslag for filtre, relaterte dokumenter og revisjonshandlinger.
              </p>
            </div>
          )}

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedFilters.aiValidated ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilters(prev => ({ 
                ...prev, 
                aiValidated: !prev.aiValidated 
              }))}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              AI-validerte
            </Button>
            <Button
              variant={selectedFilters.confidenceLevel === 'low' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilters(prev => ({ 
                ...prev, 
                confidenceLevel: prev.confidenceLevel === 'low' ? undefined : 'low' 
              }))}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Trenger gjennomgang
            </Button>
          </div>

          {/* Smart Suggestions */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Smarte søkeforslag
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="justify-start h-auto p-3 text-left"
                >
                  <div className="flex items-start gap-2 w-full">
                    <span className="text-lg">{suggestion.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{suggestion.description}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.category}
                        </Badge>
                        {suggestion.estimatedResults > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ~{suggestion.estimatedResults} resultater
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium">
                  Søkeresultater ({searchResults.length})
                </h4>
                <Badge variant="outline" className="text-xs">
                  Rangert etter relevans
                </Badge>
              </div>
              
              <div className="space-y-3">
                {searchResults.map((result, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <h5 className="font-medium text-sm truncate">
                              {result.document.file_name}
                            </h5>
                            {getConfidenceIcon(result.document.ai_confidence_score)}
                            <Badge variant="secondary" className="text-xs ml-auto">
                              {formatRelevanceScore(result.relevanceScore)}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mb-2">
                            {result.document.category && (
                              <Badge variant="outline" className="text-xs">
                                {result.document.category}
                              </Badge>
                            )}
                            {result.document.ai_confidence_score && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  result.document.ai_confidence_score >= 0.8 
                                    ? 'bg-green-50 text-green-700' 
                                    : result.document.ai_confidence_score >= 0.6
                                    ? 'bg-yellow-50 text-yellow-700'
                                    : 'bg-red-50 text-red-700'
                                }`}
                              >
                                {Math.round(result.document.ai_confidence_score * 100)}% AI-sikkerhet
                              </Badge>
                            )}
                          </div>

                          <div className="text-xs text-gray-600 mb-2">
                            <strong>Match grunner:</strong> {result.matchReasons.join(', ')}
                          </div>

                          {result.suggestedActions && result.suggestedActions.length > 0 && (
                            <div className="text-xs">
                              <strong className="text-purple-700">AI-anbefalinger:</strong>
                              <ul className="mt-1 space-y-1">
                                {result.suggestedActions.map((action, actionIndex) => (
                                  <li key={actionIndex} className="flex items-center gap-1 text-purple-600">
                                    <span>•</span>
                                    <span>{action}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Lastet opp {new Date(result.document.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleDownload(result)}
                          size="sm"
                          variant="outline"
                          className="ml-3"
                        >
                          Åpne
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {searchTerm && searchResults.length === 0 && !isSearching && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>Ingen dokumenter matcher søket ditt</p>
              <p className="text-xs mt-1">Prøv andre søkeord eller bruk forslagene over</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <SearchRecommendationEngine 
        clientId={clientId}
        onSearchRecommendation={handleRecommendationSearch}
      />
    </div>
  );
};

export default SmartDocumentSearch;
