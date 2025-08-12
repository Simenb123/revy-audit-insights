import { useMemo } from 'react';
import { StandardAccountOption } from './types';

interface Params {
  accountNumber?: string;
  accountName?: string;
  options: StandardAccountOption[];
  limit?: number;
  query?: string;
}

const TARGET_NUMBERS_FOR_LOAN = ['570', '591', '615', '618', '650'];

const KEYWORD_GROUPS: Array<{ keys: string[]; weight: number }> = [
  { keys: ['lån', 'låne'], weight: 3 },
  { keys: ['fordring', 'fordringer'], weight: 3 },
  { keys: ['konsern'], weight: 2 },
  { keys: ['aksje', 'aksjer', 'investering', 'obligasjon', 'obligasjoner'], weight: 2 },
  { keys: ['kunde', 'kunder', 'bank'], weight: 1 },
  { keys: ['leverandør', 'leverandører'], weight: 1 },
];

const norm = (s?: string) => (s || '').toLowerCase();

const toNum = (sn: string) => parseInt(String(sn).replace(/[^\d]/g, ''), 10) || 0;

export function useMappingSuggestions({ accountNumber, accountName, options, limit = 5, query }: Params) {
  return useMemo(() => {
    if (!accountName || (query && query.trim().length > 0)) return [] as StandardAccountOption[];

    const name = norm(accountName);
    const accNum = toNum(accountNumber || '');
    const in1300Range = accNum >= 1300 && accNum < 1400;
    const hasLoanContext = /\b(lån|fordring|konsern)\b/.test(name) || in1300Range;

    const tokens = name.split(/\s+/).filter(Boolean);

    const scored = options.map((opt) => {
      const optName = norm(opt.standard_name);
      let score = 0;

      // Keyword matches boost
      for (const grp of KEYWORD_GROUPS) {
        const tokenHit = grp.keys.some((k) => tokens.some((t) => t.includes(k)));
        const nameHit = grp.keys.some((k) => optName.includes(k));
        if (tokenHit && nameHit) score += grp.weight;
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


      return { opt, score };
    });

    const filtered = scored.filter((x) => x.score > 0)
      .sort((a, b) => (b.score - a.score) || (toNum(a.opt.standard_number) - toNum(b.opt.standard_number)))
      .slice(0, limit)
      .map((x) => x.opt);

    return filtered;
  }, [accountName, options, limit, query, accountNumber]);
}
