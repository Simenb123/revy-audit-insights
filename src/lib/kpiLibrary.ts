/**
 * KPI Library - Standard financial formulas and metrics
 */

export interface KpiDefinition {
  id: string;
  name: string;
  description: string;
  category: 'profitability' | 'liquidity' | 'solvency' | 'efficiency' | 'growth';
  formula: {
    type: 'formula';
    terms: Array<{
      id: string;
      type: 'account' | 'constant' | 'parenthesis';
      account?: string;
      operator?: '+' | '-' | '*' | '/';
      constant?: number;
      parenthesis?: 'open' | 'close';
    }>;
    metadata?: {
      description: string;
      category: string;
    };
  };
  displayAsPercentage: boolean;
  showCurrency: boolean;
  unitScale?: 'none' | 'thousand' | 'million';
  interpretation?: string;
  benchmarks?: {
    excellent: number;
    good: number;
    poor: number;
  };
}

export const KPI_CATEGORIES = {
  profitability: {
    name: 'Lønnsomhet',
    description: 'Måler hvor effektivt selskapet genererer overskudd'
  },
  liquidity: {
    name: 'Likviditet', 
    description: 'Måler selskapets evne til å dekke kortsiktige forpliktelser'
  },
  solvency: {
    name: 'Soliditet',
    description: 'Måler selskapets finansielle stabilitet og gjeldsgrad'
  },
  efficiency: {
    name: 'Effektivitet',
    description: 'Måler hvor effektivt selskapet bruker sine ressurser'
  },
  growth: {
    name: 'Vekst',
    description: 'Måler selskapets utvikling over tid'
  }
} as const;

export const KPI_LIBRARY: KpiDefinition[] = [
  // LØNNSOMHET
  {
    id: 'gross_margin',
    name: 'Bruttofortjenestegrad',
    description: 'Bruttofortjeneste i prosent av omsetning',
    category: 'profitability',
    formula: {
      type: 'formula',
      terms: [
        { id: '1', type: 'account', account: '3000' },
        { id: '2', type: 'account', account: '4000', operator: '-' },
        { id: '3', type: 'account', account: '3000', operator: '/' },
        { id: '4', type: 'constant', constant: 100, operator: '*' }
      ],
      metadata: { description: 'Bruttofortjenestegrad beregning', category: 'profitability' }
    },
    displayAsPercentage: true,
    showCurrency: false,
    interpretation: 'Høyere verdi er bedre. Viser hvor mye selskapet tjener på hvert solgte produkt før andre kostnader.',
    benchmarks: { excellent: 40, good: 25, poor: 10 }
  },
  {
    id: 'operating_margin',
    name: 'Driftsmargin',
    description: 'Driftsresultat i prosent av omsetning',
    category: 'profitability',
    formula: {
      type: 'formula',
      terms: [
        { id: '1', type: 'account', account: '3000' },
        { id: '2', type: 'account', account: '4000', operator: '-' },
        { id: '3', type: 'account', account: '5000', operator: '-' },
        { id: '4', type: 'account', account: '6000', operator: '-' },
        { id: '5', type: 'account', account: '3000', operator: '/' },
        { id: '6', type: 'constant', constant: 100, operator: '*' }
      ],
      metadata: { description: 'Driftsmargin beregning', category: 'profitability' }
    },
    displayAsPercentage: true,
    showCurrency: false,
    interpretation: 'Viser lønnsomheten i kjernevirksomheten. Høyere verdi er bedre.',
    benchmarks: { excellent: 15, good: 8, poor: 2 }
  },
  {
    id: 'net_margin',
    name: 'Nettoresultatmargin',
    description: 'Nettoresultat i prosent av omsetning',
    category: 'profitability',
    formula: {
      type: 'formula',
      terms: [
        { id: '1', type: 'account', account: '8000' },
        { id: '2', type: 'account', account: '3000', operator: '/' },
        { id: '3', type: 'constant', constant: 100, operator: '*' }
      ],
      metadata: { description: 'Nettoresultatmargin beregning', category: 'profitability' }
    },
    displayAsPercentage: true,
    showCurrency: false,
    interpretation: 'Total lønnsomhet etter alle kostnader og inntekter. Høyere verdi er bedre.',
    benchmarks: { excellent: 10, good: 5, poor: 1 }
  },

  // LIKVIDITET
  {
    id: 'current_ratio',
    name: 'Likviditetsgrad 1',
    description: 'Omløpsmidler delt på kortsiktig gjeld',
    category: 'liquidity',
    formula: {
      type: 'formula',
      terms: [
        { id: '1', type: 'account', account: '1500' },
        { id: '2', type: 'account', account: '2500', operator: '/' }
      ],
      metadata: { description: 'Likviditetsgrad 1 beregning', category: 'liquidity' }
    },
    displayAsPercentage: false,
    showCurrency: false,
    interpretation: 'Måler evnen til å dekke kortsiktige forpliktelser. Verdier mellom 1-2 er optimalt.',
    benchmarks: { excellent: 2.0, good: 1.2, poor: 0.8 }
  },
  {
    id: 'quick_ratio',
    name: 'Likviditetsgrad 2',
    description: 'Mest likvide omløpsmidler delt på kortsiktig gjeld',
    category: 'liquidity',
    formula: {
      type: 'formula',
      terms: [
        { id: '1', type: 'account', account: '1900' },
        { id: '2', type: 'account', account: '1800', operator: '+' },
        { id: '3', type: 'account', account: '1700', operator: '+' },
        { id: '4', type: 'account', account: '2500', operator: '/' }
      ],
      metadata: { description: 'Likviditetsgrad 2 beregning', category: 'liquidity' }
    },
    displayAsPercentage: false,
    showCurrency: false,
    interpretation: 'Strengere likviditetsmål som ekskluderer mindre likvide aktiva som lager.',
    benchmarks: { excellent: 1.5, good: 1.0, poor: 0.6 }
  },

  // SOLIDITET
  {
    id: 'equity_ratio',
    name: 'Egenkapitalandel',
    description: 'Egenkapital i prosent av totalkapital',
    category: 'solvency',
    formula: {
      type: 'formula',
      terms: [
        { id: '1', type: 'account', account: '2000' },
        { id: '2', type: 'account', account: '1000', operator: '/' },
        { id: '3', type: 'constant', constant: 100, operator: '*' }
      ],
      metadata: { description: 'Egenkapitalandel beregning', category: 'solvency' }
    },
    displayAsPercentage: true,
    showCurrency: false,
    interpretation: 'Måler hvor stor andel av totalkapitalen som er egenkapital. Høyere verdi gir større finansiell sikkerhet.',
    benchmarks: { excellent: 40, good: 25, poor: 15 }
  },
  {
    id: 'debt_to_equity',
    name: 'Gjeldsgrad',
    description: 'Total gjeld delt på egenkapital',
    category: 'solvency',
    formula: {
      type: 'formula',
      terms: [
        { id: '1', type: 'account', account: '2500' },
        { id: '2', type: 'account', account: '2300', operator: '+' },
        { id: '3', type: 'account', account: '2000', operator: '/' }
      ],
      metadata: { description: 'Gjeldsgrad beregning', category: 'solvency' }
    },
    displayAsPercentage: false,
    showCurrency: false,
    interpretation: 'Måler hvor mye gjeld selskapet har i forhold til egenkapitalen. Lavere verdi er generelt bedre.',
    benchmarks: { excellent: 0.5, good: 1.0, poor: 2.0 }
  },

  // EFFEKTIVITET
  {
    id: 'asset_turnover',
    name: 'Totalkapitalens omløpshastighet',
    description: 'Omsetning delt på gjennomsnittlig totalkapital',
    category: 'efficiency',
    formula: {
      type: 'formula',
      terms: [
        { id: '1', type: 'account', account: '3000' },
        { id: '2', type: 'account', account: '1000', operator: '/' }
      ],
      metadata: { description: 'Totalkapitalens omløpshastighet', category: 'efficiency' }
    },
    displayAsPercentage: false,
    showCurrency: false,
    interpretation: 'Måler hvor effektivt selskapet bruker sine aktiva til å generere omsetning.',
    benchmarks: { excellent: 2.0, good: 1.2, poor: 0.8 }
  },
  {
    id: 'inventory_turnover',
    name: 'Lageromløpshastighet',
    description: 'Vareforbruk delt på gjennomsnittlig lagerbeholdning',
    category: 'efficiency',
    formula: {
      type: 'formula',
      terms: [
        { id: '1', type: 'account', account: '4000' },
        { id: '2', type: 'account', account: '1400', operator: '/' }
      ],
      metadata: { description: 'Lageromløpshastighet', category: 'efficiency' }
    },
    displayAsPercentage: false,
    showCurrency: false,
    interpretation: 'Måler hvor raskt selskapet omsetter lageret. Høyere verdi indikerer effektiv lagerstyring.',
    benchmarks: { excellent: 12, good: 6, poor: 3 }
  }
];

/**
 * Get KPIs by category
 */
export function getKpisByCategory(category: keyof typeof KPI_CATEGORIES): KpiDefinition[] {
  return KPI_LIBRARY.filter(kpi => kpi.category === category);
}

/**
 * Get KPI by ID
 */
export function getKpiById(id: string): KpiDefinition | undefined {
  return KPI_LIBRARY.find(kpi => kpi.id === id);
}

/**
 * Search KPIs by name or description
 */
export function searchKpis(query: string): KpiDefinition[] {
  const lowercaseQuery = query.toLowerCase();
  return KPI_LIBRARY.filter(kpi => 
    kpi.name.toLowerCase().includes(lowercaseQuery) || 
    kpi.description.toLowerCase().includes(lowercaseQuery)
  );
}