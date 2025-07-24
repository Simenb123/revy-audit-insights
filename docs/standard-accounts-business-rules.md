# Standardkontoer - Forretningsregler og Sammenhenger

## Oversikt
Standardkontoer brukes til å definere en standardisert kontoplan for regnskap og finansiell rapportering.

## Feltdefinisjoner

### Hovednøkler
- **standard_number**: Unikt kontonummer (f.eks. "285", "1000")
- **standard_name**: Beskrivende navn for kontoen
- **id**: UUID - systemgenerert primærnøkkel

### Kontokategorisering
- **account_type**: Hovedkategori
  - `asset` - Eiendel
  - `liability` - Gjeld  
  - `equity` - Egenkapital
  - `revenue` - Inntekt
  - `expense` - Kostnad

- **category**: Undergruppe innen kontotype (valgfritt)
- **analysis_group**: Brukes for rapporteringsgruppering (valgfritt)

### Visning og Struktur
- **display_order**: Numerisk rekkefølge for visning
  - Settes automatisk basert på standard_number hvis numerisk
  - Kan overstyres manuelt
  - Standardverdi: samme som standard_number (hvis numerisk)

- **line_type**: Hvordan linjen skal behandles
  - `detail` - Vanlig detaljlinje (standard)
  - `subtotal` - Delsummeringslinje
  - `calculation` - Beregnet linje

- **parent_line_id**: Referanse til overordnet linje (for hierarki)

### Beregninger
- **calculation_formula**: Matematisk formel for beregning
  - **PÅKREVD** for `line_type = 'calculation'` eller `'subtotal'`
  - Valgfritt for `line_type = 'detail'`
  - Format: "19 + 79" (refererer til andre kontonummer)

- **is_total_line**: Markerer om dette er en summeringslinje
- **sign_multiplier**: Fortegn for beregninger (+1 eller -1)

## Validering og Forretningsregler

### Påkrevde felt
- `standard_number` - må være unik
- `standard_name` - beskrivende navn
- `account_type` - må være en av de definerte typene

### Betingede påkrav
- `calculation_formula` er påkrevd når:
  - `line_type = 'calculation'`
  - `line_type = 'subtotal'`

### Automatisk utfylling
- `display_order` settes automatisk til verdien av `standard_number` hvis numerisk
- Kan overstyres manuelt hvis spesiell sortering ønskes

## Eksempler

### Vanlig detaljkonto
```
standard_number: "285"
standard_name: "Annen kortsiktig gjeld"
account_type: "liability"
line_type: "detail"
display_order: 285 (auto-satt)
calculation_formula: null (ikke påkrevd)
```

### Beregnet summeringslinje
```
standard_number: "290"
standard_name: "Sum kortsiktig gjeld"
account_type: "liability"
line_type: "subtotal"
display_order: 290
calculation_formula: "280 + 285" (påkrevd)
is_total_line: true
```

## Feilsøking

### "Kan ikke oppdatere uten beregningsformel"
- Sjekk at `line_type` ikke er satt til 'calculation' eller 'subtotal'
- Hvis det skal være en beregnet linje, legg til gyldig beregningsformel

### "Visningsrekkefølge oppdateres ikke"
- Systemet setter automatisk `display_order = standard_number` for numeriske kontonummer
- For å overstyre: endre `display_order` manuelt etter at kontonummer er satt

### Hierarki vises ikke korrekt
- Sjekk at `parent_line_id` peker til gyldig overordnet konto
- Visningshierarkiet beregnes ved visning basert på parent-child-relasjoner