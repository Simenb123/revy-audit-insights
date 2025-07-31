import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wand2, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateAccountMappingRule } from '@/hooks/useAccountMappingRules';
import { useStandardAccounts } from '@/hooks/useChartOfAccounts';

interface AutoMappingRulesGeneratorProps {
  onRulesGenerated?: () => void;
}

const AutoMappingRulesGenerator = ({ onRulesGenerated }: AutoMappingRulesGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRules, setGeneratedRules] = useState<any[]>([]);
  const { data: standardAccounts } = useStandardAccounts();
  const createRule = useCreateAccountMappingRule();

  const norwegianAccountRules = [
    { name: 'Anleggsmidler', range: [1000, 1999], standardNumber: '101' },
    { name: 'Omløpsmidler - Varer', range: [2000, 2999], standardNumber: '201' },
    { name: 'Omløpsmidler - Fordringer', range: [3000, 3999], standardNumber: '301' },
    { name: 'Omløpsmidler - Bankinnskudd', range: [5000, 5999], standardNumber: '501' },
    { name: 'Langsiktig gjeld', range: [6000, 6999], standardNumber: '601' },
    { name: 'Kortsiktig gjeld', range: [7000, 7999], standardNumber: '701' },
    { name: 'Egenkapital', range: [8000, 8999], standardNumber: '801' },
    { name: 'Salgsinntekter', range: [9000, 9999], standardNumber: '901' },
    { name: 'Varekostnader', range: [4000, 4999], standardNumber: '401' },
    { name: 'Lønnskostnader', range: [5000, 5999], standardNumber: '501' },
    { name: 'Andre driftskostnader', range: [6000, 6999], standardNumber: '601' },
    { name: 'Finansinntekter', range: [8000, 8199], standardNumber: '801' },
    { name: 'Finanskostnader', range: [8200, 8999], standardNumber: '821' },
  ];

  const generateStandardRules = async () => {
    if (!standardAccounts) {
      toast.error('Standardkontoer er ikke lastet ennå');
      return;
    }

    setIsGenerating(true);
    const rules: any[] = [];

    try {
      for (const rule of norwegianAccountRules) {
        const standardAccount = standardAccounts.find(acc => acc.standard_number === rule.standardNumber);
        
        if (standardAccount) {
          rules.push({
            rule_name: rule.name,
            account_range_start: rule.range[0],
            account_range_end: rule.range[1],
            standard_account_id: standardAccount.id,
            confidence_score: 0.9,
            is_active: true
          });
        }
      }

      setGeneratedRules(rules);
      toast.success(`Genererte ${rules.length} mappingregler basert på norsk standard`);
    } catch (error) {
      console.error('Error generating rules:', error);
      toast.error('Feil ved generering av regler');
    } finally {
      setIsGenerating(false);
    }
  };

  const applyGeneratedRules = async () => {
    if (generatedRules.length === 0) return;

    setIsGenerating(true);
    let successCount = 0;

    try {
      for (const rule of generatedRules) {
        try {
          await createRule.mutateAsync(rule);
          successCount++;
        } catch (error) {
          console.error('Error creating rule:', rule, error);
        }
      }

      toast.success(`Opprettet ${successCount} av ${generatedRules.length} mappingregler`);
      setGeneratedRules([]);
      onRulesGenerated?.();
    } catch (error) {
      toast.error('Feil ved opprettelse av regler');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          Automatisk generering av mappingregler
        </CardTitle>
        <CardDescription>
          Generer standard mappingregler basert på norsk regnskapsstandard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={generateStandardRules}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            Generer standard mappingregler
          </Button>

          {generatedRules.length > 0 && (
            <Button
              onClick={applyGeneratedRules}
              disabled={isGenerating}
              variant="default"
            >
              Bruk {generatedRules.length} regler
            </Button>
          )}
        </div>

        {generatedRules.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Genererte regler:</h4>
            <div className="grid gap-2 max-h-48 overflow-y-auto">
              {generatedRules.map((rule, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{rule.rule_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {rule.account_range_start} - {rule.account_range_end}
                    </Badge>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {rule.confidence_score * 100}% sikkerhet
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Viktig informasjon:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Disse reglene er basert på standard norsk kontoplan</li>
              <li>Du kan justere reglene etter behov for din spesifikke klient</li>
              <li>Reglene vil automatisk mappe kontoer til riktige standardkontoer</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoMappingRulesGenerator;