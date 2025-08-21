# RAG Admin - Juridisk Relasjonskart

En komplett modul for administrasjon av relasjoner mellom juridiske kilder og bestemmelser i Revio-systemet.

## Funksjoner

- **Dokumentvalg**: Velg kilde- og måldokumenter med intelligent type-kategorisering
- **Bestemmelsessøk**: Søk og velg spesifikke bestemmelser i valgte dokumenter  
- **Relasjonsadministrasjon**: Definer relasjonstyper med auto-forslag basert på dokumenttyper
- **Grafisk visualisering**: React Flow-basert graf med fargekodet node-system
- **Kladd-system**: Samle og administrer relasjoner før lagring
- **Demo-modus**: Test funksjonalitet med mock-data
- **Detaljpanel**: Utforsk nodes og kanter med handlingsknapper

## Arkitektur

```
src/components/Knowledge/admin/LegalRelationsAdmin/
├── index.tsx                 // Hovedkomponent med tab-navigasjon
├── Selectors.tsx             // Dokument- og typeselektorer
├── ProvisionsPicker.tsx      // Bestemmelsessøk og relasjonsopprettelse
├── DraftList.tsx             // Kladd-administrasjon og batch-lagring
├── GraphView.tsx             // React Flow visualisering + detaljpanel
├── helpers.ts                // Kjernefunksjoner og logikk
└── __tests__/helpers.test.ts // Vitest enhetstester
```

## Database

Modulen bruker følgende tabeller:
- `legal_documents` - Juridiske dokumenter
- `legal_provisions` - Bestemmelser med `anchor`-felt
- `legal_cross_refs` - Kryss-referanser mellom bestemmelser

## Bruk

1. **Velg Dokumenter**: Kilde og mål med type-filtrering
2. **Velg Bestemmelser**: Søk og velg på begge sider
3. **Definer Relasjon**: Type + valgfritt notat
4. **Legg til Kladd**: Samle flere relasjoner
5. **Visualiser**: Se graf med fargekodet system
6. **Lagre**: Batch-lagring til database

## Relasjonstyper

- `clarifies` - Utdyper
- `enabled_by` - Hjemles i  
- `implements` - Implementerer
- `cites` - Viser til
- `interprets` - Tolker
- `applies` - Anvender
- `mentions` - Nevner

## Auto-forslag Mapping

- Forskrift → Lov = `enabled_by`
- Dom → Lov/Forskrift = `interprets` 
- Rundskriv → Lov = `clarifies`
- Forarbeid → Lov = `clarifies`
- Fallback = `cites`

## Testing

```bash
npm run test        # Kjør alle tester
npm run test:watch  # Watch mode
```

Testdekking:
- ✅ resolveNodeType() - Dokument type-resolusjon
- ✅ suggestRefType() - Auto-forslag av relasjonstyper  
- ✅ buildCrossRefPayload() - Database payload-bygning
- ✅ Edge cases og feilhåndtering