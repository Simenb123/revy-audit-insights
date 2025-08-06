# AGENT INSTRUCTIONS

Dette prosjektet benytter Node, Vite og Supabase Edge Functions. For å teste og kjøre koden korrekt bør agenten følge disse retningslinjene.

## Miljø og installasjon

1. Kopier `.env.example` til `.env.local` og fyll inn påkrevde variabler som `SUPABASE_URL`, `SUPABASE_ANON_KEY` og `OPENAI_API_KEY`.
2. Installer avhengigheter med `npm install --legacy-peer-deps`.

### GitHub Codespaces

Prosjektet kan også kjøres i **GitHub Codespaces**. Etter at Codespace-miljøet er opprettet,
kopier `.env.example` til `.env.local` og fyll inn variablene. Kjør deretter
`npm install --legacy-peer-deps` før du starter utviklingsserveren med
`npm run dev`.

## Kørsel av tester

- Kør `npm test` for å kjøre Vitest-enhetene. Disse ligger under `src`-mappen.
- Kør `node scripts/smoke-test.js` for å kontrollere at Supabase-funksjonene svarer. Krever at `SUPABASE_URL` og `SUPABASE_ANON_KEY` er satt.
- For Deno-baserte edge-funksjoner kan `deno test supabase/functions` kjøres.

## Utviklingsserver

Kjør `npm run dev` for å starte utviklingsserveren. Den laster automatisk inn variabler fra `.env.local`.

## Stil og kvalitet

- Følg prosjektets ESLint-oppsett ved å kjøre `npm run lint` dersom du har gjort kodeendringer.
- Hold dokumentasjonen oppdatert dersom nye funksjoner eller skript legges til.

## Kommunikasjon

- Når du forklarer funksjonalitet eller kode, bruk enkelt dagligspråk.
- Unngå teknisk sjargong; forklar tekniske begreper med vanlige ord.
- Gjerne bruk analogier og konkrete eksempler.
- Del opp forklaringer i små, forståelige trinn slik at en nybegynner kan henge med.

## Supabase og Lovable

- All backend-arbeid gjøres i Supabase gjennom [Lovable.dev](https://lovable.dev/).
- Dersom en endring krever databaseoppdateringer, Edge Functions eller migrasjoner,
  forklar behovene i enkle ord.
- Avslutt svaret med en kort «Lovable‑prompt» som beskriver hva som må gjøres i Supabase,
  slik at den kan sendes direkte til Lovable.