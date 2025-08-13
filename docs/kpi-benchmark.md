# KPI Benchmark – Dokumentasjon

Denne dokumentasjonen beskriver KPI-benchmark-flyten i Report Builder: state-håndtering, aggregering, panelvisning og eksport.

## Oversikt

Moduler:
- useKpiBenchmarkState: Laster klienter/konsern for custom-scope og holder verdier pr. klient.
- useKpiBenchmarkAggregation: Regner ut sum/snitt og formaterer aggregerte visninger.
- useKpiBenchmarkExport: Eksporterer benchmark-data som XLSX.
- KpiBenchmarkPanel: Viser klientverdier gruppert på konsern, inkl. Sum/Snitt.
- BenchmarkControls: UI for gruppevalg, sum/snitt og eksport.
- KpiBenchmarkSummary: Viser aggregert verdi i widget-header.

Hjelpere:
- src/utils/kpiFormat.ts – getScaleDivisor, formatNumeric, formatPercent, getUnitLabel.

## Viktige props/valg

- displayAsPercentage: true for prosentvisning (%). Skalerer ikke tall.
- showCurrency: true for NOK-format ved ikke-prosent.
- unitScale: 'none' | 'thousand' | 'million'. Brukes kun ved beløp (amount).
- aggregateMode: 'none' | 'sum' | 'avg'. Styrer aggregert visning og eksport.
- selectedGroup: 'all' eller konsernnavn. Filtrerer visning/eksport.

## Arbeidsflyt

1) useKpiBenchmarkState
   - Leser klienter (id, name, group) for valgt utvalg i custom-scope.
   - Rydder valuesByClient ved endringer og bevarer kun relevante id-er.

2) KpiBenchmarkPanel
   - Grupperer klienter pr. group.
   - Henter verdier via useFormulaCalculation per klient.
   - Skalerer/formatterer med kpiFormat og viser Sum/Snitt per gruppe.

3) useKpiBenchmarkAggregation
   - Plukker riktige klientverdier iht. selectedGroup.
   - Beregner sum/snitt og formaterer for header.

4) useKpiBenchmarkExport
   - Eksporterer per-klient, per-gruppe (SUM/SNITT) og valgt aggregat (SUM/SNITT), med enhetslabel.

5) KpiWidget integrasjon
   - Persisterer brukerens valg (aggregateMode, selectedGroup, showBenchmark) via load/saveReportBuilderSettings.
   - Viser KpiBenchmarkSummary i header og BenchmarkControls for custom-scope.

## Formatering og skalering

- Prosent: formatPercent(x) – ingen skalering.
- Beløp/ratio: del på getScaleDivisor(unitScale) for visning/eksport.
- Valg av format: showCurrency ? NOK : formatNumeric.
- Etikett: getUnitLabel(displayAsPercentage, showCurrency, unitScale).

## Eksport

- Filnavn: <widgetTitle>-benchmark-<år>-grp-<slug>-agg-<mode>.xlsx
- Rader:
  - Type: 'Klient', 'Gruppe SUM', 'Gruppe SNITT', 'AGGREGAT'
  - Kolonner: Klient, Konsern, Verdi, Enhet, Valgt gruppe, Aggregering
- canExport er true kun når minst én klientverdi er tilgjengelig.

## Edge cases

- Ingen klienter: Panel viser "Ingen klienter valgt"; eksport avskrudd.
- Ingen data i en gruppe: Sum/Snitt viser '—'.
- Prosent + unitScale: unitScale ignoreres ved prosent.

## QA-sjekkliste

- custom-scope med flere grupper: riktig filtrering på selectedGroup.
- displayAsPercentage true/false: konsekvent visning og eksport.
- showCurrency true/false og unitScale: korrekt skalering og label.
- aggregateMode none/sum/avg: riktig header-verdi og eksportlinje.
- Bytte klientutvalg: gamle values ryddes bort.

## Utviklingstips

- Unngå hardkodede tekster/farger; bruk eksisterende tokens og utils.
- Behold små og fokuserte komponenter/hooks; unngå monolitter.
- Legg ny formateringslogikk i src/utils/kpiFormat.ts for gjenbruk.
