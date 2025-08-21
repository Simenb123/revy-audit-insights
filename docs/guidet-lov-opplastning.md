# Guidet Lov-opplastning

Dette systemet gir en forenklet tilnærming til juridisk dokumentimport ved å splitte prosessen i håndterbare steg.

## Motivasjon

Den opprinnelige Excel-templaten med 3 faner (Dokumenttyper, Dokumenter, Bestemmelser) var overveldende og kompleks for brukere. Det nye systemet fokuserer på:

1. **En lov om gangen** - Heller enn å håndtere alle lover samtidig
2. **Forenklede templates** - Kun 2 faner: Kapitler og Paragrafer  
3. **Guidet prosess** - Steg-for-steg wizard som veileder brukeren

## Arkitektur

### Komponenter

- **`LawSelectionWizard`** - Hovedkomponent for guidet opplastning
- **`LawSpecificExcelService`** - Forenklet Excel-service for lov-spesifikke templates
- **`LegalKnowledgeManager`** - Oppdatert med toggle mellom wizard og hovedvisning

### Arbeidsflyt

#### Steg 1: Velg lov
- Brukeren kan velge fra eksisterende lover i systemet
- Eller opprette en helt ny lov med identifikator og navn

#### Steg 2: Last opp struktur
- Generer lov-spesifikk Excel-template med kun 2 faner
- Last opp utfylt template med kapitler og paragrafer
- Validering og feilhåndtering

#### Steg 3: Bekreft import
- Forhåndsvisning av parsede data
- Import til database med atomiske transaksjoner
- Automatisk hierarki-generering

## Excel Template Struktur

### Kapitler-fane
```
Kapittelnummer | Kapittel tittel | Beskrivelse | Sorteringsrekkefølge
1             | Innledende      | Beskrivelse | 1
2             | Krav til...     | Beskrivelse | 2
```

### Paragrafer-fane  
```
Kapittelnr | Paragrafnr | Tittel    | Paragraftekst | Type     | Sortering
1         | 1-1        | Formål    | Tekst...      | paragraf | 1
1         | 1-2        | Område    | Tekst...      | paragraf | 2
```

## Forbedringer over original

1. **Redusert kompleksitet** - Fra 3 til 2 faner
2. **Lov-spesifikke templates** - Skreddersydd for hver lov
3. **Bedre validering** - Hierarki og duplikatsjekk
4. **Progresjonsindikatorer** - Visuell fremgang gjennom prosessen
5. **Robust feilhåndtering** - Detaljerte feilmeldinger og rettingsforslag

## Tekniske detaljer

### Hierarki-generering
- Automatisk generering av `hierarchy_path`: `lovidentifikator.kap1.§1-1`
- Parent-child relasjoner mellom kapitler og paragrafer
- Sorteringsrekkefølge for konsistent visning

### Validering
- Sjekk for manglende felt
- Duplikat-validering innenfor samme kapittel
- Hierarki-konsistens mellom kapitler og paragrafer
- Lov-identifikator unkthet

### Database-operasjoner
- Atomiske transaksjoner for konsistens
- Batch-inserts for ytelse
- Automatisk timestamp-generering
- UUID-generering for alle poster

## Bruk

1. Gå til `/fag/juridisk`
2. Klikk "Guidet opplastning"
3. Følg 3-stegs wizarden
4. Templates lastes ned automatisk for valgt lov
5. Upload utfylt Excel-fil
6. Bekreft og importer til database

Dette systemet gjør juridisk dokumentimport mye mer tilgjengelig og mindre feilutsatt.