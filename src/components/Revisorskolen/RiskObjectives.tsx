import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Target } from 'lucide-react';

interface RiskObjectivesProps {
  objectives: string[];
  achievedKeys: Set<string>;
}

export const RiskObjectives = ({ objectives, achievedKeys }: RiskObjectivesProps) => {
  const objectiveDetails = getObjectiveDetails();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Revisjonsmål og risikoer</h3>
        <Badge variant="secondary">
          {achievedKeys.size}/{objectives.length}
        </Badge>
      </div>

      <div className="grid gap-4">
        {objectives.map((objective) => {
          const isAchieved = achievedKeys.has(objective);
          const details = objectiveDetails[objective];
          
          return (
            <Card 
              key={objective} 
              className={`transition-all duration-300 ${
                isAchieved 
                ? 'border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-950/20' 
                : 'border-orange-200 bg-orange-50/30 dark:border-orange-800 dark:bg-orange-950/20'
              }`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {isAchieved ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                  )}
                  <span>{details?.name || objective}</span>
                  <Badge 
                    variant={isAchieved ? "default" : "secondary"}
                    className="ml-auto"
                  >
                    {isAchieved ? 'Avdekket' : 'Ikke avdekket'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {details?.description || `Risiko knyttet til ${objective}`}
                </p>
                {isAchieved && (
                  <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/20 rounded text-xs text-green-800 dark:text-green-300">
                    ✅ Dette risikoområdet er nå avdekket og dokumentert
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Revisjonsstatus</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {achievedKeys.size === objectives.length ? (
            <span className="text-green-600 font-medium">
              🎉 Alle hovedrisikoer er avdekket! Revisjonen er fullført.
            </span>
          ) : (
            <span>
              Du har avdekket {achievedKeys.size} av {objectives.length} hovedrisikoer. 
              Fortsett å utføre handlinger for å få full oversikt.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

function getObjectiveDetails(): Record<string, { name: string; description: string }> {
  return {
    'periodisering': {
      name: 'Periodisering av inntekter',
      description: 'Kontroller at inntekter er periodiseret riktig og i henhold til regnskapsprinsipper. Fokus på cut-off og inntektsføring.'
    },
    'ulovlig_laan': {
      name: 'Ulovlige lån til nærstående',
      description: 'Undersøk eventuelle lån eller finansielle transaksjoner med daglig leder, styremedlemmer eller andre nærstående parter.'
    },
    'varelager_nedskrivning': {
      name: 'Varelager og nedskrivninger',
      description: 'Vurder varelageret og behovet for nedskrivninger grunnet foreldelse, skade eller redusert markedsverdi.'
    },
    'tapsrisiko_fordringer': {
      name: 'Tapsrisiko på kundefordringer',
      description: 'Analyser kundefordringene og vurder behovet for tapsavsetninger basert på alder og innkrevbarhet.'
    }
  };
}