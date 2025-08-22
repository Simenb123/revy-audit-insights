import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Sparkles, 
  Clock, 
  FileText, 
  Scale, 
  BookOpen,
  AlertCircle,
  TrendingUp,
  Zap,
  Database
} from 'lucide-react';
import { useEnhancedLegalSearch, EnhancedSearchParams } from '@/hooks/knowledge/useEnhancedLegalSearch';
import { toast } from 'sonner';
import { generateLegalEmbeddingsForExistingContent } from '@/services/knowledge/legalEmbeddingsService';

interface EnhancedLegalSearchPanelProps {
  className?: string;
  initialQuery?: string;
}

const EnhancedLegalSearchPanel: React.FC<EnhancedLegalSearchPanelProps> = ({
  className,
  initialQuery = ''
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [includeAISummary, setIncludeAISummary] = useState(false);
  const [maxResults, setMaxResults] = useState(20);
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);

  const {
    searchResponse,
    isLoading,
    error,
    results,
    totalResults,
    aiSummary,
    performance,
    performSearch,
    clearSearch
  } = useEnhancedLegalSearch();

  // Generate embeddings for existing content
  const handleGenerateEmbeddings = async () => {
    setIsGeneratingEmbeddings(true);
    try {
      const result = await generateLegalEmbeddingsForExistingContent();
      if (result.success) {
        toast.success(`✅ Embeddings generert: ${result.processed} prosessert, ${result.errors} feil`);
      } else {
        toast.error(`❌ Feil ved generering av embeddings: ${result.message}`);
      }
    } catch (error) {
      toast.error('❌ En uventet feil oppstod ved generering av embeddings');
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  };

  // Handle search submission
  const handleSearch = () => {
    if (!query.trim()) {
      toast.error('Vennligst skriv inn et søkeord');
      return;
    }

    const searchParams: EnhancedSearchParams = {
      query: query.trim(),
      context_type: includeAISummary ? 'ai_summary' : 'general',
      max_results: maxResults
    };

    performSearch(searchParams);
  };

  // Handle enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  // Get result type icon
  const getResultIcon = (resultType: string) => {
    switch (resultType) {
      case 'document':
        return FileText;
      case 'provision':
        return Scale;
      case 'citation':
        return BookOpen;
      default:
        return FileText;
    }
  };

  // Get match type color
  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case 'semantic':
        return 'bg-blue-100 text-blue-800';
      case 'keyword':
        return 'bg-green-100 text-green-800';
      case 'combined':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format similarity score
  const formatSimilarityScore = (score: number) => {
    return Math.round(score * 100);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Avansert juridisk søk
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Søk i lover, forskrifter, ISA-standarder, dommer..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pr-12"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isLoading || !query.trim()}
              className="px-6"
            >
              {isLoading ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Søker...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Søk
                </>
              )}
            </Button>
          </div>

          {/* Search Options */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="ai-summary"
                  checked={includeAISummary}
                  onCheckedChange={setIncludeAISummary}
                />
                <Label htmlFor="ai-summary" className="text-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI-sammendrag
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Label htmlFor="max-results" className="text-sm">Maks resultater:</Label>
                <select
                  id="max-results"
                  value={maxResults}
                  onChange={(e) => setMaxResults(Number(e.target.value))}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {results.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearSearch}>
                Tøm søk
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleGenerateEmbeddings}
              disabled={isGeneratingEmbeddings}
              className="flex items-center gap-2"
            >
              {isGeneratingEmbeddings ? (
                <>
                  <Clock className="w-3 h-3 animate-spin" />
                  Genererer...
                </>
              ) : (
                <>
                  <Database className="w-3 h-3" />
                  Generer embeddings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Søkefeil:</span>
              <span>{error.message}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Summary */}
      {aiSummary && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Sparkles className="w-5 h-5" />
              AI-sammendrag
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-900 leading-relaxed">{aiSummary}</p>
          </CardContent>
        </Card>
      )}

      {/* Search Statistics */}
      {searchResponse && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{totalResults}</div>
                <div className="text-sm text-muted-foreground">Totale resultater</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{searchResponse.search_metadata?.semantic_results || 0}</div>
                <div className="text-sm text-muted-foreground">Semantiske</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{searchResponse.search_metadata?.keyword_results || 0}</div>
                <div className="text-sm text-muted-foreground">Nøkkelord</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{performance?.total_time_ms}ms</div>
                <div className="text-sm text-muted-foreground">Responstid</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Søkeresultater ({totalResults})
              </span>
              <Badge variant="outline" className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Rangert etter relevans
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {results.map((result: any, index: number) => {
                  const ResultIcon = getResultIcon(result.result_type);
                  
                  return (
                    <div key={`${result.id}-${index}`} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      {/* Result Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <ResultIcon className="w-4 h-4 text-muted-foreground" />
                          <h3 className="font-medium text-foreground">{result.title}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            className={getMatchTypeColor(result.match_type)}
                          >
                            {result.match_type}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {formatSimilarityScore(result.similarity_score)}%
                          </Badge>
                        </div>
                      </div>

                      {/* Document/Provision Info */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        {result.document_number && (
                          <span>Dok.nr: {result.document_number}</span>
                        )}
                        {result.provision_number && (
                          <span>§ {result.provision_number}</span>
                        )}
                        {result.law_identifier && (
                          <span>Lov: {result.law_identifier}</span>
                        )}
                        {result.document_type && (
                          <Badge 
                            variant="outline" 
                            style={{ 
                              borderColor: result.document_type.color,
                              color: result.document_type.color 
                            }}
                          >
                            {result.document_type.display_name}
                          </Badge>
                        )}
                      </div>

                      {/* Summary/Content */}
                      {(result.summary || result.content) && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {result.summary || result.content}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* No Results Message */}
      {!isLoading && !error && results.length === 0 && query && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Ingen resultater funnet</h3>
            <p className="text-muted-foreground">
              Prøv å justere søkeordene eller bruk mer generelle termer
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedLegalSearchPanel;