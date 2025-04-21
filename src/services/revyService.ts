
import { RevyContext, RevyMessage } from '@/types/revio';

// Context-aware tips for Revy assistant
const contextualTips: Record<string, string[]> = {
  'dashboard': [
    'Velkommen til dashbordet! Her ser du en oversikt over nøkkeltall for klienten.',
    'Klikk på en regnskapslinje i oversikten for å se detaljene.',
    'Ser du de røde indikatorene? Det kan tyde på høyrisiko-områder som krever oppmerksomhet.',
    'Husker du å sjekke endringen fra forrige periode? Store svingninger kan være risikoindikatorer.'
  ],
  'drill-down': [
    'Her kan du klikke på en regnskapslinje for å se kontoene bak tallene.',
    'Prøv å filtrere transaksjoner etter beløp for å identifisere uvanlige poster.',
    'Tips: Bruk søkefeltet for å finne spesifikke kontoer eller transaksjoner.',
    'Velg stratifisert utvalg for å få et representativt utvalg av transaksjoner å teste.'
  ],
  'risk-assessment': [
    'Husk å dokumentere vurderingen for hvert risikoområde.',
    'Har du vurdert både iboende risiko og kontrollrisiko?',
    'For høyrisiko-områder, vurder om du trenger å utvide testomfanget.',
    'Ikke glem å vurdere risiko for misligheter i henhold til ISA 240.'
  ],
  'documentation': [
    'Husk å knytte arbeidspapirene til relevante regnskapslinjer.',
    'Sørg for at konklusjonene er klare og understøttet av revisjonsbevis.',
    'Partner review krever tydelig dokumentasjon av alle vurderinger.',
    'Bruk mal-funksjonene for å sikre konsistent dokumentasjon.'
  ],
  'mapping': [
    'Dra kontonumre til riktig regnskapslinje for å lage mapping.',
    'Standard kontoplan kan brukes som utgangspunkt for mapping.',
    'Husk å kontrollere at summen av konti stemmer med regnskapslinjen.',
    'Lagre mapping-malen for fremtidig bruk med lignende klienter.'
  ],
  'client-overview': [
    'Her ser du alle klientene du er ansvarlig for.',
    'Klikk på en klient for å se detaljer og revisjonsstatus.',
    'Legg merke til varslene som indikerer kritiske datoer eller manglende dokumentasjon.',
    'Bruk filterfunksjonen for å sortere klienter etter bransje eller revisjonsfase.'
  ],
  'client-admin': [
    'Her kan du administrere klientene dine.',
    'Legg til nye klienter manuelt eller søk i Brønnøysundregisteret.',
    'Rediger eksisterende klient-informasjon ved å klikke på rediger-ikonet.',
    'Sørg for at all informasjon er oppdatert for korrekt rapportering.'
  ],
  'general': [
    'Jeg er Revy, din revisjonsassistent! Spør meg om hjelp når som helst.',
    'Trenger du hjelp med noe spesifikt? Jeg kan veilede deg gjennom revisjonsprosessen.',
    'Tips: Bruk søkefunksjonen øverst for å finne dokumenter eller revisjonssteg.',
    'Husk å lagre arbeidet ditt regelmessig!'
  ]
};

// Get contextual tips based on current context
export const getContextualTip = (context: RevyContext): string => {
  const tips = contextualTips[context as string];
  return tips ? tips[Math.floor(Math.random() * tips.length)] : contextualTips['general'][0];
};

// Generate a response based on user message and context
export const generateResponse = (userMessage: string, context: RevyContext): string => {
  // Simple keyword-based response for now
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('risiko') || lowerMessage.includes('risk')) {
    return 'Risikovurdering er en viktig del av revisjonen. Husk å vurdere både iboende risiko og kontrollrisiko for hver regnskapslinje.';
  }
  
  if (lowerMessage.includes('drill') || lowerMessage.includes('transaksjon')) {
    return 'I drill-down visningen kan du klikke på kontoer for å se enkelt-transaksjoner. Prøv å filtrere på beløp for å finne uvanlige poster.';
  }
  
  if (lowerMessage.includes('dokumenta') || lowerMessage.includes('arbeidspapir')) {
    return 'God dokumentasjon er avgjørende. Sørg for at alle konklusjoner er tydelig koblet til revisjonsbevis og at arbeidspapirene følger ISA-kravene.';
  }
  
  if (lowerMessage.includes('mapping') || lowerMessage.includes('kontoplan')) {
    return 'For mapping kan du dra og slippe kontonumre til riktig regnskapslinje. Systemet vil lagre mappingen for fremtidig bruk.';
  }
  
  // If no specific match, return a contextual tip
  return getContextualTip(context);
};
