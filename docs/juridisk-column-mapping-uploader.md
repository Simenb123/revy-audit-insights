# Juridisk Column Mapping Uploader

Dette systemet gir en enkel måte å laste opp juridiske bestemmelser ved å gjenbruke den eksisterende column mapping-funksjonaliteten.

## Funksjonalitet

### 1. Lov-basert Opplastning
- Klikk på en eksisterende lov i juridisk kunnskapsbase
- Åpner spesialisert opplaster for den valgte loven
- Pre-populert med lov-identifikator

### 2. Smart Kolonnemapping
- Intelligent gjenkjenning av norske juridiske termer
- AI-forslag basert på kolonnenavn og innhold
- Samme workflow som saldobalanse/hovedbok opplasting
- Live validering av mappings

### 3. Feltdefinisjoner

Systemet støtter følgende standardfelter:

| Felt | Beskrivelse | Påkrevd | Eksempel |
|------|-------------|---------|----------|
| **Bestemmelse ID** | Unik identifikator | Ja | `rskl-1-1` |
| **Lov ID/Kode** | Lov identifikator (auto-utfylt) | Ja | `regnskapsloven` |
| **Type** | Bestemmelsestype | Ja | `section`, `subsection` |
| **Paragrafnummer** | § nummer | Ja | `1-1`, `2-3` |
| **Tittel** | Tittel på bestemmelsen | Ja | `Formål` |
| **Innhold/Tekst** | Selve bestemmelsen | Ja | `Formålet med denne loven...` |
| **Overordnet bestemmelse** | For hierarki | Nei | `rskl-1` |
| **Gyldig fra** | Ikrafttredelsesdato | Nei | `2023-01-01` |
| **Gyldig til** | Opphørsdato | Nei | `2024-12-31` |

### 4. Excel Template
- Generer tilpasset Excel-template for hver lov
- Inkluderer eksempeldata spesifikt for den valgte loven
- Separate ark for feltbeskrivelser og instruksjoner

## Bruk

### Steg 1: Velg Lov
1. Gå til "Juridisk Kunnskapsbase"
2. Søk eller bla gjennom eksisterende bestemmelser
3. Klikk på en bestemmelse/lov du vil utvide

### Steg 2: Last ned Template (anbefalt)
1. Klikk "Last ned Excel-template"
2. Fyll ut template med dine bestemmelser
3. Lagre filen

### Steg 3: Last opp og Map
1. Velg Excel/CSV fil
2. Systemet foreslår automatisk kolonnemapping
3. Juster mappings ved behov
4. Alle påkrevde felt må være mappet

### Steg 4: Forhåndsvis og Importer
1. Se forhåndsvisning av data som skal importeres
2. Verifiser at alt ser riktig ut
3. Klikk "Importer" for å lagre til database

## Teknisk Implementering

### Komponenter
- `LawProvisionUploader` - Hovedkomponent for opplasting
- `LEGAL_PROVISION_FIELDS` - Feltdefinisjoner
- `generateLegalProvisionTemplate()` - Template-generering
- Gjenbruk av `ColumnMappingTable` fra DataUpload

### Intelligent Mapping
- Norsk språkstøtte med æ, ø, å normalisering
- Fuzzy matching for feilskrivinger
- Kontekstbasert gjenkjenning av juridiske termer
- Historisk mapping-hukommelse

### Fordeler
- **Konsistent workflow** med andre upload-prosesser
- **Smart feltgjenkjenning** reduserer manuelt arbeid
- **Lov-spesifik** tilnærming for bedre organisering
- **Validering** sikrer datakvalitet før import
- **Template-støtte** for standardiserte uploads

## Fremtidige Forbedringer
- Bulk-import av flere lover samtidig
- Hierarki-validering av parent/child relasjoner
- Automatisk paragrafnummerering
- Integrasjon med eksterne juridiske databaser