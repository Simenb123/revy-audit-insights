import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info,
  RefreshCw,
  Zap,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useFormulaValidator, ValidationResult } from '@/hooks/useFormulaValidator';
import { useFormulaCache } from '@/hooks/useFormulaCache';

interface FormulaValidatorComponentProps {
  formula: string;
  formulaId?: string;
  allFormulas?: Array<{ id: string; formula_expression: string }>;
  allowedAccounts?: string[];
  onValidationChange?: (result: ValidationResult) => void;
  className?: string;
}

export function FormulaValidatorComponent({
  formula,
  formulaId,
  allFormulas = [],
  allowedAccounts = [],
  onValidationChange,
  className
}: FormulaValidatorComponentProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  const validator = useFormulaValidator({ 
    allowedAccounts,
    maxDepth: 10,
    enableCircularCheck: true 
  });
  
  const cache = useFormulaCache({
    maxSize: 50,
    ttl: 2 * 60 * 1000, // 2 minutes for validation cache
    enablePersistence: false // Validation results don't need persistence
  });

  const handleValidate = async () => {
    if (!formula.trim()) {
      setValidationResult(null);
      return;
    }

    setIsValidating(true);
    
    try {
      // Check cache first
      const cacheKey = cache.generateCacheKey(
        formula,
        formulaId || 'unknown',
        'validation',
        { allowedAccounts: allowedAccounts.length }
      );
      
      let result = cache.get(cacheKey);
      
      if (!result) {
        // Simulate validation delay for complex formulas
        const complexity = validator.calculateComplexity(formula);
        const delay = complexity === 'high' ? 500 : complexity === 'medium' ? 200 : 100;
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        result = validator.validate(formula, formulaId, allFormulas);
        cache.set(cacheKey, result);
      }
      
      setValidationResult(result);
      onValidationChange?.(result);
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResult({
        isValid: false,
        errors: [{
          type: 'syntax',
          message: 'Feil under validering av formel'
        }],
        warnings: [],
        usedAccounts: [],
        complexity: 'low'
      });
    } finally {
      setIsValidating(false);
    }
  };

  React.useEffect(() => {
    const timeoutId = setTimeout(handleValidate, 300); // Debounce validation
    return () => clearTimeout(timeoutId);
  }, [formula, formulaId, allowedAccounts]);

  const getStatusIcon = () => {
    if (isValidating) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (!validationResult) return <Info className="h-4 w-4" />;
    if (validationResult.isValid) return <CheckCircle className="h-4 w-4 text-green-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusColor = () => {
    if (!validationResult) return 'secondary';
    if (validationResult.isValid) return 'default';
    return 'destructive';
  };

  const getComplexityIcon = () => {
    if (!validationResult) return <Activity className="h-3 w-3" />;
    
    switch (validationResult.complexity) {
      case 'low': return <Zap className="h-3 w-3 text-green-600" />;
      case 'medium': return <Activity className="h-3 w-3 text-yellow-600" />;
      case 'high': return <TrendingUp className="h-3 w-3 text-red-600" />;
    }
  };

  const cacheStats = cache.getStats();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {getStatusIcon()}
          Formel-validering
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={getStatusColor() as any} className="flex items-center gap-1">
            {isValidating ? 'Validerer...' : validationResult?.isValid ? 'Gyldig' : 'Ugyldig'}
          </Badge>
          
          {validationResult && (
            <>
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                {getComplexityIcon()}
                {validationResult.complexity} kompleksitet
              </Badge>
              
              <Badge variant="outline" className="text-xs">
                {validationResult.usedAccounts.length} kontoer
              </Badge>
            </>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleValidate}
            disabled={isValidating}
            className="ml-auto"
          >
            <RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
            Valider på nytt
          </Button>
        </div>

        {validationResult?.errors.map((error, index) => (
          <Alert key={index} variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div><strong>{error.type.toUpperCase()}:</strong> {error.message}</div>
                {error.position !== undefined && (
                  <div className="text-sm">Posisjon: {error.position}</div>
                )}
                {error.suggestions && error.suggestions.length > 0 && (
                  <div className="text-sm">
                    <strong>Forslag:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {error.suggestions.map((suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        ))}

        {validationResult?.warnings.map((warning, index) => (
          <Alert key={index}>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Advarsel:</strong> {warning}
            </AlertDescription>
          </Alert>
        ))}

        {validationResult?.isValid && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Formelen er gyldig og klar til bruk.
            </AlertDescription>
          </Alert>
        )}

        {validationResult?.usedAccounts.length > 0 && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium mb-2">Kontoer i bruk:</div>
            <div className="flex flex-wrap gap-1">
              {validationResult.usedAccounts.map(account => (
                <Badge key={account} variant="outline" className="text-xs">
                  {account}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Cache Statistics */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Cache treff:</span>
            <span>{cacheStats.totalHits}</span>
          </div>
          <div className="flex justify-between">
            <span>Cache størrelse:</span>
            <span>{cacheStats.size}/{cacheStats.maxSize}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}