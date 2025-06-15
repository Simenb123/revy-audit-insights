
// Intelligent keyword extraction
export function extractIntelligentKeywords(message: string, context: string): string[] {
  const revisionTerms = ['revisjon', 'audit', 'kontroll', 'risikovurdering', 'materialitet', 'testing', 'verifisering'];
  const accountingTerms = ['regnskap', 'balanse', 'resultat', 'kontroller', 'transaksjoner', 'kontoplan'];
  const contextTerms = {
    'risk-assessment': ['risiko', 'vurdering', 'materialitet', 'kontrollrisiko'],
    'documentation': ['dokumentasjon', 'arbeidspapirer', 'bevis', 'konklusjon'],
    'client-detail': ['klient', 'bransje', 'nøkkeltall', 'analyse']
  };

  const keywords: string[] = [];
  const lowerMessage = message.toLowerCase();
  
  // Add context-specific terms
  if (contextTerms[context as keyof typeof contextTerms]) {
    keywords.push(...contextTerms[context as keyof typeof contextTerms]);
  }
  
  // Add revision terms if relevant
  if (revisionTerms.some(term => lowerMessage.includes(term))) {
    keywords.push(...revisionTerms.filter(term => lowerMessage.includes(term)));
  }
  
  // Add accounting terms if relevant
  if (accountingTerms.some(term => lowerMessage.includes(term))) {
    keywords.push(...accountingTerms.filter(term => lowerMessage.includes(term)));
  }
  
  // Extract key words from message (simple approach)
  const words = lowerMessage.split(/\s+/).filter(word => word.length > 3);
  keywords.push(...words.slice(0, 3));

  return [...new Set(keywords)]; // Remove duplicates
}

// Optimal model selection based on complexity
export function selectOptimalModel(message: string, context: string, isGuestMode = false): string {
  // Always use mini model for guests to reduce costs
  if (isGuestMode) {
    return 'gpt-4o-mini';
  }

  const complexContexts = ['risk-assessment', 'documentation', 'client-detail'];
  const longMessage = message.length > 200;
  const complexTerms = ['analyse', 'vurder', 'beregn', 'sammenlikn', 'konkluder'];
  
  const isComplex = complexContexts.includes(context) || 
                   longMessage || 
                   complexTerms.some(term => message.toLowerCase().includes(term));
  
  return isComplex ? 'gpt-4o' : 'gpt-4o-mini';
}

// Intelligent fallback responses
export function getIntelligentFallback(requestData: any): string {
  const context = requestData.context || 'general';
  const userRole = requestData.userRole || 'employee';
  
  const fallbacks = {
    'risk-assessment': 'Jeg har tekniske problemer, men her er noen generelle tips for risikovurdering: Start med å identifisere klientens bransje og nøkkelrisiki. Vurder materialitetsnivå basert på størrelse og kompleksitet.',
    'documentation': 'Tekniske problemer oppstått. For dokumentasjon, husk: ISA 230 krever at all dokumentasjon skal være tilstrekkelig og hensiktsmessig for å støtte revisjonskonklusjoner.',
    'client-detail': 'Midlertidig feil. For klientanalyse, se på nøkkeltall som omsetningsvekst, lønnsomhet og likviditet. Sammenlign med bransjegjennomsnitt.',
    'general': 'Jeg opplever tekniske problemer. Prøv igjen om litt, eller kontakt support hvis problemet vedvarer.'
  };
  
  const roleSpecific = userRole === 'partner' ? 
    ' Som partner bør du også vurdere klientporteføljens samlede risiko.' :
    userRole === 'manager' ? 
    ' Som manager, sørg for at teamet følger etablerte prosedyrer.' :
    ' Kontakt din manager hvis du trenger ytterligere veiledning.';
  
  return (fallbacks[context as keyof typeof fallbacks] || fallbacks.general) + roleSpecific;
}
