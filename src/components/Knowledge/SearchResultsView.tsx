import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Scale, 
  BookOpen, 
  ExternalLink, 
  Zap,
  TrendingUp,
  Eye,
  Download
} from 'lucide-react';
import { SearchResult } from '@/hooks/knowledge/useEnhancedLegalSearch';

interface SearchResultsViewProps {
  results: SearchResult[];
  totalResults: number;
  isLoading?: boolean;
  onResultClick?: (result: SearchResult) => void;
  onExportResults?: () => void;
  className?: string;
}

const SearchResultsView: React.FC<SearchResultsViewProps> = ({
  results,
  totalResults,
  isLoading = false,
  onResultClick,
  onExportResults,
  className
}) => {
  // Get result type icon and color
  const getResultIcon = (resultType: string) => {
    switch (resultType) {
      case 'document':
        return { Icon: FileText, color: 'text-blue-600' };
      case 'provision':
        return { Icon: Scale, color: 'text-green-600' };
      case 'citation':
        return { Icon: BookOpen, color: 'text-purple-600' };
      default:
        return { Icon: FileText, color: 'text-gray-600' };
    }
  };

  // Get match type styling
  const getMatchTypeStyle = (matchType: string) => {
    switch (matchType) {
      case 'semantic':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'keyword':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'combined':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format similarity score as percentage
  const formatSimilarityScore = (score: number) => {
    return Math.round(score * 100);
  };

  // Get relevance color based on similarity score
  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Truncate text with ellipsis
  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Søker...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Ingen resultater</h3>
          <p className="text-muted-foreground">
            Ingen dokumenter matcher ditt søk
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Søkeresultater ({totalResults})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Rangert etter relevans
            </Badge>
            {onExportResults && (
              <Button variant="outline" size="sm" onClick={onExportResults}>
                <Download className="w-4 h-4 mr-2" />
                Eksporter
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {results.map((result, index) => {
              const { Icon, color } = getResultIcon(result.result_type);
              const relevanceColor = getRelevanceColor(result.similarity_score);
              
              return (
                <div 
                  key={`${result.id}-${index}`} 
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-all duration-200 cursor-pointer group"
                  onClick={() => onResultClick?.(result)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <Icon className={`w-5 h-5 ${color} mt-0.5 flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors leading-snug">
                          {result.title}
                        </h3>
                        
                        {/* Metadata row */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {result.document_number && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {result.document_number}
                            </span>
                          )}
                          {result.provision_number && (
                            <span className="flex items-center gap-1">
                              <Scale className="w-3 h-3" />
                              § {result.provision_number}
                            </span>
                          )}
                          {result.law_identifier && (
                            <span className="bg-muted px-2 py-1 rounded">
                              {result.law_identifier}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Badges and score */}
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <Badge 
                        variant="outline" 
                        className={getMatchTypeStyle(result.match_type)}
                        title={`Match type: ${result.match_type}`}
                      >
                        {result.match_type}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`${relevanceColor} border-current`}
                        title={`Relevance score: ${result.similarity_score.toFixed(3)}`}
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        {formatSimilarityScore(result.similarity_score)}%
                      </Badge>
                    </div>
                  </div>

                  {/* Document type badge */}
                  {result.document_type && (
                    <div className="mb-3">
                      <Badge 
                        variant="secondary"
                        style={{ 
                          backgroundColor: `${result.document_type.color}15`,
                          color: result.document_type.color,
                          borderColor: `${result.document_type.color}30`
                        }}
                        className="border"
                      >
                        {result.document_type.display_name}
                      </Badge>
                    </div>
                  )}

                  {/* Content preview */}
                  {(result.summary || result.content) && (
                    <div className="mb-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {truncateText(result.summary || result.content || '', 300)}
                      </p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="capitalize">{result.result_type}</span>
                      {result.authority_level && (
                        <span>Autoritet: {result.authority_level}</span>
                      )}
                      {result.updated_at && (
                        <span>Oppdatert: {new Date(result.updated_at).toLocaleDateString('nb-NO')}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Se detaljer
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Åpne
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SearchResultsView;