
import { getVariantSystemPrompt } from './variant-handler.ts';
import { log } from '../_shared/log.ts';

export async function buildIntelligentSystemPromptWithVariant(
  context: string,
  clientData: any | null,
  userRole?: string,
  enhancedContext?: any,
  isGuestMode: boolean = false,
  selectedVariant?: any
) {
  log('🎯 Building intelligent system prompt with variant support:', {
    context,
    variantName: selectedVariant?.name,
    hasClientData: !!clientData,
    hasKnowledge: !!enhancedContext?.knowledge?.length,
    hasDocumentResults: !!enhancedContext?.documentSearchResults,
    isGuestMode
  });

  // Start with base system prompt
  let systemPrompt = `Du er AI-Revy, en AI-drevet revisjonsassistent som hjelper revisorer med faglige spørsmål, dokumentanalyse og revisjonsarbeid.

GRUNNLEGGENDE INSTRUKSJONER:
- Svar alltid på norsk (bokmål)
- Vær profesjonell, men vennlig og tilgjengelig
- Gi konkrete, praktiske råd basert på norske revisjonstandarder
- Referer til ISA-standarder når relevant
- Hvis du ikke er sikker på noe, si det tydelig

VIKTIG: Avslutt ALLTID svaret ditt med en linje som inneholder: "🏷️ **EMNER:** [liste over relevante norske emner adskilt med komma]"
Dette er påkrevd for at grensesnittet skal fungere korrekt.`;

  // Add variant-specific prompt if available
  if (selectedVariant && selectedVariant.system_prompt_template) {
    const variantPrompt = await getVariantSystemPrompt(selectedVariant, context, clientData);
    if (variantPrompt) {
      systemPrompt += `\n\n${variantPrompt}`;
    }
  }

  // Add document context if available
  if (enhancedContext?.documentSearchResults) {
    const { specificDocument, generalDocuments } = enhancedContext.documentSearchResults;
    
    if (specificDocument && specificDocument.fullContent) {
      systemPrompt += `\n\nDOKUMENTINNHOLD TILGJENGELIG:
Du har tilgang til følgende spesifikke dokument:

DOKUMENT: ${specificDocument.fileName}
KATEGORI: ${specificDocument.category || 'Ukategorisert'}
SAMMENDRAG: ${specificDocument.summary || 'Ikke tilgjengelig'}

FULLSTEDIG INNHOLD:
${specificDocument.fullContent}

Du kan nå svare på spørsmål om dette dokumentet basert på det faktiske innholdet. Vær nøyaktig og referer til spesifikke deler av dokumentet når det er relevant.`;
    } else if (generalDocuments && generalDocuments.length > 0) {
      systemPrompt += `\n\nRELEVANTE DOKUMENTER FUNNET:
Du har tilgang til følgende relevante dokumenter:

${generalDocuments.slice(0, 3).map(doc => `
- ${doc.fileName}
  Kategori: ${doc.category || 'Ukategorisert'}
  Sammendrag: ${doc.summary || 'Ikke tilgjengelig'}
  ${doc.relevantText ? `Relevant tekst: "${doc.relevantText}"` : ''}
  ${doc.fullContent ? `\nInnhold: ${doc.fullContent.substring(0, 1000)}${doc.fullContent.length > 1000 ? '...' : ''}` : ''}
`).join('')}

Du kan referere til disse dokumentene i ditt svar og bruke informasjonen derfra.`;
    }
  }

  // Add context-specific guidance
  const contextGuidance = {
    'client-detail': `
KLIENTKONTEKST:
Du hjelper med analyse av ${clientData?.company_name || 'denne klienten'}.
- Fokuser på klientspesifikke utfordringer og revisjonsrisiko
- Gi praktiske råd for denne spesifikke klientens revisjon
- Vurder bransjespesifikke forhold`,

    'documentation': `
DOKUMENTASJONSKONTEKST:
Du hjelper med dokumentanalyse og kategorisering.
- Fokuser på dokumentkvalitet og korrekt kategorisering
- Gi råd om revisjonsbevis og dokumentasjon
- Vurder dokumentenes relevans for revisjonen`,

    'audit-actions': `
REVISJONSHANDLINGER:
Du hjelper med planlegging og gjennomføring av revisjonshandlinger.
- Fokuser på ISA-standarder og metodikk
- Gi praktiske råd for revisjonshandlinger
- Vurder risikonivå og omfang av testing`
  };

  if (contextGuidance[context as keyof typeof contextGuidance]) {
    systemPrompt += contextGuidance[context as keyof typeof contextGuidance];
  }

  // Add client data context if available
  if (clientData) {
    systemPrompt += `\n\nKLIENTINFORMASJON:
- Navn: ${clientData.company_name || 'Ikke oppgitt'}
- Organisasjonsnummer: ${clientData.organization_number || 'Ikke oppgitt'}
- Bransje: ${clientData.industry || 'Ikke oppgitt'}`;

    if (enhancedContext?.clientContext) {
      const insights = enhancedContext.clientContext.documentInsights;
      if (insights) {
        systemPrompt += `
- Totalt ${insights.totalDocuments} dokumenter
- ${insights.withText} dokumenter med ekstrahert tekst
- Kategorier: ${insights.categories.join(', ') || 'Ingen'}`;
      }
    }
  }

  // Add knowledge context with link instructions if available
  if (enhancedContext?.knowledge && enhancedContext.knowledge.length > 0) {
    const relevantArticles = enhancedContext.knowledge.slice(0, 3);
    systemPrompt += `\n\nRELEVANTE FAGARTIKLER:
Du har tilgang til følgende fagartikler som er relevante for spørsmålet:

${relevantArticles.map((article: any) => `
- Tittel: ${article.title}
  Slug: ${article.slug || 'ukjent'}
  Sammendrag: ${article.summary || 'Ingen sammendrag'}
  ${article.content ? `Innhold: ${article.content.substring(0, 300)}...` : ''}
`).join('')}

VIKTIG FOR ARTIKKELREFERANSER:
- Når du refererer til disse artiklene i ditt svar, bruk ALLTID lenkeformat: [Artikkelnavn](/fag/artikkel/slug)
- Eksempel: [ISA 315 - Identifisering og vurdering av risikoforhold](/fag/artikkel/isa-315-risikovurdering)
- Inkluder relevante artikkellenker naturlig i teksten når de gir merverdi
- Bruk kun artikler som faktisk er tilgjengelige i listen ovenfor`;
  }

  // Add role-specific guidance
  if (userRole) {
    const roleGuidance = {
      'revisor': 'Du snakker med en autorisert revisor. Gi faglig dybde og tekniske detaljer.',
      'revisorassistent': 'Du snakker med en revisorassistent. Gi praktisk veiledning og forklaringer.',
      'partner': 'Du snakker med en partner. Fokuser på strategiske og kvalitetsmessige aspekter.',
      'admin': 'Du snakker med en administrator. Gi systemrelatert informasjon og oversikt.'
    };

    if (roleGuidance[userRole as keyof typeof roleGuidance]) {
      systemPrompt += `\n\nROLLETILPASNING: ${roleGuidance[userRole as keyof typeof roleGuidance]}`;
    }
  }

  // Add guest mode limitations
  if (isGuestMode) {
    systemPrompt += `\n\nGJESTEMODUS: Brukeren er ikke logget inn. Gi generelle råd uten tilgang til spesifikke klientdata.`;
  }

  log('✅ Intelligent system prompt built with variant and document support');
  return systemPrompt;
}
