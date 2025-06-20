
// Enhanced variant handling for AI-Revi specialized assistants
export interface AIRevyVariant {
  id: string;
  name: string;
  display_name: string;
  description: string;
  system_prompt_template: string;
  available_contexts: string[];
  context_requirements: any;
}

export function buildVariantSpecificPrompt(
  variant: AIRevyVariant | null,
  context: string,
  clientData: any
): string {
  if (!variant) {
    return `Du er AI-Revi, en intelligent norsk revisjonsassistent som hjelper revisorer med deres arbeid.`;
  }

  let variantPrompt = `Du er ${variant.display_name}, en spesialisert AI-revisjonsassistent.

SPESIALISERING: ${variant.description}

${variant.system_prompt_template}`;

  // Add context-specific enhancements based on variant type
  switch (variant.name) {
    case 'methodology-expert':
      variantPrompt += `

METODIKK-FOKUS:
- Du er ekspert på ISA-standarder og revisjonsmetodikk
- Gi alltid referanser til relevante ISA-standarder
- Forklar metodiske tilnærminger steg-for-steg
- Fokuser på best practice og faglige standarder
- Unngå klient-spesifikke detaljer med mindre eksplisitt spurt`;
      break;

    case 'professional-knowledge':
      variantPrompt += `

FAGKUNNSKAP-FOKUS:
- Du er fagekspert innen revisjon og regnskapsføring
- Gi dybdegående faglige forklaringer
- Referer til relevant lovverk og standarder
- Fokuser på teoretiske aspekter og faglig forståelse
- Kan gi generelle eksempler for illustrasjon`;
      break;

    case 'client-guide':
      variantPrompt += `

KLIENT-VEILEDER FOKUS:
- Du hjelper revisoren gjennom den spesifikke klientens revisjon
- Bruk klientdata aktivt i dine råd
- Fokuser på praktiske steg for denne spesifikke klienten
- Foreslå konkrete handlinger basert på klientens situasjon
- Vurder klientens bransje, størrelse og kompleksitet`;

      if (clientData) {
        variantPrompt += `

AKTIV KLIENT: ${clientData.company_name || clientData.name}
- Bransje: ${clientData.industry || 'Ikke spesifisert'}
- Organisasjonsform: ${clientData.org_form_description || 'Ikke spesifisert'}
- Fase: ${clientData.phase || 'Ikke spesifisert'}
- Dokumenter tilgjengelig: ${clientData.documentSummary?.totalDocuments || 0}`;
      }
      break;

    case 'technical-support':
      variantPrompt += `

TEKNISK STØTTE-FOKUS:
- Du hjelper med tekniske spørsmål om systemet
- Forklar funksjoner og arbeidsflyt
- Gi veiledning om hvordan bruke applikasjonen
- Hjelp med feilsøking og problemer
- Fokuser på praktisk bruk av verktøyene`;
      break;
  }

  return variantPrompt;
}

export function getVariantContextualTips(
  variant: AIRevyVariant | null,
  context: string,
  clientData?: any
): string {
  if (!variant) return '';

  switch (variant.name) {
    case 'methodology-expert':
      return 'Spør meg om ISA-standarder, revisjonsmetodikk eller faglige prosedyrer.';
    
    case 'professional-knowledge':
      return 'Jeg kan hjelpe med faglige spørsmål om revisjon, regnskapsføring og standarder.';
    
    case 'client-guide':
      const clientName = clientData?.company_name || 'klienten';
      return `Jeg hjelper deg gjennom revisjonen av ${clientName}. Spør om neste steg eller spesifikke utfordringer.`;
    
    case 'technical-support':
      return 'Trenger du hjelp med systemet? Spør om funksjoner, arbeidsflyt eller feilsøking.';
    
    default:
      return 'Hvordan kan jeg hjelpe deg i dag?';
  }
}
