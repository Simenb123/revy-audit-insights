import { useMemo } from 'react';
import { StandardAccountOption } from './types';
import Fuse from 'fuse.js';

interface Params {
  accountNumber?: string;
  accountName?: string;
  options: StandardAccountOption[];
  limit?: number;
  query?: string;
  enableFuzzy?: boolean;
  fuzzyThreshold?: number;
}

const TARGET_NUMBERS_FOR_LOAN = ['570', '591', '615', '618', '650'];

// Enhanced keyword groups with more Norwegian payroll terms
const KEYWORD_GROUPS: Array<{ keys: string[]; weight: number }> = [
  // Financial terms (existing)
  { keys: ['lån', 'låne'], weight: 3 },
  { keys: ['fordring', 'fordringer'], weight: 3 },
  { keys: ['konsern'], weight: 2 },
  { keys: ['aksje', 'aksjer', 'investering', 'obligasjon', 'obligasjoner'], weight: 2 },
  { keys: ['kunde', 'kunder', 'bank'], weight: 1 },
  { keys: ['leverandør', 'leverandører'], weight: 1 },
  
  // Enhanced payroll terms
  { keys: ['fastlønn', 'fast lønn', 'grunnlønn', 'månedslønn'], weight: 4 },
  { keys: ['timelønn', 'time lønn', 'timerlønn', 'timebetaling'], weight: 4 },
  { keys: ['overtid', 'overtidsbetaling', 'overtidstillegg'], weight: 3 },
  { keys: ['bonus', 'bonusutbetaling', 'provisjon', 'tantieme'], weight: 3 },
  { keys: ['feriepenger', 'ferie penger', 'ferielønn'], weight: 4 },
  { keys: ['sykepenger', 'syke penger', 'sykelønn'], weight: 4 },
  { keys: ['foreldrepenger', 'foreldre penger'], weight: 4 },
  { keys: ['bilgodtgjørelse', 'bil godtgjørelse', 'kjøregodtgjørelse', 'kilometergodtgjørelse'], weight: 3 },
  { keys: ['kostgodtgjørelse', 'kost godtgjørelse', 'kostpenger'], weight: 3 },
  { keys: ['telefongodtgjørelse', 'telefon godtgjørelse'], weight: 3 },
  { keys: ['skattetrekk', 'skatte trekk', 'forskuddsskatt'], weight: 4 },
  { keys: ['pensjon', 'pensjonspremie', 'pensjonstrekk'], weight: 3 },
  { keys: ['fagforeningskontingent', 'fagforening kontingent'], weight: 3 },
  { keys: ['helgetillegg', 'helge tillegg', 'søndagstillegg'], weight: 3 },
  { keys: ['kveldstillegg', 'kveld tillegg', 'natttillegg', 'natt tillegg'], weight: 3 },
  { keys: ['skifttillegg', 'skift tillegg', 'turnustillegg'], weight: 3 },
];

const norm = (s?: string) => (s || '').toLowerCase();

const toNum = (sn: string) => parseInt(String(sn).replace(/[^\d]/g, ''), 10) || 0;

export function useMappingSuggestions({ 
  accountNumber, 
  accountName, 
  options, 
  limit = 5, 
  query,
  enableFuzzy = false,
  fuzzyThreshold = 0.4
}: Params) {
  return useMemo(() => {
    if (!accountName || (query && query.trim().length > 0)) return [] as StandardAccountOption[];

    const name = norm(accountName);
    const accNum = toNum(accountNumber || '');
    const in1300Range = accNum >= 1300 && accNum < 1400;
    const hasLoanContext = /\b(lån|fordring|konsern)\b/.test(name) || in1300Range;

    const tokens = name.split(/\s+/).filter(Boolean);

    // Initialize Fuse for fuzzy matching if enabled
    let fuse: Fuse<StandardAccountOption> | null = null;
    if (enableFuzzy) {
      fuse = new Fuse(options, {
        keys: ['standard_name'],
        threshold: fuzzyThreshold,
        includeScore: true,
        includeMatches: true
      });
    }

    const scored = options.map((opt) => {
      const optName = norm(opt.standard_name);
      let score = 0;

      // Enhanced keyword matches boost with better Norwegian support
      for (const grp of KEYWORD_GROUPS) {
        const tokenHit = grp.keys.some((k) => tokens.some((t) => 
          t.includes(k) || k.includes(t) // Bidirectional matching
        ));
        const nameHit = grp.keys.some((k) => 
          optName.includes(k) || k.includes(optName) // Bidirectional matching
        );
        
        if (tokenHit && nameHit) {
          score += grp.weight;
        }
        // Partial keyword match (for compound words)
        else if (tokenHit || nameHit) {
          score += grp.weight * 0.5;
        }
      }

      // Fuzzy matching boost
      if (enableFuzzy && fuse) {
        const fuzzyResults = fuse.search(accountName);
        const fuzzyMatch = fuzzyResults.find(result => result.item.id === opt.id);
        if (fuzzyMatch && fuzzyMatch.score !== undefined) {
          const fuzzyScore = (1 - fuzzyMatch.score) * 3; // Convert to positive score
          score += fuzzyScore;
        }
      }

      // Enhanced payroll context detection
      const hasPayrollContext = /\b(lønn|tillegg|godtgjørelse|bonus|ferie|syke|pensjon|skatt|trekk)\b/.test(name);
      if (hasPayrollContext) {
        const payrollNumber = toNum(opt.standard_number);
        // Payroll accounts typically in 5xxx range
        if (payrollNumber >= 5000 && payrollNumber < 6000) {
          score += 3;
        }
        // Accrual accounts in 294x/295x range
        if (payrollNumber >= 2940 && payrollNumber <= 2959) {
          score += 2;
        }
      }

      // Specific numbers and ranges for loan/receivables context
      if (hasLoanContext) {
        if (TARGET_NUMBERS_FOR_LOAN.includes(String(opt.standard_number))) {
          score += 5;
        }
        const sn = toNum(opt.standard_number);
        if (sn >= 560 && sn <= 591) score += 4; // Long-term receivables/loans range
        if (sn >= 618 && sn <= 650) score += 4; // Short-term receivables/loans range
      }

      // Exact account number match gets highest priority
      if (accountNumber && opt.standard_number === accountNumber) {
        score += 10;
      }

      return { opt, score };
    });

    const filtered = scored
      .filter((x) => x.score > 0)
      .sort((a, b) => {
        // Primary sort by score
        if (b.score !== a.score) return b.score - a.score;
        // Secondary sort by standard number (ascending)
        return toNum(a.opt.standard_number) - toNum(b.opt.standard_number);
      })
      .slice(0, limit)
      .map((x) => x.opt);

    return filtered;
  }, [accountName, options, limit, query, accountNumber, enableFuzzy, fuzzyThreshold]);
}
