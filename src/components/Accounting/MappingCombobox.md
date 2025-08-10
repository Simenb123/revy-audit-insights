# MappingCombobox – bruk og props

En tilgjengelig, ytelseseffektiv combobox for valg av standardkonto med søk, virtualisering og valgfritt fuzzy‑søk.

## Enkel bruk
```tsx
import MappingCombobox from './MappingCombobox';

<MappingCombobox
  value={value}
  onChange={setValue}
  options={options}
  placeholder="Velg regnskapslinje"
/>
```

## Fuzzy‑søk og tuning
```tsx
<MappingCombobox
  value={value}
  onChange={setValue}
  options={options}
  fuzzy
  maxResults={50}
  minFuzzyQueryLength={2}
  debounceMs={120}
  fuzzyThreshold={0.3}
/>
```

- fuzzy: Feiltolerant søk (typo‑vennlig) med rangering og markering av treff
- maxResults: Begrens antall viste resultater (ytelse og støy)
- minFuzzyQueryLength: Minste lengde før fuzzy aktiveres (default 2)
- debounceMs: Debounce på søk (default 120ms)
- fuzzyThreshold: 0–1, lavere = mer presis (default 0.3)

## Tekster og labels (lokalisering)
```tsx
<MappingCombobox
  value={value}
  onChange={setValue}
  options={options}
  labels={{
    placeholder: "Velg regnskapslinje",
    searchPlaceholder: "Søk etter kontonummer eller navn…",
    clearSelection: "Fjern valg",
    loading: "Laster…",
    empty: "Ingen treff",
    resultsCountAnnouncement: (count: number) => `${count} treff`,
  }}
/>
```

- labels: Overstyr alle tekster. Bruk funksjon for dynamiske meldinger (f.eks. antall treff).

## Tilgjengelighet
- Full ARIA-støtte (combobox, listbox, announcements)
- Tastaturnavigasjon (pil opp/ned, Enter, Esc, Backspace for å fjerne når tomt søk)

## Ytelse
- Virtualisering med @tanstack/react-virtual
- Debouncing på søk
- Begrensning av resultater med maxResults

## Markering av treff
- Ved fuzzy brukes Fuse sine match‑indekser for nøyaktig markering
- Fallback til enkel token‑markering når fuzzy ikke er aktivt
