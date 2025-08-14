import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Lightbulb, 
  TrendingUp, 
  Calculator, 
  Zap, 
  CheckCircle,
  AlertTriangle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useFormulaSuggestions, FormulaSuggestion } from '@/hooks/useFormulaSuggestions';
import { Spinner } from '@/components/ui/spinner';

interface FormulaSuggestionsProps {
  clientId?: string;
  onSelectSuggestion?: (suggestion: FormulaSuggestion) => void;
  className?: string;
}

const categoryIcons = {
  profitability: TrendingUp,
  liquidity: Calculator,
  efficiency: Zap,
  leverage: AlertTriangle,
  growth: Sparkles,
};

const categoryLabels = {
  profitability: 'Lønnsomhet',
  liquidity: 'Likviditet', 
  efficiency: 'Effektivitet',
  leverage: 'Soliditet',
  growth: 'Vekst',
};

export function FormulaSuggestions({ 
  clientId, 
  onSelectSuggestion,
  className 
}: FormulaSuggestionsProps) {
  const [industry, setIndustry] = useState<string>();
  const [companySize, setCompanySize] = useState<'small' | 'medium' | 'large'>();
  const [analysisType, setAnalysisType] = useState<'basic' | 'comprehensive'>('basic');
  
  const { 
    suggestions, 
    generateSuggestions, 
    isGenerating, 
    error,
    clearSuggestions 
  } = useFormulaSuggestions();

  const handleGenerate = () => {
    if (!clientId) return;
    
    generateSuggestions({
      clientId,
      industry,
      companySize,
      analysisType,
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'default';
    if (confidence >= 0.6) return 'secondary';
    return 'outline';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'Høy';
    if (confidence >= 0.6) return 'Medium';
    return 'Lav';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          AI Formelforslag
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Bransje</label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger>
                <SelectValue placeholder="Velg bransje" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="retail">Detaljhandel</SelectItem>
                <SelectItem value="manufacturing">Produksjon</SelectItem>
                <SelectItem value="services">Tjenester</SelectItem>
                <SelectItem value="technology">Teknologi</SelectItem>
                <SelectItem value="healthcare">Helse</SelectItem>
                <SelectItem value="construction">Bygg/Anlegg</SelectItem>
                <SelectItem value="finance">Finans</SelectItem>
                <SelectItem value="other">Annet</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Bedriftsstørrelse</label>
            <Select value={companySize} onValueChange={(value: 'small' | 'medium' | 'large') => setCompanySize(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Velg størrelse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Liten (&lt; 50 ansatte)</SelectItem>
                <SelectItem value="medium">Medium (50-250 ansatte)</SelectItem>
                <SelectItem value="large">Stor (&gt; 250 ansatte)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Analysenivå</label>
            <Select value={analysisType} onValueChange={(value: 'basic' | 'comprehensive') => setAnalysisType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Grunnleggende (4-6 formler)</SelectItem>
                <SelectItem value="comprehensive">Omfattende (8-12 formler)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={handleGenerate}
            disabled={!clientId || isGenerating}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isGenerating ? 'Genererer...' : 'Generer forslag'}
          </Button>
          
          {suggestions.length > 0 && (
            <Button 
              variant="outline" 
              onClick={clearSuggestions}
              className="flex items-center gap-2"
            >
              Tøm forslag
            </Button>
          )}
        </div>

        {!clientId && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Velg en klient for å generere formelforslag basert på deres kontoplan.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Feil ved generering av forslag: {error.message}
            </AlertDescription>
          </Alert>
        )}

        {suggestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Forslag ({suggestions.length})</h4>
              <Badge variant="outline" className="text-xs">
                AI-generert
              </Badge>
            </div>
            
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {suggestions.map((suggestion) => {
                const CategoryIcon = categoryIcons[suggestion.category];
                return (
                  <Card key={suggestion.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <h5 className="font-medium text-sm">{suggestion.name}</h5>
                            <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getConfidenceColor(suggestion.confidence) as any} className="text-xs">
                            {getConfidenceLabel(suggestion.confidence)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {categoryLabels[suggestion.category]}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="bg-muted/30 p-2 rounded text-xs font-mono">
                        {suggestion.formula}
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <div className="mb-1"><strong>Begrunnelse:</strong> {suggestion.reasoning}</div>
                        <div><strong>Kontoer:</strong> {suggestion.accounts_needed.join(', ')}</div>
                      </div>
                      
                      {onSelectSuggestion && (
                        <Button
                          size="sm"
                          onClick={() => onSelectSuggestion(suggestion)}
                          className="w-full flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Bruk dette forslaget
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}