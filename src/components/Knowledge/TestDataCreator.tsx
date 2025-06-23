
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Database, BookOpen, Plus } from 'lucide-react';

const TestDataCreator = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  const testArticles = [
    {
      title: "ISA 315 - Identifisering og vurdering av risiko for vesentlig feilinformasjon",
      slug: "isa-315-risikovurdering",
      summary: "ISA 315 setter krav til revisors forståelse av enheten og dens omgivelser, inkludert enhetens internkontroll, for å identifisere og vurdere risiko.",
      content: `ISA 315 "Identifisering og vurdering av risiko for vesentlig feilinformasjon gjennom forståelse av enheten og dens omgivelser" er en grunnleggende standard som setter rammene for hvordan revisor skal forstå klienten.

## Hovedkrav i ISA 315

### 1. Forståelse av enheten og dens omgivelser
Revisor skal skaffe seg forståelse av:
- Enhetens bransje, regulatoriske faktorer og andre eksterne faktorer
- Enhetens art, inkludert valg og anvendelse av regnskapsprinsipper
- Enhetens mål og strategier og tilhørende forretningsrisiko
- Måling og gjennomgang av enhetens finansielle resultater
- Enhetens internkontroll

### 2. Risikoidentifisering og -vurdering
Revisor skal:
- Identifisere risiko for vesentlig feilinformasjon på regnskaps- og påstandsnivå
- Vurdere den identifiserte risikoen og fastslå om den relaterer seg til spesifikke påstander
- Vurdere sannsynligheten for at risikoen vil resultere i vesentlig feilinformasjon

### 3. Betydelige risiki
For risiki som krever særlig oppmerksomhet (betydelige risiki), skal revisor:
- Forstå enhetens kontroller som er relevante for denne risikoen
- Evaluere utformingen av disse kontrollene
- Fastslå om kontrollene er implementert

### 4. Dokumentasjon
Revisor skal dokumentere:
- Diskusjoner i revisjonsteamet om risiko for vesentlig feilinformasjon
- Nøkkelelementer i forståelsen av enheten og dens omgivelser
- Identifiserte og vurderte risiki på regnskaps- og påstandsnivå
- Betydelige risiki som er identifisert og vurdert

## Praktiske tips for implementering

1. **Start tidlig**: Risikovurderingen bør starte i planleggingsfasen
2. **Involver hele teamet**: Sørg for at alle teammedlemmer deltar i risikodiskusjoner
3. **Dokumenter løpende**: Hold dokumentasjonen oppdatert gjennom revisjonen
4. **Koble til ISA 330**: Sørg for at risikovurderingen kobles til utformingen av revisjonshandlinger

Standarden er grunnleggende for all revisjonsplanlegging og må forstås grundig av alle revisorer.`,
      category_id: null,
      reference_code: "ISA 315"
    },
    {
      title: "ISA 230 - Revisjonsdokumentasjon",
      slug: "isa-230-dokumentasjon",
      summary: "ISA 230 setter krav til revisjonsdokumentasjon som grunnlag for revisjonsuttalelsen og for å dokumentere at revisjonen er utført i samsvar med ISA.",
      content: `ISA 230 "Revisjonsdokumentasjon" etablerer standarder og gir veiledning om dokumentasjon i forbindelse med revisjon av regnskap.

## Formålet med revisjonsdokumentasjon

Revisjonsdokumentasjon skal:
- Gi tilstrekkelig og hensiktsmessig revisjonsbevis som grunnlag for revisjonsuttalelsen
- Vise at revisjonen er planlagt og utført i samsvar med ISA og relevante lovkrav
- Hjelpe revisjonsteamet med å planlegge og utføre revisjonen
- Gjøre det mulig for erfarne revisorer å forstå arten, tidspunktet og omfanget av revisjonshandlinger
- Dokumentere konklusjoner og grunnlaget for betydelige vurderinger

## Krav til dokumentasjon

### Innhold
Revisjonsdokumentasjon skal omfatte:
- Revisjonsplan og revisjonsprogram
- Arten, tidspunktet og omfanget av revisjonshandlinger utført
- Resultater av revisjonshandlinger og revisjonsbevis innhentet
- Saker som krever betydelig profesjonell dømmekraft og konklusjoner

### Form og innhold
- Dokumentasjonen skal være tilstrekkelig detaljert til at en erfaren revisor kan forstå hva som er gjort
- Skal inkludere identifikasjon av hvem som utførte arbeidet og datoen
- Skal inkludere hvem som gjennomgikk arbeidet og datoen for gjennomgangen

### Dokumentasjon av betydelige saker
For saker som krever betydelig profesjonell dømmekraft skal dokumentasjonen omfatte:
- Betydelige saker som oppsto under revisjonen
- Konklusjoner som ble trukket
- Betydelige profesjonelle vurderinger som ble foretatt for å trekke konklusjonene

## Assembling og arkivering

### Tidsfrist for assembling
- Revisjonsdokumentasjonen skal assembleres innen 60 dager etter datoen for revisjonsberetningen
- Etter denne datoen skal dokumentene ikke slettes eller kasseres før oppbevaringsperioden er utløpt

### Oppbevaringstid
- Minimum 5 år fra datoen for revisjonsberetningen
- Kan være lengre basert på lovkrav eller firmapolitikk

### Endringer etter assembling
- Dokumentasjon kan ikke endres etter assembling-datoen
- Hvis endringer er nødvendige, skal dette dokumenteres separat med årsak og dato

## Praktiske anbefalinger

1. **Dokumenter løpende**: Ikke vent til slutten av revisjonen
2. **Vær spesifikk**: Unngå vage formuleringer og konklusjoner
3. **Strukturer systematisk**: Bruk konsistente maler og strukturer
4. **Quality control**: Implementer gjennomgangsrutiner før ferdigstillelse
5. **Elektronisk arkivering**: Sikre god backup og tilgangskontroll

God revisjonsdokumentasjon er grunnleggende for kvalitet i revisjonsarbeidet og beskyttelse mot ansvar.`,
      category_id: null,
      reference_code: "ISA 230"
    },
    {
      title: "Materialitetsvurdering i revisjon",
      slug: "materialitet-revisjon",
      summary: "Materialitet er et grunnleggende konsept i revisjon som påvirker planlegging, gjennomføring og konklusjon av revisjonen.",
      content: `Materialitet er et sentralt konsept i revisjon som påvirker alle aspekter av revisjonsarbeidet, fra planlegging til konklusjon.

## Hva er materialitet?

Materialitet refererer til størrelsen på utelatelser eller feil i regnskapet som, individuelt eller samlet, med rimelig grad av sannsynlighet kunne påvirke økonomiske beslutninger som brukerne av regnskapet tar basert på regnskapet.

## Typer materialitet

### 1. Materialitet for regnskapet som helhet
- Den høyeste verdien av feil som kan aksepteres for regnskapet totalt
- Fastsettes tidlig i planleggingsfasen
- Baseres normalt på en prosentsats av en relevant benchmark

### 2. Ytelsesmaterialitet
- Settes lavere enn materialitet for regnskapet som helhet
- Reduserer risikoen for at samlet ikke-korrigerte feil overstiger materialitet
- Typisk 50-75% av materialitet for regnskapet som helhet

### 3. Spesifikk materialitet
- Kan fastsettes for bestemte transaksjonsklasser, kontosaldoer eller noteopplysninger
- Eksempel: Nærstående parter, ledelsens godtgjørelse

### 4. Tydelig trivielle beløp
- Beløp under dette nivået trenger ikke aggregeres
- Typisk 3-5% av materialitet for regnskapet som helhet

## Fastsettelse av materialitet

### Benchmark-valg
Vanlige benchmarks inkluderer:
- **Resultat før skatt** (5-10%): For profittorienterte enheter
- **Totale inntekter** (0,5-1%): For enheter med lav margin
- **Netto eiendeler** (1-2%): For investeringsselskaper
- **Totale kostnader** (1-2%): For non-profit organisasjoner

### Faktorer som påvirker
- Enhetens størrelse og art
- Interessentenes behov
- Regnskapsmessig stabilitet
- Økonomiske forhold

## Revisjon av materialitetsvurdering

Materialitet skal revurderes dersom:
- Det fremkommer informasjon som ville ført til en annen vurdering
- Forholdene endres betydelig under revisjonen
- Planlagt benchmark viser seg uegnet

## Praktisk anvendelse

### I planleggingsfasen
- Fastsett materialitet for regnskapet som helhet
- Beregn ytelsesmaterialitet
- Identifiser områder som kan kreve spesifikk materialitet

### Under gjennomføringen
- Evaluer feil mot materialitetsnivåer
- Vurder behov for justering av materialitet
- Dokumenter alle materialitetsvurderinger

### Ved konklusjon
- Aggreger alle identifiserte feil
- Vurder om totale feil overstiger materialitet
- Vurdér effekten på revisjonsuttalelsen

## Dokumentasjonskrav

Dokumenter:
- Materialitet for regnskapet som helhet og grunnlaget for fastsettelsen
- Ytelsesmaterialitet
- Eventuelle revisjoner av materialitet og årsakene til dette
- Tydelig trivielle beløp

God materialitetsvurdering er kritisk for en effektiv og effektiv revisjon.`,
      category_id: null,
      reference_code: null
    }
  ];

  const createTestData = async () => {
    if (!session?.user?.id) {
      toast({
        title: "Feil",
        description: "Du må være logget inn for å opprette testdata",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      // First, create a default category if none exists
      const { data: existingCategories } = await supabase
        .from('knowledge_categories')
        .select('id')
        .limit(1);

      let categoryId = null;
      if (!existingCategories || existingCategories.length === 0) {
        const { data: newCategory, error: categoryError } = await supabase
          .from('knowledge_categories')
          .insert({
            name: "Revisjonstandarder",
            description: "ISA-standarder og revisjonsmetodikk",
            icon: "BookOpen"
          })
          .select()
          .single();

        if (categoryError) throw categoryError;
        categoryId = newCategory.id;
      } else {
        categoryId = existingCategories[0].id;
      }

      // Get default content type
      const { data: contentTypes } = await supabase
        .from('content_types')
        .select('id')
        .eq('name', 'fagartikkel')
        .limit(1);

      let contentTypeId = null;
      if (contentTypes && contentTypes.length > 0) {
        contentTypeId = contentTypes[0].id;
      } else {
        // Create default content type if it doesn't exist
        const { data: newContentType, error: contentTypeError } = await supabase
          .from('content_types')
          .insert({
            name: 'fagartikkel',
            display_name: 'Fagartikkel',
            description: 'Standard fagartikkel',
            icon: 'file-text',
            color: '#3B82F6',
            sort_order: 1
          })
          .select()
          .single();

        if (contentTypeError) throw contentTypeError;
        contentTypeId = newContentType.id;
      }

      // Create test articles
      const articlesToCreate = testArticles.map(article => ({
        ...article,
        category_id: categoryId,
        content_type_id: contentTypeId,
        author_id: session.user.id,
        status: 'published' as const,
        published_at: new Date().toISOString()
      }));

      const { error: articlesError } = await supabase
        .from('knowledge_articles')
        .insert(articlesToCreate);

      if (articlesError) throw articlesError;

      toast({
        title: "Testdata opprettet!",
        description: `${testArticles.length} fagartikler er lagt til i kunnskapsbasen`,
      });

    } catch (error: any) {
      console.error('Error creating test data:', error);
      toast({
        title: "Feil ved opprettelse av testdata",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Testdata for AI-Revy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Opprett fagartikler i kunnskapsbasen så AI-Revy kan gi bedre svar basert på fagstoff.
        </p>
        
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Artikler som vil bli opprettet:</h4>
          <ul className="text-xs space-y-1">
            <li className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              ISA 315 - Risikovurdering
            </li>
            <li className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              ISA 230 - Dokumentasjon
            </li>
            <li className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              Materialitetsvurdering
            </li>
          </ul>
        </div>

        <Button 
          onClick={createTestData} 
          disabled={isCreating || !session?.user?.id}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          {isCreating ? 'Oppretter...' : 'Opprett fagartikler'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TestDataCreator;
