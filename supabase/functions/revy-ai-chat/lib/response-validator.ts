
export function validateAIResponse(response: string): { isValid: boolean; fixedResponse?: string } {
  console.log('🔍 Validating AI response format...');
  
  // Check if response has the required EMNER section
  const hasEmnerSection = /🏷️\s*\*\*EMNER:\*\*/.test(response);
  
  if (hasEmnerSection) {
    console.log('✅ Response has valid EMNER section');
    return { isValid: true };
  }
  
  console.log('⚠️ Response missing EMNER section, attempting to fix...');
  
  // Try to extract potential tags from the response content
  const potentialTags = extractPotentialTags(response);
  
  if (potentialTags.length > 0) {
    const fixedResponse = response.trim() + '\n\n🏷️ **EMNER:** ' + potentialTags.join(', ');
    console.log('✅ Fixed response with extracted tags:', potentialTags);
    return { isValid: true, fixedResponse };
  }
  
  // Add default tags as fallback
  const defaultTags = ['Revisjon', 'Regnskap', 'Fagspørsmål'];
  const fixedResponse = response.trim() + '\n\n🏷️ **EMNER:** ' + defaultTags.join(', ');
  console.log('⚠️ Using default tags as fallback');
  return { isValid: true, fixedResponse };
}

function extractPotentialTags(response: string): string[] {
  const tags: string[] = [];
  
  // Common audit/accounting terms in Norwegian
  const commonTerms = [
    'revisjon', 'inntekt', 'dokumentasjon', 'risiko', 'kontroll', 
    'materialitet', 'isa', 'regnskaps', 'audit', 'planlegging',
    'testing', 'vesentlighet', 'feilinformasjon', 'lønn', 'varelager',
    'kundefordringer', 'årsavslutning', 'mva', 'avgift'
  ];
  
  const responseText = response.toLowerCase();
  
  for (const term of commonTerms) {
    if (responseText.includes(term)) {
      // Capitalize first letter for tag
      const tag = term.charAt(0).toUpperCase() + term.slice(1);
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    }
  }
  
  // Limit to max 6 tags
  return tags.slice(0, 6);
}
