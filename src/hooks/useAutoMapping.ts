import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStandardAccounts } from './useChartOfAccounts';
import { useTrialBalanceData } from './useTrialBalanceData';
import { useTrialBalanceMappings } from './useTrialBalanceMappings';
import { useBulkSaveTrialBalanceMappings } from './useTrialBalanceMappings';
import { toast } from './use-toast';

export interface AutoMappingSuggestion {
  accountNumber: string;
  accountName: string;
  suggestedMapping: string;
  confidence: number;
  reason: string;
}

// Norwegian account mapping rules based on standard chart of accounts
const norwegianMappingRules = [
  // Assets (1000-1999)
  { pattern: /^19[0-9][0-9]/, standardNumber: '1900', name: 'Bank', confidence: 0.9 },
  { pattern: /^150[0-9]/, standardNumber: '1500', name: 'Kundefordringer', confidence: 0.9 },
  { pattern: /^140[0-9]/, standardNumber: '1400', name: 'Varelager', confidence: 0.9 },
  { pattern: /^12[0-9][0-9]/, standardNumber: '1200', name: 'Driftsmidler', confidence: 0.8 },
  { pattern: /^180[0-9]/, standardNumber: '1800', name: 'Forskuddsbetalt', confidence: 0.8 },
  
  // Liabilities (2000-2999)
  { pattern: /^24[0-9][0-9]/, standardNumber: '2400', name: 'Leverandørgjeld', confidence: 0.9 },
  { pattern: /^27[0-9][0-9]/, standardNumber: '2700', name: 'Skyldig offentlige avgifter', confidence: 0.9 },
  { pattern: /^29[0-9][0-9]/, standardNumber: '2900', name: 'Annen kortsiktig gjeld', confidence: 0.8 },
  { pattern: /^20[0-9][0-9]/, standardNumber: '2000', name: 'Langsiktig gjeld', confidence: 0.8 },
  
  // Equity (3000-3999)
  { pattern: /^30[0-9][0-9]/, standardNumber: '3000', name: 'Egenkapital', confidence: 0.9 },
  
  // Revenue (4000-4999)
  { pattern: /^30[0-9][0-9]/, standardNumber: '3000', name: 'Salgsinntekt', confidence: 0.9 },
  { pattern: /^38[0-9][0-9]/, standardNumber: '3800', name: 'Andre inntekter', confidence: 0.8 },
  
  // Expenses (5000-8999)
  { pattern: /^40[0-9][0-9]/, standardNumber: '4000', name: 'Varekostnad', confidence: 0.9 },
  { pattern: /^50[0-9][0-9]/, standardNumber: '5000', name: 'Lønnskostnad', confidence: 0.9 },
  { pattern: /^51[0-9][0-9]/, standardNumber: '5100', name: 'Sosiale kostnader', confidence: 0.9 },
  { pattern: /^60[0-9][0-9]/, standardNumber: '6000', name: 'Andre driftskostnader', confidence: 0.8 },
  { pattern: /^61[0-9][0-9]/, standardNumber: '6100', name: 'Avskrivninger', confidence: 0.8 },
  { pattern: /^7[0-9][0-9][0-9]/, standardNumber: '7000', name: 'Finanskostnader', confidence: 0.8 },
  { pattern: /^8[0-9][0-9][0-9]/, standardNumber: '8000', name: 'Finansinntekter', confidence: 0.8 },
];

// Name-based mapping rules
const nameMappingRules = [
  { keywords: ['bank', 'kasse'], standardNumber: '1900', confidence: 0.8 },
  { keywords: ['kunde', 'fordring'], standardNumber: '1500', confidence: 0.8 },
  { keywords: ['lager', 'vare'], standardNumber: '1400', confidence: 0.8 },
  { keywords: ['leverandør', 'kreditor'], standardNumber: '2400', confidence: 0.8 },
  { keywords: ['mva', 'merverdiavgift'], standardNumber: '2700', confidence: 0.8 },
  { keywords: ['lønn', 'salary'], standardNumber: '5000', confidence: 0.8 },
  { keywords: ['salg', 'omsetning', 'inntekt'], standardNumber: '3000', confidence: 0.7 },
  { keywords: ['kostnad', 'expense'], standardNumber: '6000', confidence: 0.6 },
];

export const useAutoMapping = (clientId: string) => {
  const { data: standardAccounts } = useStandardAccounts();
  const { data: trialBalanceData } = useTrialBalanceData(clientId);
  const { data: existingMappings = [] } = useTrialBalanceMappings(clientId);
  const bulkSaveMapping = useBulkSaveTrialBalanceMappings();
  const queryClient = useQueryClient();

  const generateAutoMappingSuggestions = (): AutoMappingSuggestion[] => {
    if (!trialBalanceData || !standardAccounts) return [];

    const existingMappingSet = new Set(existingMappings.map(m => m.account_number));
    const standardAccountNumbers = new Set(standardAccounts.map(acc => acc.standard_number));
    
    const suggestions: AutoMappingSuggestion[] = [];

    trialBalanceData.forEach(account => {
      // Skip already mapped accounts
      if (existingMappingSet.has(account.account_number)) return;

      let bestSuggestion: { standardNumber: string; confidence: number; reason: string } | null = null;

      // Try number-based rules first (higher confidence)
      for (const rule of norwegianMappingRules) {
        if (rule.pattern.test(account.account_number)) {
          if (standardAccountNumbers.has(rule.standardNumber)) {
            if (!bestSuggestion || rule.confidence > bestSuggestion.confidence) {
              bestSuggestion = {
                standardNumber: rule.standardNumber,
                confidence: rule.confidence,
                reason: `Kontonummer-mønster: ${rule.name}`
              };
            }
          }
        }
      }

      // Try name-based rules if no number match found
      if (!bestSuggestion || bestSuggestion.confidence < 0.8) {
        const accountNameLower = account.account_name.toLowerCase();
        
        for (const rule of nameMappingRules) {
          const matches = rule.keywords.some(keyword => 
            accountNameLower.includes(keyword.toLowerCase())
          );
          
          if (matches && standardAccountNumbers.has(rule.standardNumber)) {
            if (!bestSuggestion || rule.confidence > bestSuggestion.confidence) {
              bestSuggestion = {
                standardNumber: rule.standardNumber,
                confidence: rule.confidence,
                reason: `Kontonavn matcher: ${rule.keywords.join(', ')}`
              };
            }
          }
        }
      }

      if (bestSuggestion) {
        suggestions.push({
          accountNumber: account.account_number,
          accountName: account.account_name,
          suggestedMapping: bestSuggestion.standardNumber,
          confidence: bestSuggestion.confidence,
          reason: bestSuggestion.reason
        });
      }
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  };

  const applyAutoMapping = useMutation({
    mutationFn: async (suggestions: AutoMappingSuggestion[]) => {
      const mappings = suggestions.map(suggestion => ({
        accountNumber: suggestion.accountNumber,
        statementLineNumber: suggestion.suggestedMapping
      }));

      return bulkSaveMapping.mutateAsync({
        clientId,
        mappings
      });
    },
    onSuccess: (_, suggestions) => {
      queryClient.invalidateQueries({ queryKey: ['trial-balance-mappings', clientId] });
      toast({
        title: "Automatisk mapping fullført",
        description: `${suggestions.length} kontoer ble mappet automatisk`,
      });
    },
    onError: (error) => {
      console.error('Auto mapping error:', error);
      toast({
        title: "Feil ved automatisk mapping",
        description: "Kunne ikke utføre automatisk mapping",
        variant: "destructive"
      });
    }
  });

  return {
    generateAutoMappingSuggestions,
    applyAutoMapping,
    isApplying: applyAutoMapping.isPending
  };
};