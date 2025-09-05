import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMappingRules, useBulkCreateMappingRules } from './useMappingRules';
import { toast } from '@/hooks/use-toast';
import { findMatchingKeywordRules, getSuggestedA07Codes } from '../lib/payrollKeywords';
import Fuse from 'fuse.js';

export interface EnhancedAutoMappingSuggestion {
  accountNumber: string;
  accountName: string;
  suggestedCode: string;
  confidence: number;
  reason: string;
  matchType: 'exact' | 'fuzzy' | 'keyword' | 'learned' | 'amount';
  originalAmount?: number;
  historicalData?: {
    previousMappings: number;
    userApprovals: number;
    averageConfidence: number;
  };
}

export interface GLEntry {
  account: string;
  text: string;
  amount: number;
}

interface MappingHistory {
  accountName: string;
  code: string;
  userApproved: boolean;
  confidence: number;
  createdAt: string;
}

export const useEnhancedAutoMapping = (clientId: string, glEntries: GLEntry[] = []) => {
  const { data: existingRules = [] } = useMappingRules(clientId);
  const bulkCreateRules = useBulkCreateMappingRules();
  const queryClient = useQueryClient();

  // Create Fuse instance for fuzzy matching
  const fuse = new Fuse(glEntries, {
    keys: ['text', 'account'],
    threshold: 0.4, // Allow some fuzziness
    includeScore: true,
    includeMatches: true
  });

  const generateEnhancedSuggestions = (): EnhancedAutoMappingSuggestion[] => {
    if (!glEntries || glEntries.length === 0) return [];

    const suggestions: EnhancedAutoMappingSuggestion[] = [];
    const processedAccounts = new Set<string>();

    // Get historical data from localStorage (simple implementation)
    const getHistoricalData = (accountName: string) => {
      try {
        const history = JSON.parse(localStorage.getItem(`mapping-history-${clientId}`) || '[]') as MappingHistory[];
        const relevantHistory = history.filter(h => 
          h.accountName.toLowerCase().includes(accountName.toLowerCase()) ||
          accountName.toLowerCase().includes(h.accountName.toLowerCase())
        );
        
        if (relevantHistory.length === 0) return null;
        
        const userApprovals = relevantHistory.filter(h => h.userApproved).length;
        const averageConfidence = relevantHistory.reduce((sum, h) => sum + h.confidence, 0) / relevantHistory.length;
        
        return {
          previousMappings: relevantHistory.length,
          userApprovals,
          averageConfidence
        };
      } catch {
        return null;
      }
    };

    glEntries.forEach(entry => {
      if (processedAccounts.has(entry.account)) return;
      processedAccounts.add(entry.account);

      let bestSuggestion: EnhancedAutoMappingSuggestion | null = null;

      // 1. Check existing rules (exact matches)
      const matchingRule = existingRules.find(rule => 
        rule.account === entry.account || 
        rule.keywords.some(keyword => 
          entry.text.toLowerCase().includes(keyword.toLowerCase())
        )
      );

      if (matchingRule) {
        bestSuggestion = {
          accountNumber: entry.account,
          accountName: entry.text,
          suggestedCode: matchingRule.code,
          confidence: 0.95,
          reason: `Eksisterende regel: ${matchingRule.account}`,
          matchType: 'exact',
          originalAmount: entry.amount
        };
      }

      // 2. Keyword-based matching with enhanced library
      if (!bestSuggestion) {
        const keywordSuggestions = getSuggestedA07Codes(entry.text);
        if (keywordSuggestions.length > 0) {
          const topSuggestion = keywordSuggestions[0];
          bestSuggestion = {
            accountNumber: entry.account,
            accountName: entry.text,
            suggestedCode: topSuggestion.code,
            confidence: topSuggestion.confidence * 0.9, // Slightly lower than exact matches
            reason: topSuggestion.reason,
            matchType: 'keyword',
            originalAmount: entry.amount
          };
        }
      }

      // 3. Fuzzy matching against historical successful mappings
      if (!bestSuggestion) {
        const historicalData = getHistoricalData(entry.text);
        if (historicalData && historicalData.userApprovals > 0) {
          // Simple implementation - would need more sophisticated logic in production
          const fuzzyResults = fuse.search(entry.text).slice(0, 3);
          
          if (fuzzyResults.length > 0 && fuzzyResults[0].score && fuzzyResults[0].score < 0.3) {
            bestSuggestion = {
              accountNumber: entry.account,
              accountName: entry.text,
              suggestedCode: 'learned_suggestion', // Would be actual learned code
              confidence: (1 - fuzzyResults[0].score) * historicalData.averageConfidence,
              reason: `Læring fra tidligere valg (${historicalData.userApprovals} godkjenninger)`,
              matchType: 'learned',
              originalAmount: entry.amount,
              historicalData
            };
          }
        }
      }

      // 4. Amount-based pattern matching
      if (!bestSuggestion) {
        const amountPatterns = [
          { min: 45000, max: 65000, code: 'fastLonn', reason: 'Typisk fastlønn beløp' },
          { min: 15000, max: 35000, code: 'timeLonn', reason: 'Typisk timelønn beløp' },
          { min: 2000, max: 8000, code: 'bilGodtgjorelse', reason: 'Typisk bilgodtgjørelse beløp' },
          { min: 100000, max: 500000, code: 'bonus', reason: 'Typisk bonus beløp' }
        ];

        const matchingPattern = amountPatterns.find(pattern => 
          entry.amount >= pattern.min && entry.amount <= pattern.max
        );

        if (matchingPattern) {
          bestSuggestion = {
            accountNumber: entry.account,
            accountName: entry.text,
            suggestedCode: matchingPattern.code,
            confidence: 0.6, // Lower confidence for amount-only matching
            reason: matchingPattern.reason,
            matchType: 'amount',
            originalAmount: entry.amount
          };
        }
      }

      if (bestSuggestion) {
        // Add historical data if available
        bestSuggestion.historicalData = getHistoricalData(entry.text);
        suggestions.push(bestSuggestion);
      }
    });

    // Sort by confidence (highest first)
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  };

  const applyEnhancedMapping = useMutation({
    mutationFn: async (suggestions: EnhancedAutoMappingSuggestion[]) => {
      // Convert suggestions to mapping rules
      const rules = suggestions.map(suggestion => ({
        client_id: clientId,
        account: suggestion.accountNumber,
        code: suggestion.suggestedCode,
        strategy: 'score' as const,
        weight: Math.round(suggestion.confidence * 10),
        keywords: [suggestion.accountName.toLowerCase()],
        regex: '',
        priority: 1,
        month_hints: []
      }));

      // Save mapping history for learning
      const history: MappingHistory[] = suggestions.map(suggestion => ({
        accountName: suggestion.accountName,
        code: suggestion.suggestedCode,
        userApproved: true, // Assuming user approved by applying
        confidence: suggestion.confidence,
        createdAt: new Date().toISOString()
      }));

      try {
        const existingHistory = JSON.parse(localStorage.getItem(`mapping-history-${clientId}`) || '[]');
        localStorage.setItem(`mapping-history-${clientId}`, JSON.stringify([...existingHistory, ...history]));
      } catch (error) {
        console.warn('Could not save mapping history:', error);
      }

      return bulkCreateRules.mutateAsync(rules);
    },
    onSuccess: (_, suggestions) => {
      queryClient.invalidateQueries({ queryKey: ['mapping-rules', clientId] });
      toast({
        title: "Forbedret automatisk mapping fullført",
        description: `${suggestions.length} avanserte mapping-regler ble opprettet`,
      });
    },
    onError: (error) => {
      console.error('Enhanced auto mapping error:', error);
      toast({
        title: "Feil ved forbedret automatisk mapping",
        description: "Kunne ikke utføre forbedret automatisk mapping",
        variant: "destructive"
      });
    }
  });

  const recordUserChoice = (suggestion: EnhancedAutoMappingSuggestion, approved: boolean) => {
    try {
      const history: MappingHistory = {
        accountName: suggestion.accountName,
        code: suggestion.suggestedCode,
        userApproved: approved,
        confidence: suggestion.confidence,
        createdAt: new Date().toISOString()
      };

      const existingHistory = JSON.parse(localStorage.getItem(`mapping-history-${clientId}`) || '[]');
      localStorage.setItem(`mapping-history-${clientId}`, JSON.stringify([...existingHistory, history]));
    } catch (error) {
      console.warn('Could not record user choice:', error);
    }
  };

  return {
    generateEnhancedSuggestions,
    applyEnhancedMapping,
    recordUserChoice,
    isApplying: applyEnhancedMapping.isPending
  };
};