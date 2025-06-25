
import { log } from '../_shared/log.ts';

// Improved keyword extraction for Norwegian content
export function extractIntelligentKeywords(message: string, context: string): string[] {
  log(`🔍 Extracting keywords from: "${message}"`);
  const keywords = new Set<string>();

  // Norwegian stopwords to exclude
  const stopwords = ['og', 'eller', 'en', 'et', 'den', 'det', 'de', 'som', 'jeg', 'du', 'han', 'hun', 'vi', 'dere', 'til', 'av', 'for', 'på', 'med', 'i', 'å', 'er', 'var', 'har', 'kan', 'skal', 'vil', 'må', 'om', 'hvis', 'når', 'hvor', 'hva', 'hvem', 'hvorfor', 'hvordan', 'fra', 'blir', 'være', 'sin', 'sitt', 'sine', 'meg', 'deg', 'seg', 'oss', 'dere', 'dem'];

  // Clean and extract words (3+ characters, not stopwords)
  const words = message.toLowerCase()
    .replace(/[^\w\såæøäöü]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 3 && !stopwords.includes(word));
    
  words.forEach(word => {
    keywords.add(word);
    log(`📝 Added keyword: "${word}"`);
  });

  // Enhanced ISA standards extraction
  const isaMatches = message.match(/isa\s*\d{3}/gi);
  if (isaMatches) {
    isaMatches.forEach(match => {
      const cleanMatch = match.replace(/\s+/g, ' ').trim().toUpperCase();
      keywords.add(cleanMatch);
      keywords.add('ISA');
      log(`📋 Added ISA term: "${cleanMatch}"`);
    });
  }

  // Add key revision terms when found
  const revisionTerms = ['revisjon', 'revisor', 'regnskap', 'kontroll', 'standard', 'prosedyre', 'fagstoff', 'artikkel', 'retningslinje'];
  revisionTerms.forEach(term => {
    if (message.toLowerCase().includes(term)) {
      keywords.add(term);
      log(`🎯 Added revision term: "${term}"`);
    }
  });

  // Context-based keywords
  if (context === 'risk-assessment') {
    keywords.add('risiko');
    keywords.add('vurdering');
  } else if (context === 'documentation') {
    keywords.add('dokumentasjon');
    keywords.add('bevis');
  }

  const finalKeywords = Array.from(keywords);
  log(`✅ Final keywords (${finalKeywords.length}): ${finalKeywords.join(', ')}`);
  return finalKeywords;
}

// Select optimal model based on complexity
export function selectOptimalModel(message: string, context: string, isGuestMode = false): string {
  if (isGuestMode) return 'gpt-4o-mini';
  
  // Use gpt-4o-mini for most cases to save costs
  const complexPatterns = [
    /kompleks/i,
    /avansert/i,
    /detaljert/i,
    /omfattende/i
  ];
  
  const isComplex = complexPatterns.some(pattern => pattern.test(message)) || message.length > 500;
  return isComplex ? 'gpt-4o' : 'gpt-4o-mini';
}

// Intelligent fallback responses
export function getIntelligentFallback(requestBody: any): string {
  const { context = 'general', message = '' } = requestBody;
  
  const fallbacks = {
    'risk-assessment': 'Beklager, jeg opplever tekniske problemer. I mellomtiden kan du fokusere på å identifisere vesentlige risikoer i henhold til ISA 315.',
    'documentation': 'Beklager for problemet. Fortsett med dokumentasjon i henhold til ISA 230-kravene mens jeg blir tilgjengelig igjen.',
    'general': 'Beklager, jeg opplever tekniske problemer akkurat nå. Prøv igjen om litt, eller kontakt support hvis problemet vedvarer.'
  };
  
  return fallbacks[context as keyof typeof fallbacks] || fallbacks.general;
}
