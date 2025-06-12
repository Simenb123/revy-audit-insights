
import { supabase } from '@/integrations/supabase/client';

export const seedKnowledgeBase = async () => {
  console.log('🌱 Seeding knowledge base with app functionality articles...');
  
  try {
    // First, create categories
    const categories = [
      {
        name: 'App Funksjonalitet',
        description: 'Hvordan bruke appen effektivt',
        icon: 'BookOpen'
      },
      {
        name: 'Klienthåndtering',
        description: 'Alt om klientadministrasjon',
        icon: 'Users'
      },
      {
        name: 'Revisjonshandlinger',
        description: 'Revisjonshandlinger og prosedyrer',
        icon: 'FileCheck'
      },
      {
        name: 'FAQ',
        description: 'Ofte stilte spørsmål',
        icon: 'HelpCircle'
      }
    ];

    const { data: categoriesData, error: categoriesError } = await supabase
      .from('knowledge_categories')
      .upsert(categories, { onConflict: 'name' })
      .select();

    if (categoriesError) {
      console.error('Error creating categories:', categoriesError);
      return;
    }

    // Get category IDs
    const appFuncCat = categoriesData.find(c => c.name === 'App Funksjonalitet');
    const clientCat = categoriesData.find(c => c.name === 'Klienthåndtering');
    const auditCat = categoriesData.find(c => c.name === 'Revisjonshandlinger');
    const faqCat = categoriesData.find(c => c.name === 'FAQ');

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user found for seeding');
      return;
    }

    // Create knowledge articles
    const articles = [
      {
        category_id: appFuncCat?.id,
        title: 'Hvordan komme i gang med Revio',
        slug: 'hvordan-komme-i-gang',
        summary: 'En komplett guide til å komme i gang med Revio revisjonssystemet',
        content: `
# Velkommen til Revio - Din digitale revisjonspartner

Revio er et moderne revisjonssystem designet for norske revisjonsfirmaer. Her er hvordan du kommer i gang:

## Hovedfunksjoner
- **Dashboard**: Oversikt over alle dine klienter og oppgaver
- **Klientadministrasjon**: Administrer klientinformasjon og kontakter
- **Revisjonshandlinger**: Planlegg og gjennomfør revisjonsoppgaver
- **AI-assistent Revy**: Din intelligente revisjonspartner
- **Dataanalyse**: Analyser regnskapsdata med avanserte verktøy

## Navigering
- Bruk venstremenyen for å navigere mellom hovedseksjoner
- Høyre sidebar inneholder Revy AI-assistenten og verktøy
- Dashboard gir deg en oversikt over alt viktig

## Tips for å komme i gang
1. Start med å utforske Dashboard
2. Legg til din første klient under "Klienter"
3. Bruk Revy AI-assistenten for spørsmål og veiledning
4. Utforsk kunnskapsbasen for mer informasjon
        `,
        tags: ['guide', 'kom-i-gang', 'navigering'],
        status: 'published',
        author_id: user.id
      },
      {
        category_id: clientCat?.id,
        title: 'Klientadministrasjon i Revio',
        slug: 'klientadministrasjon',
        summary: 'Slik administrerer du klienter effektivt i Revio',
        content: `
# Klientadministrasjon

## Legge til nye klienter
1. Gå til "Klienter" i hovedmenyen
2. Klikk "Legg til klient"
3. Søk opp selskapet i Brønnøysundregistrene
4. Fyll ut nødvendig informasjon

## Klientinformasjon
For hver klient kan du administrere:
- Grunnleggende selskapsinformasjon
- Kontaktpersoner og roller
- Revisjonshistorikk og status
- Team og ressursallokering

## Klientstatus og fremdrift
Revio sporer automatisk:
- Revisjonsfase (planlegging, gjennomføring, avslutning)
- Fremdrift i prosent
- Forfallsfrister og milepæler
- Risikofaktorer og områder som krever oppmerksomhet

## Tips
- Bruk testdata-filteret for å skille mellom ekte og testklienter
- Sjekk announcement-indikatorer for viktige oppdateringer
- Bruk søkefunksjonen for å finne klienter raskt
        `,
        tags: ['klienter', 'administrasjon', 'brønnøysund'],
        status: 'published',
        author_id: user.id
      },
      {
        category_id: auditCat?.id,
        title: 'Revisjonshandlinger og prosedyrer',
        slug: 'revisjonshandlinger',
        summary: 'Guide til revisjonshandlinger i henhold til ISA-standarder',
        content: `
# Revisjonshandlinger i Revio

## Revisjonsplanlegging
Revio følger ISA-standarder for revisjon:
- **ISA 300**: Planlegging av revisjon
- **ISA 315**: Risikovurdering
- **ISA 330**: Revisorens respons på vurderte risikoer

## Handlingstyper
- **Risikoprosedyrer**: Innhenting av forståelse og risikovurdering
- **Kontrollprøving**: Testing av kontroller
- **Substansielle handlinger**: Detaljprøving og analytiske handlinger

## Workflow i Revio
1. **Planleggingsfasen**: Sett opp revisjonshandlinger basert på maler
2. **Gjennomføringsfasen**: Utfør handlinger og dokumenter funn
3. **Avslutningsfasen**: Konkluder og lag rapport

## Dokumentasjon
Alle handlinger må dokumenteres i henhold til ISA 230:
- Formål med handlingen
- Utførte prosedyrer
- Funn og konklusjoner
- Oppfølging av avvik
        `,
        tags: ['revisjon', 'ISA', 'prosedyrer', 'dokumentasjon'],
        status: 'published',
        author_id: user.id
      },
      {
        category_id: faqCat?.id,
        title: 'Ofte stilte spørsmål (FAQ)',
        slug: 'faq',
        summary: 'Svar på de mest vanlige spørsmålene om Revio',
        content: `
# Ofte stilte spørsmål

## Generelt om Revio

**Q: Hva er Revio?**
A: Revio er et moderne, norsk revisjonssystem som digitaliserer revisjonsprosessen med AI-støtte.

**Q: Hvordan logger jeg inn?**
A: Bruk din e-postadresse og passord. Kontakt din systemadministrator hvis du trenger tilgang.

**Q: Kan jeg bruke Revio på mobil?**
A: Ja, Revio er responsivt og fungerer på alle enheter.

## Klienter og data

**Q: Hvordan importerer jeg regnskapsdata?**
A: Gå til "Data Import" og velg filtype (Excel, CSV). Revio støtter de fleste regnskapssystemer.

**Q: Kan jeg søke opp klienter i Brønnøysundregistrene?**
A: Ja, når du legger til nye klienter kan du søke direkte i offentlige registre.

## AI-assistent Revy

**Q: Hvordan bruker jeg Revy AI-assistenten?**
A: Klikk på Revy-ikonet i høyre sidebar eller bruk den flytende assistenten. Still spørsmål på norsk.

**Q: Hvilke typer spørsmål kan Revy svare på?**
A: Revy kan hjelpe med revisjonsmetodikk, ISA-standarder, regnskapsanalyse og appfunksjonalitet.

**Q: Er Revy tilgjengelig 24/7?**
A: Ja, Revy er alltid tilgjengelig for å hjelpe deg.
        `,
        tags: ['faq', 'hjelp', 'support'],
        status: 'published',
        author_id: user.id
      }
    ];

    const { error: articlesError } = await supabase
      .from('knowledge_articles')
      .upsert(articles, { onConflict: 'slug' });

    if (articlesError) {
      console.error('Error creating articles:', articlesError);
    } else {
      console.log('✅ Knowledge base seeded successfully!');
    }

  } catch (error) {
    console.error('Error seeding knowledge base:', error);
  }
};
