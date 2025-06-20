
import { buildVariantSpecificPrompt } from './variant-handler.ts';

export async function buildIntelligentSystemPromptWithVariant(
  context: string,
  clientData: any,
  userRole?: string,
  enhancedContext?: any,
  isGuestMode: boolean = false,
  selectedVariant?: any
): Promise<string> {
  
  // Start with variant-specific prompt
  let basePrompt = buildVariantSpecificPrompt(
    selectedVariant, 
    context, 
    enhancedContext?.enrichedClientData || clientData
  );

  basePrompt += `

VIKTIG IDENTITET:
- Du kommuniserer alltid på norsk
- Du er profesjonell, hjelpsom og nøyaktig
- Du gir konkrete, praktiske råd basert på din spesialisering
- Du refererer til relevante standarder når mulig

SVAR-FORMAT:
- Gi alltid korte, presise svar tilpasset din spesialisering
- Bruk punktlister når hensiktsmessig  
- Inkluder relevante fagartikkel-lenker når tilgjengelig
- VIKTIG: Avslutt ALLTID med en 🏷️ **EMNER:** linje som inneholder relevante søkeord/tags kommaseparert

${isGuestMode ? `
GJEST-MODUS:
- Brukeren er ikke innlogget, så gi generelle råd
- Ikke referer til spesifikke klientdata
- Fokuser på generell revisjonsteori og praksis basert på din spesialisering
` : ''}`;

  // Add knowledge context if available (for methodology and professional variants)
  if (enhancedContext?.knowledge && enhancedContext.knowledge.length > 0 && 
      (selectedVariant?.name === 'methodology-expert' || selectedVariant?.name === 'professional-knowledge')) {
    basePrompt += `

TILGJENGELIG FAGSTOFF:
Her er relevante fagartikler som støtter din spesialisering:

`;
    
    enhancedContext.knowledge.slice(0, 5).forEach((article: any, index: number) => {
      basePrompt += `${index + 1}. **${article.title}**
   - Kategori: ${article.category}
   - Sammendrag: ${article.summary || 'Ingen sammendrag tilgjengelig'}
   - Link: [${article.title}](/fag/artikkel/${article.slug})
   - Tags: ${article.tags.join(', ')}
   ${article.reference_code ? `- Referanse: ${article.reference_code}` : ''}

`;
    });

    // Add article-to-tag mapping for knowledge-focused variants
    if (enhancedContext.articleTagMapping && Object.keys(enhancedContext.articleTagMapping).length > 0) {
      basePrompt += `
ARTIKKEL-TAG MAPPINGER:
Følgende tags/emner kan kobles til spesifikke artikler:
`;
      Object.entries(enhancedContext.articleTagMapping).forEach(([tag, mapping]: [string, any]) => {
        basePrompt += `- "${tag}" → ${mapping.articleTitle} (/fag/artikkel/${mapping.articleSlug})
`;
      });
    }
    
    basePrompt += `
INSTRUKSJONER FOR BRUK AV FAGSTOFF:
- Referer til relevante artikler i ditt svar når de støtter din spesialisering
- Bruk format: [Artikkelnavn](/fag/artikkel/slug) for lenker
- Inkluder kun artikler som er direkte relevante for spørsmålet
- I EMNER-taggen på slutten, bruk tags som matcher artiklene du refererer til
`;
  }

  // Add client context for client-guide variant
  if (enhancedContext?.clientContext && !isGuestMode && selectedVariant?.name === 'client-guide') {
    basePrompt += `

KLIENT-KONTEKST FOR VEILEDNING:
${JSON.stringify(enhancedContext.clientContext, null, 2)}

Bruk denne informasjonen aktivt når du gir klient-spesifikke råd og veiledning.
`;
  }

  // Add context-specific instructions based on variant
  if (selectedVariant?.name === 'client-guide') {
    switch (context) {
      case 'planning':
        basePrompt += `
PLANLEGGINGS-VEILEDNING:
- Hjelp revisoren planlegge denne spesifikke klientens revisjon
- Vurder klientens bransje, størrelse og kompleksitet
- Foreslå spesifikke risikoområder å fokusere på
- Gi konkrete neste steg for planleggingsfasen
`;
        break;
      case 'execution':
        basePrompt += `
GJENNOMFØRINGS-VEILEDNING:
- Hjelp med revisjonshandlinger for denne klienten
- Prioriter handlinger basert på klientens risikoområder
- Gi praktiske tips for dokumentasjon og testing
- Foreslå hvordan bruke tilgjengelige dokumenter effektivt
`;
        break;
    }
  }

  basePrompt += `

HUSK (tilpasset din spesialisering):
- Hold svarene konsise og praktiske
- Gi alltid konkrete eksempler når mulig og relevant for din rolle
- Avslutt ALLTID med 🏷️ **EMNER:** [relevante tags]
- ${selectedVariant?.name === 'methodology-expert' || selectedVariant?.name === 'professional-knowledge' ? 
    'Bruk fagartikkel-lenker når de er relevante for metodikk/fagkunnskap' : 
    selectedVariant?.name === 'client-guide' ? 
    'Fokuser på praktiske råd for den aktuelle klienten' :
    'Hjelp brukeren med tekniske spørsmål om systemet'}
`;

  return basePrompt;
}
