import React, { useEffect, useMemo, useState } from 'react';
import MappingCombobox from '@/components/Accounting/MappingCombobox';

const sampleOptions = [
  { id: '1', standard_number: '1000', standard_name: 'Salg' },
  { id: '2', standard_number: '1900', standard_name: 'Kontanter' },
  { id: '3', standard_number: '1920', standard_name: 'Bankinnskudd' },
  { id: '4', standard_number: '1921', standard_name: 'Bank driftskonto' },
  { id: '5', standard_number: '2400', standard_name: 'Leverandørgjeld' },
  { id: '6', standard_number: '1500', standard_name: 'Kundefordringer' },
  { id: '7', standard_number: '3000', standard_name: 'Diverse inntekter' },
  { id: '8', standard_number: '4000', standard_name: 'Varekjøp' },
  { id: '9', standard_number: '5400', standard_name: 'Telefon' },
  { id: '10', standard_number: '6000', standard_name: 'Leie lokaler' },
  { id: '11', standard_number: '6300', standard_name: 'Strøm' },
  { id: '12', standard_number: '8099', standard_name: 'Annen finanskostnad' },
];

export default function Sandbox() {
  const [value, setValue] = useState<string | undefined>(undefined);
  const [fuzzy, setFuzzy] = useState(true);
  const [maxResults, setMaxResults] = useState<number | undefined>(20);
  const [minFuzzyQueryLength, setMinFuzzyQueryLength] = useState(2);
  const [debounceMs, setDebounceMs] = useState(120);
  const [fuzzyThreshold, setFuzzyThreshold] = useState(0.3);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'MappingCombobox demo – feiltolerant søk';
    const meta = document.querySelector('meta[name="description"]') || document.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('content', 'Demonstrasjon av MappingCombobox med fuzzy-søk, highlighting og ytelsesinnstillinger.');
    if (!meta.parentElement) document.head.appendChild(meta);
    const link = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', window.location.href);
    if (!link.parentElement) document.head.appendChild(link);
  }, []);

  const labels = useMemo(
    () => ({
      searchPlaceholder: 'Søk etter konto …',
      noResults: 'Ingen treff',
      clearSelection: 'Fjern valg',
      listAriaLabel: 'Standardkonti',
      resultsCountAnnouncement: (count: number, q: string) => `${count} treff for "${q}"`,
      availableCountAnnouncement: (count: number) => `${count} tilgjengelige konti`,
      loadingText: 'Laster…',
      clearSearch: 'Tøm søk',
    }),
    []
  );

  return (
    <div className="min-h-[60vh] bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <h1 className="text-2xl font-semibold">MappingCombobox demo</h1>
          <p className="text-muted-foreground mt-1">
            Utforsk fuzzy-søk, highlighting og ytelsesinnstillinger.
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <section aria-labelledby="controls" className="mb-6">
          <h2 id="controls" className="sr-only">Kontroller</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-md border border-border bg-card p-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={fuzzy}
                  onChange={(e) => setFuzzy(e.target.checked)}
                />
                <span>Fuzzy-søk</span>
              </label>
              <label className="mt-3 block text-sm">
                Max results
                <input
                  type="number"
                  className="mt-1 w-full rounded border border-input bg-background px-2 py-1"
                  value={maxResults ?? ''}
                  onChange={(e) => setMaxResults(e.target.value === '' ? undefined : Number(e.target.value))}
                  min={1}
                />
              </label>
              <label className="mt-3 block text-sm">
                Min fuzzy query length
                <input
                  type="number"
                  className="mt-1 w-full rounded border border-input bg-background px-2 py-1"
                  value={minFuzzyQueryLength}
                  onChange={(e) => setMinFuzzyQueryLength(Math.max(1, Number(e.target.value)))}
                  min={1}
                />
              </label>
            </div>

            <div className="rounded-md border border-border bg-card p-4">
              <label className="block text-sm">
                Debounce (ms)
                <input
                  type="number"
                  className="mt-1 w-full rounded border border-input bg-background px-2 py-1"
                  value={debounceMs}
                  onChange={(e) => setDebounceMs(Math.max(0, Number(e.target.value)))}
                  min={0}
                />
              </label>
              <label className="mt-3 block text-sm">
                Fuzzy threshold (0–1, lavere = mer presis)
                <input
                  type="number"
                  step={0.05}
                  className="mt-1 w-full rounded border border-input bg-background px-2 py-1"
                  value={fuzzyThreshold}
                  onChange={(e) => setFuzzyThreshold(Math.min(1, Math.max(0, Number(e.target.value))))}
                  min={0}
                  max={1}
                />
              </label>
              <label className="mt-3 flex items-center gap-2">
                <input type="checkbox" checked={loading} onChange={(e) => setLoading(e.target.checked)} />
                <span>Simuler loading</span>
              </label>
            </div>

            <div className="rounded-md border border-border bg-card p-4">
              <div className="text-sm text-muted-foreground">Valgt</div>
              <div className="mt-1 rounded bg-muted p-2 text-sm">
                {value ? value : '—'}
              </div>
              <button
                className="mt-3 inline-flex items-center rounded border border-input bg-background px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => setValue(undefined)}
              >
                Nullstill valg
              </button>
            </div>
          </div>
        </section>

        <section aria-labelledby="demo">
          <h2 id="demo" className="sr-only">Demonstrasjon</h2>
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-3 text-sm text-muted-foreground">Søk og velg en konto:</div>
            <MappingCombobox
              value={value}
              onChange={(sn) => setValue(sn || undefined)}
              options={sampleOptions}
              labels={labels}
              fuzzy={fuzzy}
              maxResults={maxResults}
              minFuzzyQueryLength={minFuzzyQueryLength}
              debounceMs={debounceMs}
              fuzzyThreshold={fuzzyThreshold}
              loading={loading}
              allowClear
            />
          </div>
        </section>
      </main>
    </div>
  );
}
