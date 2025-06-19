
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, CheckCircle, X, AlertCircle, TrendingUp } from 'lucide-react';

interface AISuggestion {
  category: string;
  confidence: number;
  reasoning: string;
  keywords: string[];
}

interface SmartCategoryPanelProps {
  suggestions: AISuggestion[];
  onAccept: (category: string) => void;
  onReject: (category: string) => void;
  isVisible: boolean;
}

const SmartCategoryPanel = ({ suggestions, onAccept, onReject, isVisible }: SmartCategoryPanelProps) => {
  if (!isVisible || suggestions.length === 0) return null;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="h-4 w-4" />;
    if (confidence >= 0.6) return <AlertCircle className="h-4 w-4" />;
    return <X className="h-4 w-4" />;
  };

  return (
    <Card className="border-l-4 border-l-blue-500 shadow-lg">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Bot className="h-4 w-4 text-blue-600" />
          AI-kategoriseringsforslag
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="border rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`${getConfidenceColor(suggestion.confidence)} flex items-center gap-1`}
                >
                  {getConfidenceIcon(suggestion.confidence)}
                  {suggestion.category}
                  ({Math.round(suggestion.confidence * 100)}%)
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAccept(suggestion.category)}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Godta
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReject(suggestion.category)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X className="h-3 w-3 mr-1" />
                  Avvis
                </Button>
              </div>
            </div>
            
            <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
              <strong>Begrunnelse:</strong> {suggestion.reasoning}
            </p>
            
            {suggestion.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-gray-500">Nøkkelord:</span>
                {suggestion.keywords.map((keyword, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
        
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <TrendingUp className="h-3 w-3" />
            <span>AI lærer av dine valg for bedre forslag</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartCategoryPanel;
