
export function validateAIResponse(response: string): { isValid: boolean; fixedResponse?: string } {
  console.log('🔍 Validating AI response format...');
  console.log('📝 Response preview:', response.substring(0, 200) + '...');
  
  // Check if response has ANY form of EMNER section
  const hasEmnerSection = /🏷️.*[Ee][Mm][Nn][Ee][Rr]|[Ee][Mm][Nn][Ee][Rr]:/i.test(response);
  
  if (hasEmnerSection) {
    console.log('✅ Response has some form of EMNER section');
    
    // Check if it's in the standardized format we want
    const hasStandardFormat = /🏷️\s*\*\*[Ee][Mm][Nn][Ee][Rr]:?\*\*\s*.+/.test(response);
    
    if (hasStandardFormat) {
      console.log('✅ Response has perfect standardized format');
      return { isValid: true };
    } else {
      console.log('🔧 Response has EMNER but not standardized format, fixing...');
      // Extract existing tags and reformat them
      const existingTags = extractExistingTags(response);
      const fixedResponse = response + '\n\n🏷️ **EMNER:** ' + existingTags.join(', ');
      return { isValid: true, fixedResponse };
    }
  }
  
  console.log('🔧 Response missing EMNER section, forcing comprehensive tag injection...');
  
  // FORCE intelligent tag injection based on content analysis
  const intelligentTags = extractComprehensiveTags(response);
  
  // Ensure we always have at least 3 relevant tags
  const finalTags = intelligentTags.length >= 3 ? intelligentTags : [
    ...intelligentTags,
    'Revisjon',
    'Fagstoff',
    'Regnskap'
  ].slice(0, 6);
  
  // FORCE standardized format that the frontend expects
  const fixedResponse = response.trim() + '\n\n🏷️ **EMNER:** ' + finalTags.join(', ');
  
  console.log('🔧 FORCED tag injection with standardized format');
  console.log('🏷️ Injected tags:', finalTags.join(', '));
  console.log('📏 Fixed response length:', fixedResponse.length);
  
  return { isValid: true, fixedResponse };
}

function extractExistingTags(response: string): string[] {
  const lines = response.split('\n');
  
  for (const line of lines) {
    // Try to find any existing EMNER line
    const match = line.match(/[Ee][Mm][Nn][Ee][Rr]:?\s*(.+)/i);
    if (match && match[1]) {
      const tagsPart = match[1]
        .replace(/\*\*/g, '')
        .replace(/🏷️/g, '')
        .replace(/[.!?]+$/, '')
        .trim();
      
      const tags = tagsPart
        .split(/[,;]/)
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0 && tag.length < 50);
      
      if (tags.length > 0) {
        console.log('🔍 Extracted existing tags:', tags);
        return tags;
      }
    }
  }
  
  return [];
}

function extractComprehensiveTags(response: string): string[] {
  const tags: string[] = [];
  const responseText = response.toLowerCase();
  
  console.log('🔍 Extracting tags from response text...');
  
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
    { keywords: ['hjelp', 'veiledning', 'guide', 'artikkel', 'fagstoff'], tags: ['Veiledning', 'Fagstøtte', 'Artikler'] }
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
      console.log('🏷️ Found keywords:', mapping.keywords.filter(k => responseText.includes(k)), '-> tags:', mapping.tags);
      tags.push(...mapping.tags);
    }
  }
  
  // Remove duplicates and prioritize most relevant tags
  const uniqueTags = [...new Set(tags)];
  
  // If we found specific tags, return top 6
  if (uniqueTags.length > 0) {
    console.log('✅ Extracted intelligent tags:', uniqueTags.slice(0, 6));
    return uniqueTags.slice(0, 6);
  }
  
  // Context-based intelligent fallback based on content analysis
  if (responseText.includes('spørsmål') || responseText.includes('hjelp')) {
    console.log('🏷️ Using help-based fallback tags');
    return ['Fagspørsmål', 'Veiledning', 'Revisjon'];
  }
  
  if (responseText.includes('start') || responseText.includes('begynn') || responseText.includes('første')) {
    console.log('🏷️ Using beginner-based fallback tags');
    return ['Nybegynner', 'Grunnleggende', 'Revisjon'];
  }
  
  // Ultimate comprehensive fallback - always return meaningful tags
  console.log('🏷️ Using ultimate fallback tags');
  return ['Revisjon', 'Fagstoff', 'Regnskap'];
}
