import { RevyContext } from '@/types/revio';

const baseMessage = "Beklager, jeg opplever tekniske problemer akkurat nå.";

export const contextSpecificHelp: Partial<Record<RevyContext, string>> & { general: string } = {
  'risk-assessment': `I mellomtiden kan du se på ISA 315-standarden for risikovurdering og planlegge revisjonshandlinger basert på identifiserte risikoområder.

**Viktige risikoområder å vurdere:**
- Inntektsføring og omsetning
- Varelager og verdivurdering
- Kundefordringer og tapsavsetninger
- Leverandørgjeld og periodiseringer
- Ledelsens skjønnsmessige vurderinger

**ISA 315 hovedkrav:**
- Forstå enheten og dens omgivelser
- Identifiser og vurder risiko for vesentlig feilinformasjon
- Evaluer internkontrollsystemer
- Dokumenter risikovurderinger grundig`,

  'documentation': `Du kan fortsette med dokumentasjon i henhold til ISA 230-kravene mens jeg blir tilgjengelig igjen.

**ISA 230 dokumentasjonskrav:**
- Tilstrekkelig og hensiktsmessig revisjonsbevis
- Dokumenter arten, tidspunktet og omfanget av revisjonshandlinger
- Resultater og konklusjoner av revisjonsarbeidet
- Betydelige profesjonelle vurderinger og grunnlaget for disse

**Dokumentasjonstips:**
- Bruk konsistente maler og strukturer
- Skriv klare og konsise konklusjoner
- Dokumenter avvik og oppfølgingshandlinger
- Sørg for sporbarhet og gjennomgåelsesmuligheter`,

  'client-detail': `Du kan gjennomgå klientinformasjon og tidligere revisjoner mens jeg løser tekniske problemer.

**Klientforståelse - nøkkelområder:**
- Bransje og markedsforhold
- Forretningsmodell og strategier
- Organisasjonsstruktur og ledelse
- IT-systemer og regnskapsprosesser
- Tidligere revisjoner og anbefalinger

**Planleggingsspørsmål:**
- Har det vært endringer i ledelse eller eierskap?
- Er det nye regnskapsstandarder som påvirker?
- Hvilke områder hadde feil i forrige revisjon?`,

  'collaboration': `Du kan koordinere med teamet ditt og fordele arbeidsoppgaver manuelt inntil systemet fungerer igjen.

**Teamkoordinering:**
- Organiser teammøter for oppgavefordeling
- Sett opp felles kalender for revisjonsaktiviteter
- Definer ansvarsområder og tidsfrister
- Etabler kommunikasjonskanaler for daglig oppfølging

**Kvalitetssikring:**
- Implementer review-prosesser mellom teammedlemmer
- Bruk sjekklister for kritiske revisjonsområder
- Dokumenter alle avklaringer og beslutninger`,

  'general': `Du kan fortsette med ditt revisjonsarbeid og komme tilbake til meg senere.

**Generelle revisjonstips:**
- Start med planlegging og risikovurdering
- Følg ISA-standardenes systematiske tilnærming
- Dokumenter alt revisjonsarbeid grundig
- Hold fokus på materialitet og risiko
- Kommuniser løpende med klient og team

**Nyttige ressurser:**
- ISA-håndbøker og veiledninger
- Bransjespesifikke revisjonsguider
- Regnskapsstandarder (NGRS/IFRS)
- Den norske revisorforeningens ressurser`
};

export const errorMessages: Record<'service_unavailable' | 'ai_error' | 'general', string> = {
  service_unavailable: `${baseMessage} Tjenesten er midlertidig nede for vedlikehold.`,
  ai_error: `${baseMessage} AI-modellen returnerte en feil`,
  general: `${baseMessage} En teknisk feil oppstod.`
};

