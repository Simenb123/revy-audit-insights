import { supabase } from '@/integrations/supabase/client';

export const seedKnowledgeBase = async () => {
  console.log('🌱 Seeding knowledge base with expanded legal and technical content...');
  
  try {
    // First, create main categories with hierarchical structure
    const mainCategories = [
      {
        name: 'App Funksjonalitet',
        description: 'Hvordan bruke appen effektivt',
        icon: 'BookOpen',
        display_order: 1
      },
      {
        name: 'Klienthåndtering',
        description: 'Alt om klientadministrasjon',
        icon: 'Users',
        display_order: 2
      },
      {
        name: 'Revisjonshandlinger',
        description: 'Revisjonshandlinger og prosedyrer',
        icon: 'FileCheck',
        display_order: 3
      },
      {
        name: 'Lover og Forskrifter',
        description: 'Norske lover og forskrifter for revisjon og regnskap',
        icon: 'Scale',
        display_order: 4
      },
      {
        name: 'Revisjonsstandarder',
        description: 'ISA-standarder og RSA',
        icon: 'Shield',
        display_order: 5
      },
      {
        name: 'Regnskapsstandarder',
        description: 'NRS, IFRS og regnskapslovens bestemmelser',
        icon: 'Calculator',
        display_order: 6
      },
      {
        name: 'Sjekklister og Prosedyrer',
        description: 'Praktiske sjekklister og arbeidsrutiner',
        icon: 'CheckSquare',
        display_order: 7
      },
      {
        name: 'FAQ',
        description: 'Ofte stilte spørsmål',
        icon: 'HelpCircle',
        display_order: 8
      }
    ];

    const { data: categoriesData, error: categoriesError } = await supabase
      .from('knowledge_categories')
      .upsert(mainCategories, { onConflict: 'name' })
      .select();

    if (categoriesError) {
      console.error('Error creating main categories:', categoriesError);
      return;
    }

    // Create subcategories for Laws and Regulations
    const lawsCategory = categoriesData.find(c => c.name === 'Lover og Forskrifter');
    const auditStandardsCategory = categoriesData.find(c => c.name === 'Revisjonsstandarder');
    const accountingStandardsCategory = categoriesData.find(c => c.name === 'Regnskapsstandarder');
    const checklistsCategory = categoriesData.find(c => c.name === 'Sjekklister og Prosedyrer');

    const subcategories = [
      // Laws and Regulations subcategories
      {
        name: 'Regnskapsloven',
        description: 'Lov om årsregnskap mv.',
        parent_category_id: lawsCategory?.id,
        display_order: 1,
        icon: 'FileText'
      },
      {
        name: 'Revisorloven',
        description: 'Lov om revisjon og revisorer',
        parent_category_id: lawsCategory?.id,
        display_order: 2,
        icon: 'Eye'
      },
      {
        name: 'Aksjeloven',
        description: 'Lov om aksjeselskaper',
        parent_category_id: lawsCategory?.id,
        display_order: 3,
        icon: 'Building'
      },
      {
        name: 'Bokføringsloven',
        description: 'Lov om bokføring',
        parent_category_id: lawsCategory?.id,
        display_order: 4,
        icon: 'Book'
      },
      {
        name: 'Skatteloven',
        description: 'Skatteloven og forskrifter',
        parent_category_id: lawsCategory?.id,
        display_order: 5,
        icon: 'Receipt'
      },
      
      // Audit Standards subcategories
      {
        name: 'ISA 200-299 Generelle prinsipper',
        description: 'Grunnleggende prinsipper og ansvar',
        parent_category_id: auditStandardsCategory?.id,
        display_order: 1,
        icon: 'Foundation'
      },
      {
        name: 'ISA 300-499 Risikovurdering',
        description: 'Planlegging og risikovurdering',
        parent_category_id: auditStandardsCategory?.id,
        display_order: 2,
        icon: 'AlertTriangle'
      },
      {
        name: 'ISA 500-599 Revisjonshandlinger',
        description: 'Revisjonshandlinger og dokumentasjon',
        parent_category_id: auditStandardsCategory?.id,
        display_order: 3,
        icon: 'Search'
      },
      {
        name: 'ISA 600-699 Spesielle områder',
        description: 'Konsernrevisjon og spesialområder',
        parent_category_id: auditStandardsCategory?.id,
        display_order: 4,
        icon: 'Network'
      },
      {
        name: 'ISA 700-799 Rapportering',
        description: 'Konklusjoner og rapportering',
        parent_category_id: auditStandardsCategory?.id,
        display_order: 5,
        icon: 'FileOutput'
      },
      {
        name: 'RSA',
        description: 'Revisjonsstandarder for små foretak',
        parent_category_id: auditStandardsCategory?.id,
        display_order: 6,
        icon: 'Home'
      },

      // Accounting Standards subcategories
      {
        name: 'NRS',
        description: 'Norske regnskapsstandarder',
        parent_category_id: accountingStandardsCategory?.id,
        display_order: 1,
        icon: 'Flag'
      },
      {
        name: 'IFRS',
        description: 'International Financial Reporting Standards',
        parent_category_id: accountingStandardsCategory?.id,
        display_order: 2,
        icon: 'Globe'
      },
      {
        name: 'God regnskapsskikk',
        description: 'Prinsipper for god regnskapsskikk',
        parent_category_id: accountingStandardsCategory?.id,
        display_order: 3,
        icon: 'Award'
      },

      // Checklists subcategories
      {
        name: 'Årsoppgjørsjekklister',
        description: 'Sjekklister for årsoppgjørsrevisjon',
        parent_category_id: checklistsCategory?.id,
        display_order: 1,
        icon: 'Calendar'
      },
      {
        name: 'Kvalitetskontroll',
        description: 'Kvalitetskontrollprosedyrer',
        parent_category_id: checklistsCategory?.id,
        display_order: 2,
        icon: 'ShieldCheck'
      },
      {
        name: 'Etterlevelse',
        description: 'Etterlevelsessjekklister',
        parent_category_id: checklistsCategory?.id,
        display_order: 3,
        icon: 'CheckCircle'
      }
    ];

    const { data: subcategoriesData, error: subcategoriesError } = await supabase
      .from('knowledge_categories')
      .upsert(subcategories, { onConflict: 'name' })
      .select();

    if (subcategoriesError) {
      console.error('Error creating subcategories:', subcategoriesError);
      return;
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user found for seeding');
      return;
    }

    // Get category references for article creation
    const appFuncCat = categoriesData.find(c => c.name === 'App Funksjonalitet');
    const clientCat = categoriesData.find(c => c.name === 'Klienthåndtering');
    const auditCat = categoriesData.find(c => c.name === 'Revisjonshandlinger');
    const faqCat = categoriesData.find(c => c.name === 'FAQ');
    
    // Get some new subcategory references
    const regnskapslovenCat = subcategoriesData?.find(c => c.name === 'Regnskapsloven');
    const isa300Cat = subcategoriesData?.find(c => c.name === 'ISA 300-499 Risikovurdering');
    const nrsCat = subcategoriesData?.find(c => c.name === 'NRS');

    // Create expanded knowledge articles
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
        status: 'published' as const,
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
        status: 'published' as const,
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
        status: 'published' as const,
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
        status: 'published' as const,
        author_id: user.id
      },

      // NEW ARTICLES FOR EXPANDED CATEGORIES
      {
        category_id: regnskapslovenCat?.id,
        title: 'Innføring i regnskapsloven',
        slug: 'innforing-regnskapsloven',
        summary: 'Grunnleggende om regnskapsloven og dens anvendelse',
        content: `
# Regnskapsloven - Grunnleggende prinsipper

## Lovens formål
Regnskapsloven (lov 17. juli 1998 nr. 56) regulerer regnskapsføring og årsregnskap for norske foretak.

## Viktige paragrafer
- **§ 3-1**: Grunnleggende regnskapsprinsipper
- **§ 3-2a**: Måleregler for eiendeler og gjeld
- **§ 6-1**: Årsregnskapets innhold
- **§ 7-1**: Revisjonsplikt

## Anvendelsesområde
- Gjelder alle regnskapspliktige etter bokføringsloven
- Særregler for store foretak
- Unntak for små foretak (forenklet anvendelse)

## Sentrale prinsipper
- Forsiktighetsprinsippet
- Sammenlignbarhet
- Fortsatt drift
- Konsistens

## Praktisk anvendelse i Revio
Revio hjelper deg med å sikre at klientens regnskap følger regnskapslovens krav gjennom automatiske kontroller og sjekklister.
        `,
        tags: ['regnskapsloven', 'lovgivning', 'prinsipper'],
        status: 'published' as const,
        author_id: user.id
      },
      {
        category_id: isa300Cat?.id,
        title: 'ISA 315 - Identifisering og vurdering av risikoer',
        slug: 'isa-315-risikovurdering',
        summary: 'Detaljert guide til ISA 315 om risikovurdering',
        content: `
# ISA 315 - Identifisering og vurdering av risikoer for vesentlig feilinformasjon gjennom forståelse av foretaket og dets omgivelser

## Formål
ISA 315 krever at revisor skal identifisere og vurdere risikoer for vesentlig feilinformasjon.

## Hovedkrav
1. **Forståelse av foretaket**
   - Bransje, regulatoriske forhold
   - Eierskap og styring
   - Forretningsmodell og strategi

2. **Forståelse av interne kontroller**
   - Kontrollmiljø
   - Risikovurderingsprosess
   - Informasjonssystemer

3. **Risikovurdering**
   - Identifisere risikoer
   - Vurdere risikosannsynlighet
   - Klassifisere betydelige risikoer

## Praktisk anvendelse
- Gjennomfør forespørsler til ledelsen
- Utfør analytiske handlinger
- Observer prosesser og aktiviteter
- Inspiser dokumenter

## Dokumentasjonskrav
- Forståelse av foretaket og kontroller
- Identifiserte risikoer og vurderinger
- Grunnlag for risikovurderingene

## I Revio
Bruk Revios risikomatrise og automatiske analytiske handlinger for å systematisere ISA 315-arbeidet.
        `,
        tags: ['ISA-315', 'risikovurdering', 'revisjonsstandarder'],
        status: 'published' as const,
        author_id: user.id
      },
      {
        category_id: nrsCat?.id,
        title: 'NRS 8 - God regnskapsskikk for små foretak',
        slug: 'nrs-8-sma-foretak',
        summary: 'Veiledning for anvendelse av NRS 8',
        content: `
# NRS 8 - God regnskapsskikk for små foretak

## Anvendelsesområde
NRS 8 gjelder for små foretak som definert i regnskapsloven § 1-5.

## Kriterier for små foretak
Et foretak regnes som lite hvis det ikke overskrider mer enn én av disse størrelsene:
- Salgsinntekt: 70 millioner kroner
- Balansesum: 35 millioner kroner
- Antall ansatte: 50 årsverk

## Forenklinger for små foretak
- **Balanse**: Forenklet oppstilling
- **Resultatregnskap**: Færre linjer
- **Noter**: Reduserte krav
- **Kontantstrømoppstilling**: Ikke krav

## Viktige områder
- Kortsiktige fordringer og gjeld
- Varelager og hovedregelen
- Anleggsmidler og avskrivninger
- Finansinstrumenter (forenklet)

## Måleregler
- Anskaffelseskost som hovedregel
- Forsiktighetsprinsippet
- Laveste verdis prinsipp for omløpsmidler

## Særlige bestemmelser
- Tilknyttede selskaper
- Datterselskaper
- Morselskapsregnskap

## Praktiske tips
Revio tilbyr maler og sjekklister spesielt tilpasset små foretak etter NRS 8.
        `,
        tags: ['NRS-8', 'små-foretak', 'regnskapsstandarder'],
        status: 'published' as const,
        author_id: user.id
      }
    ];

    const { error: articlesError } = await supabase
      .from('knowledge_articles')
      .upsert(articles, { onConflict: 'slug' });

    if (articlesError) {
      console.error('Error creating articles:', articlesError);
    } else {
      console.log('✅ Expanded knowledge base seeded successfully!');
      console.log('📚 Added categories for:');
      console.log('  - Lover og Forskrifter (5 subcategories)');
      console.log('  - Revisjonsstandarder (6 subcategories)');
      console.log('  - Regnskapsstandarder (3 subcategories)');
      console.log('  - Sjekklister og Prosedyrer (3 subcategories)');
    }

  } catch (error) {
    console.error('Error seeding expanded knowledge base:', error);
  }
};
