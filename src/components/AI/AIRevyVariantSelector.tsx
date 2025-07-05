
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  BookOpen, 
  Users, 
  HelpCircle,
  Check
} from 'lucide-react';
import { useAIRevyVariants } from '@/hooks/useAIRevyVariants';
import type { AIRevyVariantName } from '@/constants/aiRevyVariants';

interface AIRevyVariantSelectorProps {
  currentContext: string;
  onVariantChange: (variant: any) => void;
  compact?: boolean;
}

const AIRevyVariantSelector: React.FC<AIRevyVariantSelectorProps> = ({
  currentContext,
  onVariantChange,
  compact = false
}) => {
  const { variants, selectedVariant, switchVariant, isLoading } = useAIRevyVariants(currentContext);

  const getVariantIcon = (variantName: AIRevyVariantName) => {
    switch (variantName) {
      case 'methodology': return <Brain className="h-4 w-4" />;
      case 'professional': return <BookOpen className="h-4 w-4" />;
      case 'guide': return <Users className="h-4 w-4" />;
      case 'support': return <HelpCircle className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getVariantColor = (variantName: AIRevyVariantName) => {
    switch (variantName) {
      case 'methodology': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'professional': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'guide': return 'bg-green-100 text-green-800 border-green-200';
      case 'support': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return <div className="text-sm text-gray-500">Laster AI-varianter...</div>;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600">AI-Revi:</span>
        <div className="flex gap-1">
          {variants.map((variant) => (
            <Button
              key={variant.id}
              size="sm"
              variant={selectedVariant?.id === variant.id ? "default" : "outline"}
              onClick={() => {
                switchVariant(variant);
                onVariantChange(variant);
              }}
              className="h-6 px-2 text-xs"
            >
              {getVariantIcon(variant.name)}
              <span className="ml-1">{variant.display_name.replace('AI-Revi ', '')}</span>
              {selectedVariant?.id === variant.id && <Check className="h-3 w-3 ml-1" />}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-5 w-5 text-purple-600" />
            <h4 className="font-medium">Velg AI-Revi variant</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {variants.map((variant) => (
              <Button
                key={variant.id}
                variant={selectedVariant?.id === variant.id ? "default" : "outline"}
                onClick={() => {
                  switchVariant(variant);
                  onVariantChange(variant);
                }}
                className={`h-auto p-3 text-left justify-start ${
                  selectedVariant?.id === variant.id ? '' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className={`p-2 rounded-lg ${getVariantColor(variant.name)}`}>
                    {getVariantIcon(variant.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{variant.display_name}</span>
                      {selectedVariant?.id === variant.id && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 text-left">
                      {variant.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {variant.available_contexts.slice(0, 3).map((ctx) => (
                        <Badge key={ctx} variant="secondary" className="text-xs">
                          {ctx}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>

          {selectedVariant && (
            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                {getVariantIcon(selectedVariant.name)}
                <span className="font-medium text-sm text-purple-900">
                  {selectedVariant.display_name} er aktiv
                </span>
              </div>
              <p className="text-xs text-purple-700">
                {selectedVariant.description}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIRevyVariantSelector;
