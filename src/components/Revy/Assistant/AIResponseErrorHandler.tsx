import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, ExternalLink, BookOpen } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AIResponseErrorHandlerProps {
  error: string;
  context?: string;
  onRetry?: () => void;
  isLoading?: boolean;
}

const AIResponseErrorHandler: React.FC<AIResponseErrorHandlerProps> = ({
  error,
  context,
  onRetry,
  isLoading = false
}) => {
  const getContextualHelp = () => {
    const helpLinks: Record<string, { text: string; url: string }[]> = {
      'audit-actions': [
        { text: 'ISA-standarder oversikt', url: '/fag/kategori/isa-standarder' },
        { text: 'Revisjonshandlinger guide', url: '/fag/kategori/revisjonshandlinger' }
      ],
      'documentation': [
        { text: 'Dokumentanalyse guide', url: '/fag/kategori/dokumentasjon' },
        { text: 'Kvalitetssikring', url: '/fag/kategori/kvalitet' }
      ],
      'client-detail': [
        { text: 'Klientanalyse guide', url: '/fag/kategori/klientforhold' },
        { text: 'Risikovurdering', url: '/fag/kategori/risiko' }
      ]
    };

    return helpLinks[context || 'default'] || [
      { text: 'Kunnskapsbase', url: '/fag' },
      { text: 'Ofte stilte spørsmål', url: '/fag/kategori/faq' }
    ];
  };

  const getSuggestions = () => {
    const suggestions: Record<string, string[]> = {
      'audit-actions': [
        'Prøv å være mer spesifikk i spørsmålet ditt',
        'Sjekk ISA-standardene direkte i kunnskapsbasen',
        'Se eksisterende arbeidspapirsaker for lignende klienter'
      ],
      'documentation': [
        'Bruk standard sjekklister mens AI-Revy er utilgjengelig',
        'Se tidligere lignende klienter for sammenligning',
        'Kontroller dokumentkrav manuelt'
      ],
      'client-detail': [
        'Sjekk regnskapsdataene direkte',
        'Se historiske revisjonsnotater',
        'Kontroller bransjetall manuelt'
      ]
    };

    return suggestions[context || 'default'] || [
      'Prøv å omformulere spørsmålet ditt',
      'Sjekk kunnskapsbasen for relaterte artikler',
      'Kontakt en kollega for veiledning'
    ];
  };

  const handleContactSupport = () => {
    toast({
      title: "Kontakt support",
      description: "Vi har registrert problemet og vil se på det så snart som mulig.",
    });
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-orange-900 mb-2">
              AI-Revy er midlertidig utilgjengelig
            </h4>
            <p className="text-sm text-orange-800 mb-3">
              {error.includes('timeout') 
                ? 'Forespørselen tok for lang tid. Dette kan skyldes høy belastning.'
                : error.includes('auth')
                ? 'Det oppstod et autentiseringsproblem. Prøv å logge inn på nytt.'
                : 'Det oppstod en teknisk feil. Vi jobber med å løse problemet.'
              }
            </p>

            <div className="space-y-3">
              <div>
                <h5 className="text-sm font-medium text-orange-900 mb-2">
                  Hva du kan gjøre mens vi fikser dette:
                </h5>
                <ul className="text-sm text-orange-800 space-y-1">
                  {getSuggestions().map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-orange-600">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h5 className="text-sm font-medium text-orange-900 mb-2">
                  Nyttige ressurser:
                </h5>
                <div className="flex flex-wrap gap-2">
                  {getContextualHelp().map((link, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-orange-300 text-orange-700 hover:bg-orange-100"
                      asChild
                    >
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {link.text}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                {onRetry && (
                  <Button
                    onClick={onRetry}
                    disabled={isLoading}
                    size="sm"
                    className="h-7"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Prøver igjen...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Prøv igjen
                      </>
                    )}
                  </Button>
                )}
                <Button
                  onClick={handleContactSupport}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                >
                  Kontakt support
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIResponseErrorHandler;