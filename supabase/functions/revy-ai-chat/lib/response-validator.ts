
export function validateAIResponse(response: string): { isValid: boolean; fixedResponse?: string } {
  console.log('🔍 Validating AI response format...');
  
  // Check if response has the required EMNER section
  const hasEmnerSection = /🏷️\s*\*\*[Ee][Mm][Nn][Ee][Rr]:?\*\*/.test(response);
  
  if (hasEmnerSection) {
    console.log('✅ Response has valid EMNER section');
    return { isValid: true };
  }
  
  console.log('🔧 Response missing EMNER section, forcing tag injection...');
  
  // FORCE tag injection - this is our main fix
  const intelligentTags = extractIntelligentTags(response);
  
  const fixedResponse = response.trim() + '\n\n🏷️ **EMNER:** ' + intelligentTags.join(', ');
  console.log('✅ FORCED tag injection complete with tags:', intelligentTags);
  return { isValid: true, fixedResponse };
}

function extractIntelligentTags(response: string): string[] {
  const tags: string[] = [];
  const responseText = response.toLowerCase();
  
  // Comprehensive mapping of content to relevant tags
  const tagMappings = [
    // Core audit terms
    { keywords: ['revisjon', 'revisor', 'audit'], tags: ['Revisjon'] },
    { keywords: ['inntekt', 'omsetning', 'salg', 'revenue'], tags: ['Inntekter', 'Inntektsføring'] },
    { keywords: ['isa', 'standard'], tags: ['ISA', 'Standarder'] },
    { keywords: ['dokumentasjon', 'dokumenter', 'bevis'], tags: ['Dokumentasjon'] },
    { keywords: ['risiko', 'risk'], tags: ['Risikovurdering'] },
    { keywords: ['kontroll', 'internal control'], tags: ['Interne kontroller'] },
    { keywords: ['materialitet', 'materiality', 'vesentlig'], tags: ['Materialitet'] },
    { keywords: ['planlegging', 'planning'], tags: ['Planlegging'] },
    { keywords: ['testing', 'test', 'prøving'], tags: ['Testing'] },
    { keywords: ['lønn', 'personal', 'salary'], tags: ['Lønn', 'Personalkostnader'] },
    { keywords: ['varelager', 'inventory'], tags: ['Varelager'] },
    { keywords: ['kundefordringer', 'receivables'], tags: ['Kundefordringer'] },
    { keywords: ['mva', 'avgift', 'tax'], tags: ['MVA', 'Avgifter'] },
    { keywords: ['årsavslutning', 'year-end'], tags: ['Årsavslutning'] },
    { keywords: ['regnskaps', 'accounting'], tags: ['Regnskap'] },
    { keywords: ['feilinformasjon', 'misstatement'], tags: ['Feilinformasjon'] },
    { keywords: ['verdsettelse', 'valuation'], tags: ['Verdsettelse'] },
    { keywords: ['gjeld', 'liabilities'], tags: ['Gjeld'] },
    { keywords: ['eiendeler', 'assets'], tags: ['Eiendeler'] },
    { keywords: ['egenkapital', 'equity'], tags: ['Egenkapital'] },
    { keywords: ['cash', 'kontant', 'bank'], tags: ['Kontanter', 'Bank'] }
  ];
  
  // Analyze content and extract relevant tags
  for (const mapping of tagMappings) {
    const hasKeyword = mapping.keywords.some(keyword => responseText.includes(keyword));
    if (hasKeyword) {
      tags.push(...mapping.tags);
    }
  }
  
  // Remove duplicates and limit to 6 tags max
  const uniqueTags = [...new Set(tags)];
  
  // If we found specific tags, return them
  if (uniqueTags.length > 0) {
    return uniqueTags.slice(0, 6);
  }
  
  // Context-based fallback tags
  if (responseText.includes('spørsmål') || responseText.includes('hjelp')) {
    return ['Fagspørsmål', 'Veiledning', 'Revisjon'];
  }
  
  // Ultimate fallback - always return something relevant
  return ['Revisjon', 'Fagstoff', 'Regnskap'];
}
