import { GLEntry } from './tb';

export interface MappingRule {
  id: string;
  client_id: string;
  account: string;
  code: string;
  strategy: 'exclusive' | 'split' | 'score';
  split?: number;
  weight: number;
  keywords: string[];
  regex: string;
  priority: number;
  month_hints?: number[];
}

export interface ExactMatchResult {
  internalCode: string;
  targetAmount: number;
  exact: GLEntry[] | null;
  alternatives: {
    entries: GLEntry[];
    totalAmount: number;
    difference: number;
    totalWeight: number;
  }[];
}

export interface ExactMatchCandidate {
  entries: GLEntry[];
  totalAmount: number;
  difference: number;
  totalWeight: number;
}

/**
 * Find exact matches (±5 kr) for internal codes against GL entries
 */
export function findExactMatches(
  glEntries: GLEntry[],
  targets: Record<string, number>,
  rules: MappingRule[],
  tolerance: number = 5
): Record<string, ExactMatchResult> {
  const results: Record<string, ExactMatchResult> = {};
  
  Object.entries(targets).forEach(([internalCode, targetAmount]) => {
    if (targetAmount === 0) {
      results[internalCode] = {
        internalCode,
        targetAmount,
        exact: [],
        alternatives: []
      };
      return;
    }
    
    // Get candidates for this internal code
    const candidates = getCandidatesForCode(glEntries, internalCode, rules);
    
    if (candidates.length === 0) {
      results[internalCode] = {
        internalCode,
        targetAmount,
        exact: null,
        alternatives: []
      };
      return;
    }
    
    // Quick check for single-line and two-line exact matches
    const quickMatch = findQuickMatches(candidates, targetAmount, tolerance, rules);
    if (quickMatch) {
      results[internalCode] = {
        internalCode,
        targetAmount,
        exact: quickMatch.entries,
        alternatives: []
      };
      return;
    }
    
    // Use subset sum algorithm for complex matches
    const subsetMatches = findSubsetMatches(candidates, targetAmount, tolerance, rules);
    
    // Apply tie-breaking rules
    const exact = selectBestMatch(subsetMatches);
    const alternatives = subsetMatches
      .filter(match => match !== exact)
      .slice(0, 5); // Limit alternatives
    
    results[internalCode] = {
      internalCode,
      targetAmount,
      exact: exact?.entries || null,
      alternatives
    };
  });
  
  return results;
}

/**
 * Get GL entries that could match an internal code based on rules
 */
function getCandidatesForCode(
  glEntries: GLEntry[],
  internalCode: string,
  rules: MappingRule[]
): GLEntry[] {
  const relevantRules = rules.filter(rule => rule.code === internalCode);
  
  if (relevantRules.length === 0) {
    return [];
  }
  
  const candidates: GLEntry[] = [];
  
  glEntries.forEach(entry => {
    const isCandidate = relevantRules.some(rule => {
      // Check exact account match first
      if (rule.account && entry.account === rule.account) {
        return true;
      }
      
      // Check account pattern (for partial matches like account contains rule.account)
      if (rule.account && entry.account.includes(rule.account)) {
        return true;
      }
      
      // Check keywords (handle both array and string formats)
      if (rule.keywords && rule.keywords.length > 0) {
        const entryText = entry.text.toLowerCase();
        const accountText = entry.account.toLowerCase();
        
        const hasKeyword = rule.keywords.some(keyword => {
          const keywordLower = keyword.toLowerCase();
          return entryText.includes(keywordLower) || accountText.includes(keywordLower);
        });
        
        if (hasKeyword) return true;
      }
      
      // Check regex
      if (rule.regex && rule.regex.trim() !== '') {
        try {
          const regex = new RegExp(rule.regex, 'i');
          if (regex.test(entry.account) || regex.test(entry.text)) {
            return true;
          }
        } catch {
          // Invalid regex, ignore this rule
          console.warn('Invalid regex in mapping rule:', rule.regex);
        }
      }
      
      return false;
    });
    
    if (isCandidate) {
      candidates.push(entry);
    }
  });
  
  return candidates;
}

/**
 * Quick check for 1-2 line exact matches
 */
function findQuickMatches(
  candidates: GLEntry[],
  targetAmount: number,
  tolerance: number,
  rules: MappingRule[]
): ExactMatchCandidate | null {
  // Single line check
  for (const entry of candidates) {
    const diff = Math.abs(entry.amount - targetAmount);
    if (diff <= tolerance) {
      return {
        entries: [entry],
        totalAmount: entry.amount,
        difference: diff,
        totalWeight: getEntryWeight(entry, rules)
      };
    }
  }
  
  // Two line check
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const total = candidates[i].amount + candidates[j].amount;
      const diff = Math.abs(total - targetAmount);
      if (diff <= tolerance) {
        return {
          entries: [candidates[i], candidates[j]],
          totalAmount: total,
          difference: diff,
          totalWeight: getEntryWeight(candidates[i], rules) + getEntryWeight(candidates[j], rules)
        };
      }
    }
  }
  
  return null;
}

/**
 * Find subset matches using dynamic programming (limited to ~28 items for performance)
 */
function findSubsetMatches(
  candidates: GLEntry[],
  targetAmount: number,
  tolerance: number,
  rules: MappingRule[]
): ExactMatchCandidate[] {
  // Limit candidates to prevent exponential explosion
  const limitedCandidates = candidates.slice(0, 28);
  const matches: ExactMatchCandidate[] = [];
  
  // Generate all possible subsets
  const maxSubsets = Math.pow(2, limitedCandidates.length);
  
  for (let mask = 1; mask < maxSubsets; mask++) {
    const subset: GLEntry[] = [];
    let totalAmount = 0;
    
    for (let i = 0; i < limitedCandidates.length; i++) {
      if (mask & (1 << i)) {
        subset.push(limitedCandidates[i]);
        totalAmount += limitedCandidates[i].amount;
      }
    }
    
    const difference = Math.abs(totalAmount - targetAmount);
    if (difference <= tolerance) {
      const totalWeight = subset.reduce((sum, entry) => 
        sum + getEntryWeight(entry, rules), 0
      );
      
      matches.push({
        entries: subset,
        totalAmount,
        difference,
        totalWeight
      });
    }
  }
  
  return matches;
}

/**
 * Get weight for an entry based on matching rules
 */
function getEntryWeight(entry: GLEntry, rules: MappingRule[]): number {
  let maxWeight = 1;
  
  rules.forEach(rule => {
    if (rule.account && entry.account.includes(rule.account)) {
      maxWeight = Math.max(maxWeight, rule.weight);
    }
  });
  
  return maxWeight;
}

/**
 * Select best match using tie-breaking rules:
 * 1. Fewest lines
 * 2. Highest total rule weight
 * 3. Lowest difference
 */
function selectBestMatch(
  matches: ExactMatchCandidate[]
): ExactMatchCandidate | null {
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];
  
  // Sort by tie-breaking criteria
  matches.sort((a, b) => {
    // 1. Fewest lines (prefer fewer entries)
    if (a.entries.length !== b.entries.length) {
      return a.entries.length - b.entries.length;
    }
    
    // 2. Highest total weight
    if (a.totalWeight !== b.totalWeight) {
      return b.totalWeight - a.totalWeight;
    }
    
    // 3. Lowest difference
    return a.difference - b.difference;
  });
  
  return matches[0];
}

/**
 * Create regex pattern from GL entry text (escape special characters)
 */
export function createRegexFromText(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate exclusive mapping rules from exact matches
 */
export function generateExclusiveRules(
  matches: Record<string, ExactMatchResult>,
  clientId: string
): Partial<MappingRule>[] {
  const rules: Partial<MappingRule>[] = [];
  
  Object.entries(matches).forEach(([internalCode, result]) => {
    if (result.exact && result.exact.length > 0) {
      // Group by account
      const accountGroups: Record<string, GLEntry[]> = {};
      result.exact.forEach(entry => {
        if (!accountGroups[entry.account]) {
          accountGroups[entry.account] = [];
        }
        accountGroups[entry.account].push(entry);
      });
      
      // Create rules for each account
      Object.entries(accountGroups).forEach(([account, entries]) => {
        const regexParts = entries.map(entry => createRegexFromText(entry.text));
        const regex = regexParts.length === 1 
          ? regexParts[0] 
          : `(${regexParts.join('|')})`;
        
        rules.push({
          account,
          code: internalCode,
          strategy: 'exclusive',
          weight: 10,
          regex,
          priority: 1
        });
      });
    }
  });
  
  return rules;
}