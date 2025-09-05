import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Lightbulb, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  BookOpen,
  Keyboard,
  Target,
  Zap,
  X
} from 'lucide-react';

interface GuidanceStep {
  id: string;
  title: string;
  description: string;
  type: 'setup' | 'action' | 'tip' | 'warning';
  completed?: boolean;
  priority: 'high' | 'medium' | 'low';
  action?: () => void;
  shortcut?: string;
}

interface SmartGuidanceSystemProps {
  currentContext: 'mapping' | 'reconciliation' | 'review' | 'export';
  userLevel: 'beginner' | 'intermediate' | 'expert';
  completedSteps: string[];
  onStepComplete: (stepId: string) => void;
  onDismiss?: () => void;
}

const SmartGuidanceSystem: React.FC<SmartGuidanceSystemProps> = ({
  currentContext,
  userLevel,
  completedSteps,
  onStepComplete,
  onDismiss
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Context-specific guidance steps
  const getContextSteps = (): GuidanceStep[] => {
    const baseSteps: Record<string, GuidanceStep[]> = {
      mapping: [
        {
          id: 'upload-data',
          title: 'Last opp grunnlagsdata',
          description: 'Start med å laste opp A07-data og saldobalanse for å etablere grunnlaget for avstemming.',
          type: 'setup',
          priority: 'high'
        },
        {
          id: 'review-accounts',
          title: 'Gå gjennom kontoer',
          description: 'Se gjennom alle kontoer som skal stemmes av og identifiser hvilke som krever spesiell oppmerksomhet.',
          type: 'action',
          priority: 'high'
        },
        {
          id: 'auto-mapping',
          title: 'Bruk automatisk mapping',
          description: 'La systemet foreslå mappinger basert på tidligere mønstre og AI-analyse.',
          type: 'tip',
          priority: 'medium',
          shortcut: 'Ctrl + M'
        },
        {
          id: 'bulk-operations',
          title: 'Bruk bulk-operasjoner',
          description: 'Spar tid ved å mappe flere kontoer samtidig med lignende egenskaper.',
          type: 'tip',
          priority: 'medium'
        }
      ],
      reconciliation: [
        {
          id: 'check-large-differences',
          title: 'Sjekk store avvik først',
          description: 'Start med de største avvikene da disse oftest gir størst effekt når de løses.',
          type: 'action',
          priority: 'high'
        },
        {
          id: 'review-account-names',
          title: 'Kontroller kontonavn',
          description: 'Sørg for at kontonavn matcher det som forventes basert på kontonummer.',
          type: 'action',
          priority: 'medium'
        },
        {
          id: 'add-reconciliation-notes',
          title: 'Legg til notater',
          description: 'Dokumenter viktige avvik og hvordan de ble løst for fremtidig referanse.',
          type: 'tip',
          priority: 'low',
          shortcut: 'Ctrl + N'
        }
      ],
      review: [
        {
          id: 'final-validation',
          title: 'Gjennomfør endelig validering',
          description: 'Kontroller at alle kritiske avvik er løst før du fullfører avstemmingen.',
          type: 'setup',
          priority: 'high'
        },
        {
          id: 'export-report',
          title: 'Eksporter rapport',
          description: 'Generer og lagre avstemmingsrapporten for dokumentasjon.',
          type: 'action',
          priority: 'medium',
          shortcut: 'Ctrl + E'
        }
      ],
      export: [
        {
          id: 'select-format',
          title: 'Velg eksportformat',
          description: 'Velg riktig format basert på hvordan rapporten skal brukes.',
          type: 'setup',
          priority: 'high'
        }
      ]
    };

    return baseSteps[currentContext] || [];
  };

  const steps = getContextSteps();
  const activeSteps = steps.filter(step => !completedSteps.includes(step.id));
  const completionPercentage = steps.length > 0 ? Math.round((completedSteps.length / steps.length) * 100) : 0;

  const prioritySteps = activeSteps.filter(step => step.priority === 'high');
  const currentStep = prioritySteps[0] || activeSteps[0];

  const getStepIcon = (type: GuidanceStep['type']) => {
    switch (type) {
      case 'setup': return <Target className="h-4 w-4" />;
      case 'action': return <Zap className="h-4 w-4" />;
      case 'tip': return <Lightbulb className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getStepColor = (type: GuidanceStep['type']) => {
    switch (type) {
      case 'setup': return 'border-blue-200 bg-blue-50';
      case 'action': return 'border-green-200 bg-green-50';
      case 'tip': return 'border-yellow-200 bg-yellow-50';
      case 'warning': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const keyboardShortcuts = [
    { key: 'Ctrl + M', action: 'Aktiver automatisk mapping' },
    { key: 'Ctrl + N', action: 'Legg til notat' },
    { key: 'Ctrl + S', action: 'Lagre fremgang' },
    { key: 'Ctrl + E', action: 'Eksporter rapport' },
    { key: 'Ctrl + F', action: 'Søk i kontoer' },
    { key: 'Ctrl + Z', action: 'Angre siste handling' },
    { key: 'Tab', action: 'Naviger mellom felt' },
    { key: 'Enter', action: 'Bekreft valg' },
  ];

  if (isMinimized) {
    return (
      <Card className="fixed bottom-4 right-4 w-80 shadow-lg z-50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm font-medium">Smart veiledning</span>
              <Badge variant="secondary" className="text-xs">
                {completionPercentage}%
              </Badge>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsMinimized(false)}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 shadow-xl z-50 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Smart Veiledning</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
              title="Vis hurtigtaster"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsMinimized(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mt-2">
          <Progress value={completionPercentage} className="flex-1 h-2" />
          <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
            {completedSteps.length}/{steps.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Step */}
        {currentStep && (
          <Alert className={getStepColor(currentStep.type)}>
            <div className="flex items-start gap-3">
              {getStepIcon(currentStep.type)}
              <div className="flex-1">
                <AlertDescription>
                  <div className="font-medium mb-1">{currentStep.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {currentStep.description}
                  </div>
                  {currentStep.shortcut && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      {currentStep.shortcut}
                    </Badge>
                  )}
                </AlertDescription>
              </div>
              <Button
                size="sm"
                onClick={() => onStepComplete(currentStep.id)}
                className="ml-2"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        )}

        {/* Upcoming Steps Preview */}
        {activeSteps.length > 1 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Neste steg:</div>
            {activeSteps.slice(1, 3).map((step) => (
              <div key={step.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                {getStepIcon(step.type)}
                <span>{step.title}</span>
              </div>
            ))}
          </div>
        )}

        {/* Keyboard Shortcuts */}
        {showKeyboardShortcuts && (
          <div className="border-t pt-3">
            <div className="text-sm font-medium mb-2">Hurtigtaster:</div>
            <div className="grid grid-cols-1 gap-1 text-xs">
              {keyboardShortcuts.map((shortcut, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-muted-foreground">{shortcut.action}</span>
                  <Badge variant="outline" className="text-xs">
                    {shortcut.key}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completion Message */}
        {completionPercentage === 100 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Gratulerer!</div>
              <div className="text-sm">Du har fullført alle anbefalte steg for denne delen.</div>
            </AlertDescription>
          </Alert>
        )}

        {onDismiss && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDismiss}
            className="w-full"
          >
            Skjul veiledning
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartGuidanceSystem;