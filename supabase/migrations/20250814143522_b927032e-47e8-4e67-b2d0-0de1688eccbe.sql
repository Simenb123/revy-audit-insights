-- Migrate hardcoded formulas from edge function to database as system formulas
-- First insert from KPI Library (static data)

INSERT INTO formula_definitions (
  name,
  description,
  formula_expression,
  category,
  is_system_formula,
  version,
  is_active,
  metadata
) VALUES 
-- Profitability KPIs
(
  'gross_margin',
  'Bruttomargin - måler hvor mye av inntektene som blir igjen etter direkte kostnader',
  '{"type": "calculation", "expression": "[19] / [10-15] * 100", "resultType": "percentage"}',
  'profitability',
  true,
  1,
  true,
  '{"category": "profitability", "displayAsPercentage": true, "interpretation": "Høyere verdi er bedre. Viser selskapets evne til å generere profit fra salg før indirekte kostnader.", "benchmarks": {"poor": 20, "fair": 30, "good": 40, "excellent": 50}}'
),
(
  'operating_margin',
  'Driftsmargin - måler lønnsomheten av kjernevirksomheten',
  '{"type": "calculation", "expression": "[29] / [10-15] * 100", "resultType": "percentage"}',
  'profitability',
  true,
  1,
  true,
  '{"category": "profitability", "displayAsPercentage": true, "interpretation": "Viser hvor mye av inntektene som blir til driftsresultat. Høyere verdi indikerer bedre operasjonell effektivitet.", "benchmarks": {"poor": 5, "fair": 10, "good": 15, "excellent": 20}}'
),
(
  'net_margin',
  'Nettoresultatmargin - måler den totale lønnsomheten',
  '{"type": "calculation", "expression": "[79] / [10-15] * 100", "resultType": "percentage"}',
  'profitability',
  true,
  1,
  true,
  '{"category": "profitability", "displayAsPercentage": true, "interpretation": "Den endelige lønnsomheten etter alle kostnader og inntekter. Viser selskapets samlede evne til å generere overskudd.", "benchmarks": {"poor": 2, "fair": 5, "good": 8, "excellent": 12}}'
),
(
  'return_on_assets',
  'Totalkapitalrentabilitet - måler hvor effektivt eiendeler brukes',
  '{"type": "calculation", "expression": "[79] / ([500-599] + [600-699]) * 100", "resultType": "percentage"}',
  'profitability',
  true,
  1,
  true,
  '{"category": "profitability", "displayAsPercentage": true, "interpretation": "Viser hvor mye avkastning selskapet genererer på sine totale eiendeler. Høyere verdi indikerer mer effektiv bruk av kapital.", "benchmarks": {"poor": 3, "fair": 6, "good": 10, "excellent": 15}}'
),
(
  'return_on_equity',
  'Egenkapitalrentabilitet - måler avkastning for eierne',
  '{"type": "calculation", "expression": "[79] / [670-705] * 100", "resultType": "percentage"}',
  'profitability',
  true,
  1,
  true,
  '{"category": "profitability", "displayAsPercentage": true, "interpretation": "Viser hvor mye avkastning eierne får på sin investerte kapital. Sammenlign med alternative investeringer.", "benchmarks": {"poor": 5, "fair": 10, "good": 15, "excellent": 20}}'
),

-- Liquidity KPIs
(
  'current_ratio',
  'Likviditetsgrad 1 - måler kortsiktig betalingsevne',
  '{"type": "calculation", "expression": "[605-655] / [780-799]", "resultType": "ratio"}',
  'liquidity',
  true,
  1,
  true,
  '{"category": "liquidity", "displayAsPercentage": false, "interpretation": "Måler selskapets evne til å betale kortsiktig gjeld. Verdier over 2 er generelt bra, men avhenger av bransje.", "benchmarks": {"poor": 1.0, "fair": 1.5, "good": 2.0, "excellent": 2.5}}'
),
(
  'quick_ratio',
  'Likviditetsgrad 2 - måler umiddelbar betalingsevne',
  '{"type": "calculation", "expression": "([605-655] - [610-615]) / [780-799]", "resultType": "ratio"}',
  'liquidity',
  true,
  1,
  true,
  '{"category": "liquidity", "displayAsPercentage": false, "interpretation": "Likviditetsgrad 1 minus varelager. Viser evne til å dekke kortsiktig gjeld uten å selge varelager.", "benchmarks": {"poor": 0.5, "fair": 0.8, "good": 1.0, "excellent": 1.2}}'
),
(
  'cash_ratio',
  'Kontantgrad - måler tilgjengelig kontanter mot kortsiktig gjeld',
  '{"type": "calculation", "expression": "[655] / [780-799]", "resultType": "ratio"}',
  'liquidity',
  true,
  1,
  true,
  '{"category": "liquidity", "displayAsPercentage": false, "interpretation": "Viser hvor stor del av kortsiktig gjeld som kan dekkes med kontanter og kontantekvivalenter.", "benchmarks": {"poor": 0.1, "fair": 0.2, "good": 0.3, "excellent": 0.5}}'
),

-- Solvency KPIs  
(
  'equity_ratio',
  'Egenkapitalandel - måler finansiell soliditet',
  '{"type": "calculation", "expression": "[670-705] / ([500-599] + [600-699]) * 100", "resultType": "percentage"}',
  'solvency',
  true,
  1,
  true,
  '{"category": "solvency", "displayAsPercentage": true, "interpretation": "Viser hvor stor del av eiendelene som er finansiert med egenkapital. Høyere verdi indikerer lavere finansiell risiko.", "benchmarks": {"poor": 20, "fair": 30, "good": 40, "excellent": 50}}'
),
(
  'debt_ratio',
  'Gjeldsgrad - måler total gjeld i forhold til eiendeler',
  '{"type": "calculation", "expression": "[710-899] / ([500-599] + [600-699]) * 100", "resultType": "percentage"}',
  'solvency',
  true,
  1,
  true,
  '{"category": "solvency", "displayAsPercentage": true, "interpretation": "Viser hvor stor del av eiendelene som er finansiert med gjeld. Lavere verdi indikerer lavere finansiell risiko.", "benchmarks": {"excellent": 30, "good": 50, "fair": 70, "poor": 80}}'
),
(
  'debt_to_equity',
  'Gjeld til egenkapital - måler gearing',
  '{"type": "calculation", "expression": "[710-899] / [670-705]", "resultType": "ratio"}',
  'solvency',
  true,
  1,
  true,
  '{"category": "solvency", "displayAsPercentage": false, "interpretation": "Viser forholdet mellom total gjeld og egenkapital. Lavere verdi indikerer lavere finansiell risiko.", "benchmarks": {"excellent": 0.5, "good": 1.0, "fair": 1.5, "poor": 2.0}}'
),

-- Efficiency KPIs
(
  'asset_turnover',
  'Kapitalomløpshastighet - måler effektivitet i bruk av eiendeler',
  '{"type": "calculation", "expression": "[10-15] / ([500-599] + [600-699])", "resultType": "ratio"}',
  'efficiency',
  true,
  1,
  true,
  '{"category": "efficiency", "displayAsPercentage": false, "interpretation": "Viser hvor mye omsetning selskapet genererer per krone investert i eiendeler. Høyere verdi er bedre.", "benchmarks": {"poor": 0.5, "fair": 1.0, "good": 1.5, "excellent": 2.0}}'
),
(
  'receivables_turnover',
  'Kundefordringer omløpshastighet - måler innkrevingseffektivitet',
  '{"type": "calculation", "expression": "[10-15] / [618]", "resultType": "ratio"}',
  'efficiency',
  true,
  1,
  true,
  '{"category": "efficiency", "displayAsPercentage": false, "interpretation": "Viser hvor raskt selskapet krever inn kundefordringer. Høyere verdi indikerer raskere innkreving.", "benchmarks": {"poor": 3, "fair": 6, "good": 10, "excellent": 15}}'
),
(
  'inventory_turnover',
  'Lageromløpshastighet - måler hvor raskt lager selges',
  '{"type": "calculation", "expression": "[19] / [610-615]", "resultType": "ratio"}',
  'efficiency',
  true,
  1,
  true,
  '{"category": "efficiency", "displayAsPercentage": false, "interpretation": "Viser hvor mange ganger varelageret omsettes i året. Høyere verdi indikerer mer effektiv lagerstyring.", "benchmarks": {"poor": 2, "fair": 4, "good": 6, "excellent": 10}}'
),

-- Growth KPIs
(
  'revenue_growth',
  'Omsetningsvekst - måler vekst i inntekter',
  '{"type": "comparison", "expression": "([10-15]_current - [10-15]_previous) / [10-15]_previous * 100", "resultType": "percentage"}',
  'growth',
  true,
  1,
  true,
  '{"category": "growth", "displayAsPercentage": true, "interpretation": "Viser prosentvis vekst i omsetning fra forrige periode. Positiv vekst indikerer ekspansjon.", "benchmarks": {"poor": 0, "fair": 5, "good": 10, "excellent": 20}}'
),

-- Migrate hardcoded formulas from edge function
(
  'liquidity_ratio_hardcoded',
  'Likviditetsgrad (legacy) - omløpsmidler delt på kortsiktig gjeld',
  '{"type": "hardcoded", "name": "liquidity_ratio", "expression": "(Current Assets) / (Current Liabilities)", "resultType": "ratio"}',
  'liquidity',
  true,
  1,
  true,
  '{"category": "liquidity", "source": "hardcoded", "displayAsPercentage": false}'
),
(
  'equity_ratio_hardcoded',
  'Egenkapitalandel (legacy) - egenkapital delt på totale eiendeler',
  '{"type": "hardcoded", "name": "equity_ratio", "expression": "(Total Equity / Total Assets) * 100", "resultType": "percentage"}',
  'solvency',
  true,
  1,
  true,
  '{"category": "solvency", "source": "hardcoded", "displayAsPercentage": true}'
),
(
  'profit_margin_hardcoded',
  'Driftsmargin (legacy) - driftsresultat delt på omsetning',
  '{"type": "hardcoded", "name": "profit_margin", "expression": "(Operating Result / Revenue) * 100", "resultType": "percentage"}',
  'profitability',
  true,
  1,
  true,
  '{"category": "profitability", "source": "hardcoded", "displayAsPercentage": true}'
),
(
  'operating_result_hardcoded', 
  'Driftsresultat (legacy) - omsetning minus driftskostnader',
  '{"type": "hardcoded", "name": "operating_result", "expression": "Revenue - Operating Expenses", "resultType": "amount"}',
  'profitability',
  true,
  1,
  true,
  '{"category": "profitability", "source": "hardcoded", "displayAsPercentage": false}'
);

-- Create formula variables for commonly used account groups
INSERT INTO formula_variables (
  name,
  display_name,
  description,
  variable_type,
  value_expression,
  data_type,
  category,
  is_system_variable,
  is_active,
  metadata
) VALUES
(
  'total_revenue',
  'Total omsetning',
  'Sum av alle inntektskontoer (10-15)',
  'calculated',
  '{"expression": "[10-15]", "accounts": ["10", "11", "12", "13", "14", "15"]}',
  'currency',
  'revenue',
  true,
  true,
  '{"description": "Samlet omsetning fra alle inntektskilder"}'
),
(
  'total_operating_costs',
  'Totale driftskostnader',
  'Sum av alle driftskostrelaterte kontoer (20-70)',
  'calculated',
  '{"expression": "[20-70]", "accounts": ["20", "30", "40", "50", "60", "70"]}',
  'currency',
  'costs',
  true,
  true,
  '{"description": "Alle driftsrelaterte kostnader"}'
),
(
  'current_assets',
  'Omløpsmidler',
  'Sum av omløpsmidler (605-655)',
  'calculated',
  '{"expression": "[605-655]", "accounts": ["605", "610", "615", "618", "655"]}',
  'currency',
  'assets',
  true,
  true,
  '{"description": "Eiendeler som kan konverteres til kontanter innen ett år"}'
),
(
  'current_liabilities',
  'Kortsiktig gjeld',
  'Sum av kortsiktig gjeld (780-799)',
  'calculated',
  '{"expression": "[780-799]", "accounts": ["780", "790", "795", "799"]}',
  'currency',
  'liabilities',
  true,
  true,
  '{"description": "Gjeld som forfaller innen ett år"}'
),
(
  'total_equity',
  'Total egenkapital',
  'Sum av egenkapital (670-705)',
  'calculated',
  '{"expression": "[670-705]", "accounts": ["670", "680", "681", "690", "695", "700", "705"]}',
  'currency',
  'equity',
  true,
  true,
  '{"description": "Eiers totale eierandel i selskapet"}'
),
(
  'total_assets',
  'Totale eiendeler',
  'Sum av alle eiendeler (500-699)',
  'calculated',
  '{"expression": "[500-699]", "accounts": ["500", "600"]}',
  'currency',
  'assets',
  true,
  true,
  '{"description": "Alle eiendeler selskapet kontrollerer"}'
);