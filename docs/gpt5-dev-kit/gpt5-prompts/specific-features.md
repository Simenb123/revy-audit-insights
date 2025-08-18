# GPT-5 Feature-Specific Prompts

## Kundeanalyse Dashboard

```
Lag en React komponent for et Kundeanalyse Dashboard i Revio revisionsapp.

TEKNISKE KRAV:
- React 18 + TypeScript
- shadcn/ui komponenter (Card, Table, Chart)
- TanStack Query for data
- Supabase backend
- Responsive design (mobil/desktop)
- Norsk UI tekst

FEATURES:
- Oversikt over klientportefølje
- Finansielle nøkkeltall (omsetning, resultat, balanse)
- Risikokategorisering (lav/medium/høy)
- Trendanalyse over tid
- Filtere: år, bransje, størrelse
- Export til Excel funksjon

DATA STRUKTUR:
- clients tabell: company_name, org_number, revenue, industry
- financial_data tabell: year, revenue, profit, total_assets
- risk_assessments tabell: risk_level, assessment_date

DESIGN:
- Grid layout med KPI kort øverst
- Tabellvisning av klienter med sortering
- Chart.js for trendvisualisering
- Semantiske farger (bg-card, text-foreground, border)

SUPABASE:
- RLS: user_id basert tilgang
- Queries: JOIN clients med financial_data
- Edge function: generate-client-analysis

Lag komplett dashboard med types, hooks, charts og export-funksjonalitet.
```

## Dokumentkategorisering System

```
Lag et React system for automatisk dokumentkategorisering i Revio.

TEKNISKE KRAV:
- React 18 + TypeScript + Vite
- shadcn/ui (Dialog, Select, Badge, Progress)
- TanStack Query mutations
- Supabase + Edge Functions
- Drag & drop for file upload
- Real-time progress tracking

FEATURES:
- Bulk file upload (PDF, Excel, Word)
- AI-basert kategorisering via OpenAI
- Manual overrid av AI-forslag
- Batch-operasjoner (godkjenn alle, endre kategori)
- Progress tracking med WebSocket
- Thumbnail preview av dokumenter

KATEGORIER:
- Regnskap (årsregnskap, mellombalanse)
- Skatt (selvangivelse, skattemelding)
- Revisjon (revisjonsberetning, styringsbrev)
- Diverse (andre dokumenter)

DATA FLOW:
1. Upload → text extraction (Edge Function)
2. AI categorization (OpenAI GPT-4)
3. Confidence scoring og human review
4. Lagring i client_documents_files

SUPABASE:
- client_documents_files tabell
- unified_categories for kategorier
- document-ai-categorizer Edge Function
- Storage bucket for filer

DESIGN:
- Drag & drop område
- Kategorisering grid med AI confidence
- Batch action toolbar
- Progress indicators

Lag komplett system med upload, AI integration og kategorisering workflow.
```

## Revisjonshandlinger Tracker

```
Lag en React komponent for sporing av revisjonshandlinger per klient.

TEKNISKE KRAV:
- React 18 + TypeScript
- shadcn/ui (Progress, Checkbox, Textarea, Calendar)
- React Hook Form + Zod validation
- TanStack Query med real-time subscriptions
- Supabase backend med RLS
- Kanban-style layout

FEATURES:
- Handlingsmaler per revisjonsområde
- Progress tracking (0-100%)
- Deadline alerts og notifications
- Team assignment og collaboration
- Comments og file attachments
- Export av handlingsliste

REVISJONSOMRÅDER:
- Salg og kundefordringer
- Innkjøp og leverandørgjeld  
- Lønn og personalomkostninger
- Varebeholdning
- Anleggsmidler

DATA STRUKTUR:
- audit_actions tabell med client_id, area, progress
- audit_action_templates for standardhandlinger  
- action_comments for samarbeid
- action_attachments for filer

WORKFLOW:
1. Velg klient og revisjonsår
2. Last handlingsmaler for området
3. Tilordne ansvarlige personer
4. Spor fremgang og deadlines
5. Generer rapport for handlinger

DESIGN:
- Kanban kort per handlingsområde
- Progress bars og status badges
- Team avatars for tilordning
- Calendar integration for deadlines

Lag komplett action tracker med templates, progress og collaboration.
```

## Regnskapsdata Analyzer

```
Lag en React komponent for analyse av importerte regnskapsdata.

TEKNISKE KRAV:
- React 18 + TypeScript
- shadcn/ui (Table, Chart, Tabs, Alert)
- Recharts for visualisering
- TanStack Query med store datasett
- Supabase + Edge Functions for beregninger
- Excel export med xlsx library

FEATURES:
- Import fra Excel/CSV/SAF-T filer
- Duplikatsjekk og datakvalitet
- Hovedbok og balanse generering
- Månedlige sammendrag og trender
- Avviksanalyse mot budsjett
- Export til Excel regneark

ANALYSE TYPER:
- Grunnleggende statistikk (antall, sum, gjennomsnitt)
- Duplikate transaksjoner identifikasjon
- Tidslogikk problemer (fremtidsdatoer)
- Kontodistribusjon og populære konti
- Månedlig transaksjonsmønster

DATA FLOW:
1. Upload regnskapsfil via drag & drop
2. Parsing og validering (Edge Function)
3. Lagring i general_ledger_transactions
4. Analyse og rapport generering
5. Visualisering av nøkkeltall

SUPABASE:
- accounting_data_versions for versjonering
- general_ledger_transactions for data
- calculate-accounting-stats Edge Function
- RLS basert på client_id

DESIGN:
- Tabbed interface (Import, Analyse, Rapport)
- Charts for trendvisualisering  
- Alert komponenter for avvik
- Data grid med søk og filtrering

Lag komplett regnskapsanalyzer med import, analyse og visualisering.
```

## AI Revy Chat Integration

```
Lag en kontekstbevisst AI chat komponent for Revy assistenten.

TEKNISKE KRAV:
- React 18 + TypeScript
- Real-time chat med streaming responses
- Supabase Edge Function integration
- Context-aware AI med klient/dokument data
- Markdown rendering for AI svar
- File upload og preview

AI CAPABILITIES:
- Revisjons-spesifikk kunnskap (ISA, RS standarter)
- Analyse av opplastede dokumenter
- Forslag til revisjonshandlinger
- Svar på regnskapsrelaterte spørsmål
- Generering av arbeidsnotater

CONTEXT INTEGRATION:
- Aktiv klient-informasjon
- Pågående revisjonshandlinger  
- Nylig opplastede dokumenter
- Brukers arbeidshistorikk
- Firmaets kunnskapsbase

CHAT FEATURES:
- Conversation history lagring
- Quick action buttons (analyser dokument, foreslå handlinger)
- Voice input via Web Speech API
- Copy/export av AI respons
- Suggested follow-up questions

DATA FLOW:
1. User input + context data
2. revy-ai-chat Edge Function
3. OpenAI API med custom prompts
4. Response streaming til UI
5. Lagring i ai_chat_sessions

SUPABASE:
- ai_chat_sessions for historikk
- revy-ai-chat Edge Function
- Context fra clients, documents, actions tabeller
- ai_usage_logs for statistikk

DESIGN:
- Floating chat widget (kan minimeres)
- Chat bubbles med typing indicator
- Context sidebar med relevant info
- Quick action buttons under input

Lag intelligent Revy chat med kontekst, streaming og document analysis.
```

## Klient Onboarding Wizard

```
Lag en React wizard komponent for registrering av nye klienter.

TEKNISKE KRAV:
- React 18 + TypeScript
- Multi-step wizard med progress indicator
- React Hook Form + Zod validation
- BRREG API integration for firmadata
- shadcn/ui form komponenter
- TanStack Query mutations

WIZARD STEPS:
1. Grunnleggende firmainformasjon (org.nr, navn)
2. BRREG data henting og bekreftelse
3. Kontaktpersoner og team tilordning
4. Revisjonsoppsett (år, type, risikovurdering)
5. Dokumentopplasting (årsregnskap, etc.)
6. Oppsummering og bekreftelse

BRREG INTEGRATION:
- Auto-utfylling basert på org.nr
- Henting av styremedlemmer og signatur
- Bransjeinfo og størrelsesindikatorer  
- Tidligere revisor informasjon

VALIDERING:
- Org.nr format og gyldighet
- Påkrevde felter per steg
- File upload validering
- Team member tilgjengelighet

DATA LAGRING:
- clients tabell for hovedinfo
- client_contacts for kontaktpersoner
- client_team_members for tilordninger
- client_documents for opplastede filer

DESIGN:
- Stepper component øverst
- Progress bar og "Back/Next" navigasjon
- Auto-save på hvert steg
- Success konfirmasjon til slutt

Lag komplett onboarding wizard med BRREG, validering og multi-step flow.
```