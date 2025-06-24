
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BookOpen, Plus, RefreshCw } from 'lucide-react';

const TestDataCreator = () => {
  const [isCreating, setIsCreating] = useState(false);

  const testArticles = [
    {
      title: "ISA 315 - Identifisering og vurdering av risiko for vesentlig feilinformasjon",
      slug: "isa-315-risikovurdering",
      summary: "Veiledning for risikovurdering i henhold til ISA 315, inkludert identifisering av risikoområder og planlegging av revisjonsrespons.",
      content: `# ISA 315 - Risikovurdering

ISA 315 er en sentral standard som krever at revisor identifiserer og vurderer risiko for vesentlig feilinformasjon på regnskaps- og påstandsnivå.

## Hovedkrav:
- Gjennomgang av enhetens virksomhet og miljø
- Identifisering av betydelige risikoer
- Vurdering av internkontroll
- Dokumentasjon av risikovurderingen

## Praktisk gjennomføring:
1. Innhent forståelse av enheten
2. Identifiser og vurder risiko
3. Vurder kontrollmiljøet
4. Dokumenter konklusjoner

Risikovurderingen danner grunnlag for den videre revisjonsplanleggingen.`,
      reference_code: "ISA 315",
      status: 'published' as const,
      category_name: 'Revisjonsstandarder'
    },
    {
      title: "Materialitetsvurdering i revisjon",
      slug: "materialitetsvurdering-revisjon",
      summary: "Praktisk veiledning for fastsettelse av materialitet, ytelsesmaterialitet og bagatellgrense i revisjonsoppdrag.",
      content: `# Materialitetsvurdering i revisjon

Materialitet er et sentralt konsept som påvirker alle deler av revisjonsarbeidet.

## Typer materialitet:
- **Samlet materialitet**: Største beløp med feilinformasjon som ikke påvirker brukernes beslutninger
- **Ytelsesmaterialitet**: Lavere beløp for å redusere risiko for uoppdagede feil
- **Bagatellgrense**: Grense under hvilken feil ikke akkumuleres

## Fastsettelse:
1. Velg hensiktsmessig benchmark (resultat, omsetning, eiendeler)
2. Anvend passende prosentsats (0,5-5% avhengig av benchmark)
3. Vurder kvalitative faktorer
4. Fastsett ytelsesmaterialitet (50-75% av samlet materialitet)
5. Sett bagatellgrense (5-10% av samlet materialitet)

Materialitetsvurderingen må oppdateres dersom forholdene endres.`,
      reference_code: "ISA 320",
      status: 'published' as const,
      category_name: 'Revisjonsstandarder'
    },
    {
      title: "Revisjon av varelager",
      slug: "revisjon-varelager",
      summary: "Revisjonshandlinger og kontrollprosedyrer for varelager, inkluderd varetelling og verdivurdering.",
      content: `# Revisjon av varelager

Varelager er ofte et vesentlig og risikofylt område som krever spesiell oppmerksomhet.

## Hovedrisikoer:
- Eksistens og fullstendighet
- Verdivurdering (laveste verdis prinsipp)
- Inkurans og foreldelse
- Regnskapsføring og periodisering

## Revisjonshandlinger:
1. **Varetelling**: Observasjon av klientens varetelling
2. **Stikkprøver**: Kontroll fra lager til regnskap og omvendt
3. **Verdivurdering**: Kontroll av innkjøpspriser og salgbarhet
4. **Cut-off**: Kontroll av periodiseringer ved årsskiftet
5. **Inkurans**: Vurdering av utgåtte eller ikke-salgbare varer

## Dokumentasjon:
- Observasjonsprotokoll fra varetelling
- Stikkprøveoversikt med konklusjoner
- Verdivurderingsanalyse
- Cut-off testing

Varelagerrevisjonen krever både detaljerte tester og analytiske handlinger.`,
      reference_code: null,
      status: 'published' as const,
      category_name: 'Fagartikler'
    },
    {
      title: "Årsavslutning og regnskapsavleggelse",
      slug: "aarsavslutning-regnskap",
      summary: "Veiledning for årsavslutningsprosessen, inkludert periodiseringer, avsetninger og presentasjon av årsregnskapet.",
      content: `# Årsavslutning og regnskapsavleggelse

Årsavslutningen er en kritisk prosess som sikrer korrekt regnskapsavleggelse.

## Hovedaktiviteter:
1. **Periodiseringer**: Påløpte inntekter og kostnader
2. **Avsetninger**: Forpliktelser og estimerte kostnader  
3. **Verdijusteringer**: Nedskrivninger og oppskrivninger
4. **Klassifisering**: Kort- vs langsiktige poster
5. **Presentasjon**: Noter og tilleggsopplysninger

## Kvalitetssikring:
- Analytisk gjennomgang av resultat og balanse
- Kontroll av nøkkeltall og forhold
- Gjennomgang av usedvanlige transaksjoner
- Verifisering av compliance med regnskapsstandarder

## Dokumentasjon:
- Arbeidsark med avstemminger
- Begrunnelser for estimater og vurderinger
- Kontrollspor for vesentlige justeringer

En systematisk tilnærming sikrer kvalitet i regnskapsavleggelsen.`,
      reference_code: null,
      status: 'published' as const,
      category_name: 'Fagartikler'
    },
    {
      title: "Dokumentasjonskrav i revisjon per ISA 230",
      slug: "dokumentasjonskrav-isa-230",
      summary: "Krav til revisjonsregnskapsføring og dokumentasjon i henhold til ISA 230, inkludert form, innhold og oppbevaring.",
      content: `# Dokumentasjonskrav i revisjon per ISA 230

ISA 230 setter krav til revisjonsregnskapsføring som sikrer sporbarhet og kvalitet.

## Hovedkrav:
- **Tilstrekkelig og hensiktsmessig**: Dokumentasjonen må understøtte konklusjoner
- **Sporbarhet**: Klar sammenheng mellom arbeid utført og konklusjoner
- **Gjennomgang**: Mulighet for erfaren revisor å forstå arbeidet
- **Kvalitetskontroll**: Dokumentasjon av gjennomgang og godkjenning

## Innhold som må dokumenteres:
1. Revisjonsplanlegging og strategi
2. Risikovurdering og respons
3. Arbeid utført og resultater oppnådd
4. Konklusjoner trukket
5. Vesentlige spørsmål og løsninger

## Praktisk gjennomføring:
- Strukturerte arbeidsark og sjekklister
- Signering og datering av utført arbeid
- Cross-referencing mellom dokumenter
- Arkivering innen 60 dager etter rapportdato

God dokumentasjon er grunnlag for forsvarlig revisjon.`,
      reference_code: "ISA 230",
      status: 'published' as const,
      category_name: 'Revisjonsstandarder'
    }
  ];

  const createTestData = async () => {
    setIsCreating(true);
    try {
      console.log('🚀 Starter opprettelse av testartikler...');

      // First, get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error('Du må være logget inn for å opprette testdata');
        return;
      }

      // Create categories if they don't exist
      const categories = ['Revisjonsstandarder', 'Fagartikler'];
      const categoryMap = new Map();

      for (const categoryName of categories) {
        const { data: existingCategory } = await supabase
          .from('knowledge_categories')
          .select('id, name')
          .eq('name', categoryName)
          .single();

        if (existingCategory) {
          categoryMap.set(categoryName, existingCategory.id);
        } else {
          const { data: newCategory, error } = await supabase
            .from('knowledge_categories')
            .insert({
              name: categoryName,
              description: `Kategori for ${categoryName}`,
              display_order: categoryName === 'Revisjonsstandarder' ? 1 : 2
            })
            .select()
            .single();

          if (error) {
            console.error('Feil ved opprettelse av kategori:', error);
            throw error;
          }
          categoryMap.set(categoryName, newCategory.id);
        }
      }

      // Create articles
      let createdCount = 0;
      let skippedCount = 0;

      for (const article of testArticles) {
        // Check if article already exists
        const { data: existing } = await supabase
          .from('knowledge_articles')
          .select('id')
          .eq('slug', article.slug)
          .single();

        if (existing) {
          console.log(`⏭️ Artikkel "${article.title}" eksisterer allerede`);
          skippedCount++;
          continue;
        }

        const categoryId = categoryMap.get(article.category_name);
        
        const { error } = await supabase
          .from('knowledge_articles')
          .insert({
            title: article.title,
            slug: article.slug,
            summary: article.summary,
            content: article.content,
            reference_code: article.reference_code,
            status: article.status,
            category_id: categoryId,
            author_id: user.id,
            published_at: new Date().toISOString(),
            view_count: 0
          });

        if (error) {
          console.error(`Feil ved opprettelse av "${article.title}":`, error);
          throw error;
        }

        createdCount++;
        console.log(`✅ Opprettet artikkel: "${article.title}"`);
      }

      // Generate embeddings for the new articles
      console.log('🔄 Genererer embeddings...');
      const { data: embeddingResult, error: embeddingError } = await supabase.functions.invoke('generate-embeddings', {
        body: {}
      });

      if (embeddingError) {
        console.error('Feil ved generering av embeddings:', embeddingError);
        // Don't throw error here, since articles are created
      } else {
        console.log('✅ Embeddings generert:', embeddingResult);
      }

      toast.success(`Testdata opprettet! ${createdCount} nye artikler lagt til. ${skippedCount} artikler eksisterte allerede.`);

    } catch (error) {
      console.error('Feil ved opprettelse av testdata:', error);
      toast.error('Kunne ikke opprette testdata: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Opprett testdata for kunnskapsbase
        </CardTitle>
        <CardDescription>
          Legg til eksempel fagartikler og generer embeddings for AI-Revi
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Oppretter {testArticles.length} fagartikler:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>ISA 315 - Risikovurdering</li>
              <li>Materialitetsvurdering</li>
              <li>Revisjon av varelager</li>
              <li>Årsavslutning og regnskapsavleggelse</li>
              <li>Dokumentasjonskrav per ISA 230</li>
            </ul>
          </div>
          
          <Button 
            onClick={createTestData} 
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Oppretter testdata...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Opprett testdata
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestDataCreator;
