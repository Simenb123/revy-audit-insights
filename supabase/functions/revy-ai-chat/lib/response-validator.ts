
export function validateAIResponse(response: string): { isValid: boolean; fixedResponse?: string } {
  console.log('🔍 Validating AI response format...');
  
  // Check if response has the required EMNER section with proper format
  const hasEmnerSection = /🏷️\s*\*\*[Ee][Mm][Nn][Ee][Rr]:?\*\*\s*.+/.test(response);
  
  if (hasEmnerSection) {
    console.log('✅ Response has valid EMNER section with content');
    return { isValid: true };
  }
  
  console.log('🔧 Response missing proper EMNER section, forcing comprehensive tag injection...');
  
  // FORCE intelligent tag injection based on content analysis
  const intelligentTags = extractComprehensiveTags(response);
  
  // Ensure we always have at least 3 relevant tags
  const finalTags = intelligentTags.length >= 3 ? intelligentTags : [
    ...intelligentTags,
    'Revisjon',
    'Fagstoff',
    'Regnskap'
  ].slice(0, 6);
  
  const fixedResponse = response.trim() + '\n\n🏷️ **EMNER:** ' + finalTags.join(', ');
  console.log('✅ FORCED comprehensive tag injection complete with tags:', finalTags);
  return { isValid: true, fixedResponse };
}

function extractComprehensiveTags(response: string): string[] {
  const tags: string[] = [];
  const responseText = response.toLowerCase();
  
  // Enhanced comprehensive mapping with more keywords and better coverage
  const comprehensiveTagMappings = [
    // Core audit and revision terms
    { keywords: ['revisjon', 'revisor', 'audit', 'kontroll', 'prüfung'], tags: ['Revisjon', 'Revisjonsarbeid'] },
    { keywords: ['inntekt', 'omsetning', 'salg', 'revenue', 'income'], tags: ['Inntekter', 'Inntektsføring', 'Salg'] },
    { keywords: ['isa 315', 'isa315', 'risiko', 'risk assessment'], tags: ['ISA 315', 'Risikovurdering'] },
    { keywords: ['isa 230', 'isa230', 'dokumentasjon', 'documentation'], tags: ['ISA 230', 'Dokumentasjon'] },
    { keywords: ['isa 240', 'isa240', 'fraud', 'misligheter'], tags: ['ISA 240', 'Misligheter'] },
    { keywords: ['materialitet', 'materiality', 'vesentlig'], tags: ['Materialitet', 'Vesentlighet'] },
    { keywords: ['planlegging', 'planning', 'plan'], tags: ['Planlegging', 'Revisjonsplanlegging'] },
    { keywords: ['testing', 'test', 'prøving', 'prosedyre'], tags: ['Testing', 'Revisjonshandlinger'] },
    { keywords: ['lønn', 'personal', 'salary', 'ansatte'], tags: ['Lønn', 'Personalkostnader'] },
    { keywords: ['varelager', 'inventory', 'lager'], tags: ['Varelager', 'Lagerkontroll'] },
    { keywords: ['kundefordringer', 'receivables', 'fordringer'], tags: ['Kundefordringer', 'Fordringer'] },
    { keywords: ['mva', 'avgift', 'tax', 'skatt'], tags: ['MVA', 'Avgifter'] },
    { keywords: ['årsavslutning', 'year-end', 'årsslutt'], tags: ['Årsavslutning', 'Regnskapsavslutning'] },
    { keywords: ['regnskaps', 'accounting', 'bokføring'], tags: ['Regnskap', 'Regnskapsføring'] },
    { keywords: ['feilinformasjon', 'misstatement', 'feil'], tags: ['Feilinformasjon', 'Revisjonsrisiko'] },
    { keywords: ['verdsettelse', 'valuation', 'verdivurdering'], tags: ['Verdsettelse', 'Verdivurdering'] },
    { keywords: ['gjeld', 'liabilities', 'forpliktelser'], tags: ['Gjeld', 'Forpliktelser'] },
    { keywords: ['eiendeler', 'assets', 'aktiva'], tags: ['Eiendeler', 'Aktiva'] },
    { keywords: ['egenkapital', 'equity', 'kapital'], tags: ['Egenkapital', 'Kapital'] },
    { keywords: ['kontant', 'cash', 'bank', 'likvider'], tags: ['Kontanter', 'Bank', 'Likvider'] },
    { keywords: ['standard', 'isa', 'retningslinjer'], tags: ['ISA', 'Standarder'] },
    { keywords: ['intern kontroll', 'internal control', 'kontrollsystem'], tags: ['Interne kontroller', 'Kontrollsystemer'] },
    { keywords: ['ledelse', 'management', 'styring'], tags: ['Ledelse', 'Selskapsstyring'] },
    { keywords: ['bransje', 'industry', 'sektor'], tags: ['Bransjeforståelse', 'Bransjekunnskap'] },
    { keywords: ['it-system', 'datasystem', 'teknologi'], tags: ['IT-systemer', 'Teknologi'] },
    { keywords: ['utvalg', 'sampling', 'stikkprøve'], tags: ['Utvalg', 'Stikkprøver'] },
    { keywords: ['konklusjon', 'conclusion', 'vurdering'], tags: ['Konklusjoner', 'Revisjonskonklusjon'] },
    { keywords: ['første', 'ny', 'start', 'begynne'], tags: ['Nybegynner', 'Grunnleggende'] },
    { keywords: ['hjelp', 'veiledning', 'guide'], tags: ['Veiledning', 'Fagstøtte'] }
  ];
  
  // Analyze content with enhanced keyword matching
  for (const mapping of comprehensiveTagMappings) {
    const hasKeyword = mapping.keywords.some(keyword => {
      // More flexible keyword matching
      return responseText.includes(keyword) || 
             responseText.includes(keyword.replace(/\s+/g, '')) ||
             responseText.includes(keyword.replace('-', ' '));
    });
    if (hasKeyword) {
      tags.push(...mapping.tags);
    }
  }
  
  // Remove duplicates and prioritize most relevant tags
  const uniqueTags = [...new Set(tags)];
  
  // If we found specific tags, return top 6
  if (uniqueTags.length > 0) {
    return uniqueTags.slice(0, 6);
  }
  
  // Context-based intelligent fallback based on content analysis
  if (responseText.includes('spørsmål') || responseText.includes('hjelp')) {
    return ['Fagspørsmål', 'Veiledning', 'Revisjon'];
  }
  
  if (responseText.includes('start') || responseText.includes('begynn') || responseText.includes('første')) {
    return ['Nybegynner', 'Grunnleggende', 'Revisjon'];
  }
  
  // Ultimate comprehensive fallback - always return meaningful tags
  return ['Revisjon', 'Fagstoff', 'Regnskap'];
}
