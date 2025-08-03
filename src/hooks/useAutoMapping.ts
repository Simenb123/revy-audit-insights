import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStandardAccounts } from './useChartOfAccounts';
import { useTrialBalanceData } from './useTrialBalanceData';
import { useTrialBalanceMappings } from './useTrialBalanceMappings';
import { useBulkSaveTrialBalanceMappings } from './useTrialBalanceMappings';
import { useAccountMappingRules } from './useAccountMappingRules';
import { toast } from './use-toast';

export interface AutoMappingSuggestion {
  accountNumber: string;
  accountName: string;
  suggestedMapping: string;
  confidence: number;
  reason: string;
}

// Name-based fallback mapping rules
const nameMappingRules = [
  { keywords: ['bank', 'kasse'], confidence: 0.8 },
  { keywords: ['kunde', 'fordring'], confidence: 0.8 },
  { keywords: ['lager', 'vare'], confidence: 0.8 },
  { keywords: ['leverandør', 'kreditor'], confidence: 0.8 },
  { keywords: ['mva', 'merverdiavgift'], confidence: 0.8 },
  { keywords: ['lønn', 'salary'], confidence: 0.8 },
  { keywords: ['salg', 'omsetning', 'inntekt'], confidence: 0.7 },
  { keywords: ['kostnad', 'expense'], confidence: 0.6 },
];

export const useAutoMapping = (clientId: string) => {
  const { data: standardAccounts } = useStandardAccounts();
  const { data: trialBalanceData } = useTrialBalanceData(clientId);
  const { data: existingMappings = [] } = useTrialBalanceMappings(clientId);
  const { data: mappingRules = [] } = useAccountMappingRules();
  const bulkSaveMapping = useBulkSaveTrialBalanceMappings();
  const queryClient = useQueryClient();

  const generateAutoMappingSuggestions = (): AutoMappingSuggestion[] => {
    if (!trialBalanceData || !standardAccounts || !mappingRules) return [];

    const existingMappingSet = new Set(existingMappings.map(m => m.account_number));
    const standardAccountsMap = new Map(standardAccounts.map(acc => [acc.id, acc.standard_number]));
    
    // Deduplicate trial balance data by account number first
    const uniqueAccounts = new Map<string, typeof trialBalanceData[0]>();
    trialBalanceData.forEach(account => {
      if (!uniqueAccounts.has(account.account_number)) {
        uniqueAccounts.set(account.account_number, account);
      }
    });
    
    const suggestions: AutoMappingSuggestion[] = [];
    const processedAccounts = new Set<string>(); // Additional safety check

    uniqueAccounts.forEach(account => {
      // Skip already mapped accounts
      if (existingMappingSet.has(account.account_number) || processedAccounts.has(account.account_number)) return;
      
      processedAccounts.add(account.account_number);

      let bestSuggestion: { standardNumber: string; confidence: number; reason: string } | null = null;
      const accountNumber = parseInt(account.account_number);

      // Try mapping rules based on account number ranges (primary method)
      for (const rule of mappingRules) {
        if (accountNumber >= rule.account_range_start && accountNumber <= rule.account_range_end) {
          const standardNumber = standardAccountsMap.get(rule.standard_account_id);
          if (standardNumber) {
            bestSuggestion = {
              standardNumber: standardNumber,
              confidence: rule.confidence_score,
              reason: `Kontointervall: ${rule.rule_name} (${rule.account_range_start}-${rule.account_range_end})`
            };
            break; // Use first matching rule (rules are ordered by range start)
          }
        }
      }

      // Try name-based rules as fallback if no range match found
      if (!bestSuggestion) {
        const accountNameLower = account.account_name.toLowerCase();
        
        for (const nameRule of nameMappingRules) {
          const matches = nameRule.keywords.some(keyword => 
            accountNameLower.includes(keyword.toLowerCase())
          );
          
          if (matches) {
            // For name-based matching, we need to find a reasonable standard account
            // This is a fallback, so we'll use lower confidence
            const fallbackStandardAccount = standardAccounts.find(acc => 
              nameRule.keywords.some(keyword => 
                acc.standard_name?.toLowerCase().includes(keyword.toLowerCase())
              )
            );
            
            if (fallbackStandardAccount) {
              bestSuggestion = {
                standardNumber: fallbackStandardAccount.standard_number,
                confidence: nameRule.confidence * 0.7, // Lower confidence for name matching
                reason: `Kontonavn matcher: ${nameRule.keywords.join(', ')}`
              };
              break;
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