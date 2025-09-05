import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Info, TrendingUp, Zap, Target, Brain } from 'lucide-react';
import { EnhancedAutoMappingSuggestion } from '@/modules/payroll/hooks/useEnhancedAutoMapping';

interface MappingSuggestionCardProps {
  suggestion: EnhancedAutoMappingSuggestion;
  onApprove: (suggestion: EnhancedAutoMappingSuggestion) => void;
  onReject: (suggestion: EnhancedAutoMappingSuggestion) => void;
}

const MappingSuggestionCard: React.FC<MappingSuggestionCardProps> = ({
  suggestion,
  onApprove,
  onReject
}) => {
  const getMatchTypeIcon = (matchType: EnhancedAutoMappingSuggestion['matchType']) => {
    switch (matchType) {
      case 'exact':
        return <Target className="h-4 w-4" />;
      case 'fuzzy':
        return <Zap className="h-4 w-4" />;
      case 'keyword':
        return <Info className="h-4 w-4" />;
      case 'learned':
        return <Brain className="h-4 w-4" />;
      case 'amount':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getMatchTypeColor = (matchType: EnhancedAutoMappingSuggestion['matchType']) => {
    switch (matchType) {
      case 'exact':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'fuzzy':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'keyword':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'learned':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'amount':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-success';
    if (confidence >= 0.6) return 'text-warning';
    return 'text-destructive';
  };

  const formatMatchType = (matchType: EnhancedAutoMappingSuggestion['matchType']) => {
    switch (matchType) {
      case 'exact':
        return 'Eksakt match';
      case 'fuzzy':
        return 'Uklar match';
      case 'keyword':
        return 'Nøkkelord';
      case 'learned':
        return 'Lært fra historikk';
      case 'amount':
        return 'Beløpsmønster';
      default:
        return 'Ukjent';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            {suggestion.accountNumber} - {suggestion.accountName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`${getMatchTypeColor(suggestion.matchType)} flex items-center gap-1`}
            >
              {getMatchTypeIcon(suggestion.matchType)}
              {formatMatchType(suggestion.matchType)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Foreslått kode:</p>
            <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
              {suggestion.suggestedCode}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tillit:</p>
            <p className={`text-sm font-medium ${getConfidenceColor(suggestion.confidence)}`}>
              {Math.round(suggestion.confidence * 100)}%
            </p>
          </div>
        </div>

        {suggestion.originalAmount && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Beløp:</p>
            <p className="text-sm">
              {suggestion.originalAmount.toLocaleString('nb-NO', { 
                style: 'currency', 
                currency: 'NOK' 
              })}
            </p>
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-muted-foreground">Begrunnelse:</p>
          <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
        </div>

        {suggestion.historicalData && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-2">Historiske data:</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="font-medium">Tidligere:</span> {suggestion.historicalData.previousMappings}
              </div>
              <div>
                <span className="font-medium">Godkjent:</span> {suggestion.historicalData.userApprovals}
              </div>
              <div>
                <span className="font-medium">Snitt tillit:</span> {Math.round(suggestion.historicalData.averageConfidence * 100)}%
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onApprove(suggestion)}
            size="sm"
            className="flex-1"
            variant={suggestion.confidence >= 0.8 ? 'default' : 'outline'}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Godkjenn
          </Button>
          <Button
            onClick={() => onReject(suggestion)}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Avvis
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MappingSuggestionCard;