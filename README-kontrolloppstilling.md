# Kontrolloppstilling lønn

En komplett modul for A-E beregning og avstemming av lønnsdata i Revio.

## Oversikt

Kontrolloppstilling lønn-modulen lar deg:
- Importere og validere A07 JSON-data
- Laste opp saldobalanse (XLSX/CSV) med konfigurerbare kolonner  
- Utføre A-E beregning (A fra P&L, B/C fra avsetninger, D=A+B-C, E=AGA)
- Finne eksakte matches (±5 kr) med automatisk tie-breaking
- Administrere mapping-regler for konto-til-intern-kode mapping
- (Kommende) AI-baserte forslag for mapping

## Miljøvariabler

For full funksjonalitet trenger du:

```bash
# Supabase konfigurasjon (allerede konfigurert)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# For AI-forslag (valgfritt, kommer senere)
OPENAI_API_KEY=your_openai_api_key
```

## Database

Modulen krever følgende tabeller (automatisk opprettet ved migrasjon):
- `amelding_codes` - A07 kodedefinier med forventet fordeltype
- `amelding_code_map` - Mapping mellom A07 og interne koder  
- `internal_codes` - Interne kodedefinier med AGA-flagg
- `mapping_rules` - Konto-til-intern-kode regler per klient

## Bruk

### 1. Tilgang
Naviger til: `/clients/:clientId/payroll/kontrolloppstilling`

Eller via lønnoversikten → "Kontrolloppstilling" kort

### 2. Importere A07 data

1. Gå til **Datagrunnlag** fanen
2. Lim inn A07 JSON i tekstfeltet:
```json
[
  { "beskrivelse": "fastloenn", "fordel": "kontantytelse", "beloep": 600000 },
  { "beskrivelse": "timeloenn", "fordel": "kontantytelse", "beloep": 350000 },
  { "beskrivelse": "fastTillegg", "fordel": "kontantytelse", "beloep": 50000 }
]
```
3. Klikk **Importer A07**
4. Eventuelle valideringsfeil vises som badges

### 3. Importere saldobalanse

1. I **Datagrunnlag** fanen, velg XLSX/CSV fil
2. Velg riktig ark fra dropdown
3. Spesifiser kolonnenavn:
   - **Konto kolonne**: f.eks. "konto" eller "account"
   - **Tekst kolonne**: f.eks. "tekst" eller "description"  
   - **Beløp kolonne**: f.eks. "beløp" eller "amount"
4. Klikk **Prosesser data**

### 4. Konfigurere mapping-regler

I **Regler** fanen kan du:
- Se eksisterende regler
- Administrere konto → intern kode mappinger
- Sette strategi (exclusive/split/score)
- Definere vekter og nøkkelord

### 5. Utføre avstemming

**Avstemming** fanen viser A-E tabellen:
- **A**: Sum fra P&L kontoer (5xxx) basert på regler
- **B**: Negative avsetninger (294x/295x) 
- **C**: Positive avsetninger (294x/295x)
- **D**: Beregnet (A + B - C)
- **E**: AGA-justering basert på intern kode
- **Konto(r)**: Viser hvilke kontoer som bidrar
- **Avvik**: Forskjell mellom D og A07

### 6. Kjøre eksakt match

1. Gå til **Eksakt match** fanen
2. Klikk **Kjør eksakt match** 
3. Algoritmen finner matches innenfor ±5 kr toleranse
4. Ved flere alternativer brukes tie-breaking:
   - Færrest linjer først
   - Høyest samlet regelvekt
   - Lavest differanse
5. **Godta alle eksakte** oppretter exclusive-regler automatisk

## Spesielle funksjoner

### Norsk tegnstøtte
- Modulen håndterer både "ø" og "oe" varianter i validering
- Lagret data bruker ASCII-kanon ("utgiftsgodtgjoerelse")
- Import aksepterer begge varianter

### Intern kodekonfigurasjon
Spesielle interne koder som per produkteier-beslutning:
- `timelon` (timelønn) - AGA=true
- `fasttillegg` (fast tillegg) - AGA=true  
- Standard kontoforslag: 5000→fastlon, 5010→timelon, 5020→fasttillegg

### Testing

Kjør testene:
```bash
npm test src/modules/payroll/
```

Test-scenarios dekker:
- T1: Eksakt match single line (50,000)
- T2: Eksakt match to linjer (240k + 240k) 
- T3: Tie-breaking (100k vs 60k+40k)
- T4: Mapping split (timelon=350k, fasttillegg=50k, fastlon=600k)

## Feilsøking

**A07 validering feiler:**
- Sjekk at `beskrivelse` finnes i database
- Verifiser at `fordel` matcher forventet type

**TB import feiler:**
- Kontroller kolonnenavn matcher header row
- Sjekk tall-format (norske tall med komma støttes)

**Ingen eksakte matches:**
- Verifiser at mapping-regler er konfigurert
- Sjekk ±5 kr toleranse
- Se på alternatives for nær-matches

**Tom avstemmingstabell:**
- Importér både A07 og TB data først
- Konfigurer mapping-regler i Regler-fanen

## Arkitektur

```
src/modules/payroll/
├── PayrollReconciliation.tsx      # Hoved-UI komponent
├── hooks/
│   ├── useCodes.ts               # TanStack Query for koder
│   └── useMappingRules.ts        # CRUD for mapping regler
├── lib/
│   ├── a07.ts                    # A07 parsing og validering
│   ├── tb.ts                     # Saldobalanse prosessering  
│   └── exactMatch.ts             # Subset-sum algoritme
└── __tests__/                    # Vitest enhetstester
```

Routing: `/clients/:clientId/payroll/kontrolloppstilling`