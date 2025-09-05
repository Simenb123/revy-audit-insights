/**
 * Comprehensive Norwegian payroll keyword library
 * Used for enhanced name-based auto-mapping with fuzzy matching support
 */

export interface KeywordRule {
  keywords: string[];
  variations: string[]; // Common misspellings and variations
  a07Codes: string[]; // Corresponding A07 codes
  weight: number; // Confidence weight (1-5)
  category: string; // Grouping for organization
}

// Core payroll keywords with Norwegian variations and common misspellings
export const PAYROLL_KEYWORD_RULES: KeywordRule[] = [
  // Basic salary terms
  {
    keywords: ['fastlønn', 'fast lønn', 'grunnlønn', 'månedslønn'],
    variations: ['fast lön', 'fastlön', 'grunn lønn', 'måneds lønn', 'månedslon'],
    a07Codes: ['fastLonn', 'grunnlonn'],
    weight: 5,
    category: 'grunnlønn'
  },
  {
    keywords: ['timelønn', 'time lønn', 'timerlønn', 'timebetaling'],
    variations: ['time lön', 'timelön', 'timer lønn', 'time betaling'],
    a07Codes: ['timeLonn', 'variabelLonn'],
    weight: 4,
    category: 'variabel'
  },
  
  // Vehicle allowances
  {
    keywords: ['bilgodtgjørelse', 'bil godtgjørelse', 'kjøregodtgjørelse', 'reisegodtgjørelse'],
    variations: ['bil godtgjörelse', 'kjöre godtgjörelse', 'reise godtgjörelse', 'bilgodtgjörelse'],
    a07Codes: ['bilGodtgjorelse', 'reiseGodtgjorelse'],
    weight: 5,
    category: 'godtgjørelser'
  },
  {
    keywords: ['kilometergodtgjørelse', 'km godtgjørelse', 'kilometer godtgjørelse'],
    variations: ['km godtgjörelse', 'kilometer godtgjörelse'],
    a07Codes: ['bilGodtgjorelse'],
    weight: 5,
    category: 'godtgjørelser'
  },
  
  // Overtime and supplements
  {
    keywords: ['overtid', 'overtidsbetaling', 'overtidstillegg', 'overtidslønn'],
    variations: ['over tid', 'overtids betaling', 'overtids tillegg', 'overtids lønn'],
    a07Codes: ['overtidstillegg', 'variabelLonn'],
    weight: 4,
    category: 'tillegg'
  },
  {
    keywords: ['skifttillegg', 'skift tillegg', 'turnustillegg', 'turnus tillegg'],
    variations: ['skifte tillegg', 'turnus-tillegg'],
    a07Codes: ['skifttillegg', 'variabelLonn'],
    weight: 4,
    category: 'tillegg'
  },
  {
    keywords: ['helgetillegg', 'helge tillegg', 'søndagstillegg', 'helligdagstillegg'],
    variations: ['helge-tillegg', 'söndag tillegg', 'helligdag tillegg'],
    a07Codes: ['helgetillegg', 'variabelLonn'],
    weight: 4,
    category: 'tillegg'
  },
  {
    keywords: ['kveldstillegg', 'kveld tillegg', 'natttillegg', 'natt tillegg'],
    variations: ['kveld-tillegg', 'natt-tillegg'],
    a07Codes: ['kveldstillegg', 'natttillegg', 'variabelLonn'],
    weight: 4,
    category: 'tillegg'
  },
  
  // Bonuses and incentives
  {
    keywords: ['bonus', 'bonusutbetaling', 'provisjon', 'tantieme'],
    variations: ['bonus utbetaling', 'provisjoner'],
    a07Codes: ['bonus', 'provisjon', 'variabelLonn'],
    weight: 4,
    category: 'bonus'
  },
  {
    keywords: ['resultatbonus', 'resultat bonus', 'prestasjonsbonus', 'prestasjon bonus'],
    variations: ['resultat-bonus', 'prestasjon-bonus'],
    a07Codes: ['bonus', 'variabelLonn'],
    weight: 4,
    category: 'bonus'
  },
  
  // Holiday and vacation pay
  {
    keywords: ['feriepenger', 'ferie penger', 'ferielønn', 'ferie lønn'],
    variations: ['ferie-penger', 'ferie-lønn'],
    a07Codes: ['feriepenger'],
    weight: 5,
    category: 'ferie'
  },
  {
    keywords: ['avviklingsferie', 'avvikling ferie', 'ferietrekk', 'ferie trekk'],
    variations: ['avvikling-ferie', 'ferie-trekk'],
    a07Codes: ['feriepenger', 'ferietrekk'],
    weight: 4,
    category: 'ferie'
  },
  
  // Sick pay and benefits
  {
    keywords: ['sykepenger', 'syke penger', 'sykelønn', 'syke lønn'],
    variations: ['syke-penger', 'syke-lønn'],
    a07Codes: ['sykepenger'],
    weight: 5,
    category: 'ytelser'
  },
  {
    keywords: ['foreldrepenger', 'foreldre penger', 'foreldrelønn', 'foreldre lønn'],
    variations: ['foreldre-penger', 'foreldre-lønn'],
    a07Codes: ['foreldrepenger'],
    weight: 5,
    category: 'ytelser'
  },
  
  // Deductions
  {
    keywords: ['skattetrekk', 'skatte trekk', 'forskuddsskatt', 'forskudds skatt'],
    variations: ['skatte-trekk', 'forskudds-skatt'],
    a07Codes: ['skattetrekk'],
    weight: 5,
    category: 'trekk'
  },
  {
    keywords: ['pensjon', 'pensjonspremie', 'pensjonstrekk', 'tjenestepensjon'],
    variations: ['pensjon premie', 'pensjon trekk', 'tjeneste pensjon'],
    a07Codes: ['pensjon', 'pensjonstrekk'],
    weight: 4,
    category: 'trekk'
  },
  {
    keywords: ['fagforeningskontingent', 'fagforening kontingent', 'fagforeningsavgift'],
    variations: ['fagforening avgift', 'fagforening-kontingent'],
    a07Codes: ['fagforeningskontingent'],
    weight: 4,
    category: 'trekk'
  },
  
  // Other allowances
  {
    keywords: ['kostgodtgjørelse', 'kost godtgjørelse', 'kostpenger', 'kost penger'],
    variations: ['kost godtgjörelse', 'kost-godtgjörelse', 'kost-penger'],
    a07Codes: ['kostGodtgjorelse'],
    weight: 4,
    category: 'godtgjørelser'
  },
  {
    keywords: ['telefongodtgjørelse', 'telefon godtgjørelse', 'telefondekning'],
    variations: ['telefon godtgjörelse', 'telefon-godtgjörelse'],
    a07Codes: ['telefonGodtgjorelse'],
    weight: 4,
    category: 'godtgjørelser'
  },
  {
    keywords: ['hjemmekontor', 'hjemme kontor', 'hjemmekontorgodtgjørelse'],
    variations: ['hjemme-kontor', 'hjemmekontor godtgjörelse'],
    a07Codes: ['hjemmekontorGodtgjorelse'],
    weight: 4,
    category: 'godtgjørelser'
  },
  
  // Special categories
  {
    keywords: ['sluttvederlag', 'sluttbonus', 'fratredelsesytelse'],
    variations: ['slutt vederlag', 'slutt bonus', 'fratredelse ytelse'],
    a07Codes: ['sluttvederlag'],
    weight: 4,
    category: 'spesielt'
  },
  {
    keywords: ['gavekort', 'gave kort', 'naturalytelse', 'natural ytelse'],
    variations: ['gave-kort', 'natural-ytelse'],
    a07Codes: ['naturalytelse'],
    weight: 3,
    category: 'spesielt'
  }
];

/**
 * Get all keywords as a flat array for fuzzy search
 */
export function getAllKeywords(): string[] {
  const allKeywords: string[] = [];
  
  PAYROLL_KEYWORD_RULES.forEach(rule => {
    allKeywords.push(...rule.keywords);
    allKeywords.push(...rule.variations);
  });
  
  return [...new Set(allKeywords)]; // Remove duplicates
}

/**
 * Find matching keyword rules for a given text
 */
export function findMatchingKeywordRules(text: string, threshold: number = 0.8): KeywordRule[] {
  const normalizedText = text.toLowerCase().trim();
  const matches: { rule: KeywordRule; score: number }[] = [];
  
  PAYROLL_KEYWORD_RULES.forEach(rule => {
    let bestScore = 0;
    
    // Check exact keyword matches
    [...rule.keywords, ...rule.variations].forEach(keyword => {
      const normalizedKeyword = keyword.toLowerCase();
      
      // Exact match
      if (normalizedText.includes(normalizedKeyword)) {
        bestScore = Math.max(bestScore, 1.0);
      }
      // Partial match (for compound words)
      else if (normalizedKeyword.length > 4) {
        const words = normalizedKeyword.split(/[\s-]/);
        const matchingWords = words.filter(word => 
          word.length > 2 && normalizedText.includes(word)
        );
        if (matchingWords.length > 0) {
          bestScore = Math.max(bestScore, matchingWords.length / words.length * 0.8);
        }
      }
    });
    
    if (bestScore >= threshold) {
      matches.push({ rule, score: bestScore });
    }
  });
  
  // Sort by score (highest first) and weight
  matches.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    return b.rule.weight - a.rule.weight;
  });
  
  return matches.map(m => m.rule);
}

/**
 * Get suggested A07 codes for a text with confidence scores
 */
export function getSuggestedA07Codes(text: string): Array<{ code: string; confidence: number; reason: string }> {
  const matchingRules = findMatchingKeywordRules(text, 0.6);
  const suggestions: Array<{ code: string; confidence: number; reason: string }> = [];
  
  matchingRules.forEach(rule => {
    rule.a07Codes.forEach(code => {
      const existingSuggestion = suggestions.find(s => s.code === code);
      const confidence = rule.weight / 5; // Normalize to 0-1
      
      if (existingSuggestion) {
        // Boost confidence if multiple rules suggest the same code
        existingSuggestion.confidence = Math.min(1, existingSuggestion.confidence + confidence * 0.3);
        existingSuggestion.reason += `, ${rule.category}`;
      } else {
        suggestions.push({
          code,
          confidence,
          reason: `Matcher på: ${rule.category} (${rule.keywords[0]})`
        });
      }
    });
  });
  
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}
