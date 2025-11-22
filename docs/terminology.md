# Terminologi og Språkguide

Dette dokumentet definerer standard terminologi for AI Revio-platformen, med mapping mellom norsk (UI) og engelsk (kode).

**Opprettet:** 2025-11-22  
**Status:** Versjon 1.0  
**Eiere:** Utviklingsteam

---

## 📋 Overordnede Prinsipper

### Språkstrategi

**Frontend (Brukergrensesnitt):**
- ✅ **Primærspråk: Norsk** - Alle brukervendte tekster skal være på norsk
- ⚠️ **Unntak:** Etablerte fagtermer (ISA, GAAP, ROI, etc.) og tekniske termer kan være på engelsk
- 🎯 **Mål:** Konsistent norsk brukeropplevelse

**Backend (Kode):**
- ✅ **Primærspråk: Engelsk** - Alle variabelnavn, funksjoner, og kommentarer på engelsk
- ✅ **Konsistent:** Følg etablerte konvensjoner (camelCase, snake_case)
- 🎯 **Mål:** Internasjonal kodekvalitet

**Routes (URL-er):**
- ✅ **Standard: Engelsk** - Alle nye routes skal være på engelsk
- ✅ **Legacy: Behold med redirects** - Norske routes beholdes som redirects for bakoverkompatibilitet
- 🎯 **Mål:** SEO-vennlige, internasjonale URL-er

---

## 🔤 Hoveddomener

### Klienthåndtering

| Norsk (UI) | Engelsk (Kode/DB) | Merknad |
|-----------|------------------|---------|
| Klient | Client | Database: `clients` |
| Organisasjonsnummer | Organization Number | DB felt: `org_number` |
| Revisjonsfirma | Audit Firm | Database: `audit_firms` |
| Regnskapsår | Fiscal Year | Context: FiscalYearContext |
| Avdeling | Department | - |

### Regnskap og Økonomi

| Norsk (UI) | Engelsk (Kode/DB) | Merknad |
|-----------|------------------|---------|
| Hovedbok | General Ledger | Route: `/general-ledger` |
| Saldobalanse | Trial Balance | Route: `/trial-balance` |
| Resultatregnskap | Income Statement | - |
| Balanse | Balance Sheet | - |
| Kontantstrøm | Cash Flow | - |
| Konto | Account | Database: `accounts` |
| Kontoplan | Chart of Accounts | DB: `chart_of_accounts` |
| Standardkontoplan | Standard Accounts | DB: `standard_accounts` |

### Kundefordringer (AR) og Leverandørgjeld (AP)

| Norsk (UI) | Engelsk (Kode/DB) | Merknad |
|-----------|------------------|---------|
| Kundefordringer | Accounts Receivable (AR) | Database: `ar_transactions` |
| Kunde | Customer | DB: `customers` |
| Kundesaldo | Customer Balance | DB: `ar_customer_balances` |
| Leverandørgjeld | Accounts Payable (AP) | Database: `ap_transactions` |
| Leverandør | Supplier | DB: `suppliers` |
| Leverandørsaldo | Supplier Balance | DB: `ap_supplier_balances` |
| Kundetransaksjon | AR Transaction | Felt: `ar_transactions` |
| Leverandørtransaksjon | AP Transaction | Felt: `ap_transactions` |

**Viktig distinksjon:**
- **Kunder/Customers** = Oversikt over klienten sine kunder
- **AR/Kundefordringer** = Kundefordringer med balanser og transaksjoner
- **Leverandører/Suppliers** = Oversikt over klienten sine leverandører
- **AP/Leverandørgjeld** = Leverandørgjeld med balanser og transaksjoner

### Dokumenter

| Norsk (UI) | Engelsk (Kode/DB) | Merknad |
|-----------|------------------|---------|
| Dokument | Document | Database: `documents` |
| Dokumentkategori | Document Category | - |
| Dokumentanalyse | Document Analysis | Service: documentAIService |
| Fil | File | - |
| Opplasting | Upload | - |
| Nedlasting | Download | - |
| SAF-T fil | SAF-T File | Standard Audit File for Tax |

### Revisjon (Audit)

| Norsk (UI) | Engelsk (Kode/DB) | Merknad |
|-----------|------------------|---------|
| Revisjonshandling | Audit Action | DB: `audit_actions` |
| Revisjonsmal | Audit Template | DB: `audit_action_templates` |
| Revisjonsområde | Audit Area | DB: `audit_areas` |
| Revisjonsfase | Audit Phase | Se [audit-phases.md](audit-phases.md) |
| Revisjonsrisiko | Audit Risk | - |
| Risikovurdering | Risk Assessment | DB: `risk_assessments` |
| Risikofaktor | Risk Factor | DB: `risk_factors` |
| Vesentlighet | Materiality | - |
| Kontrolltest | Control Testing | - |
| Substanstest | Substantive Testing | - |

### Revisjonsfaser

| Norsk (UI) | Engelsk (Kode) | Database verdi |
|-----------|--------------|---------------|
| Oversikt | Overview | `null` (ikke en fase) |
| Planlegging | Planning | `planning` |
| Risikovurdering | Risk Assessment | `planning` (del av planlegging) |
| Utførelse | Execution | `execution` |
| Fullføring | Completion | `conclusion` |
| Konklusjon | Conclusion | `conclusion` |

**Se også:** [audit-phases.md](audit-phases.md) for fullstendig mapping.

### ISA-standarder

| Norsk (UI) | Engelsk (Kode/DB) | Merknad |
|-----------|------------------|---------|
| ISA-standard | ISA Standard | Database: `isa_standards` |
| ISA 200 | ISA 200 | Revisorens overordnede mål |
| ISA 315 | ISA 315 | Risikovurdering |
| ISA 330 | ISA 330 | Revisorens respons |
| ISA 500 | ISA 500 | Revisjonsbevis |
| ISA 700 | ISA 700 | Konklusjon og rapportering |

### Kunnskapsbase

| Norsk (UI) | Engelsk (Kode/DB) | Merknad |
|-----------|------------------|---------|
| Kunnskapsbase | Knowledge Base | Route: `/fag` |
| Fagartikkel | Knowledge Article | DB: `knowledge_articles` |
| Fagområde | Subject Area | DB: `subject_areas` |
| Kategori | Category | DB: `categories` |
| Søk | Search | Service: knowledgeSearch |
| Embedding | Embedding | DB: `embeddings` |

### AI og Automatisering

| Norsk (UI) | Engelsk (Kode/DB) | Merknad |
|-----------|------------------|---------|
| AI-assistent | AI Assistant | Komponent: ContextAwareRevyAssistant |
| AI-analyse | AI Analysis | - |
| AI-anbefaling | AI Recommendation | DB: `ai_recommendations` |
| Modell | Model | (GPT-4, Claude, etc.) |
| Prompt | Prompt | DB: `ai_prompts` |
| Kontekst | Context | - |
| AI-bruk | AI Usage | DB: `ai_usage_logs` |
| Token | Token | - |

### Bruker og Organisasjon

| Norsk (UI) | Engelsk (Kode/DB) | Merknad |
|-----------|------------------|---------|
| Bruker | User | Database: `users` |
| Rolle | Role | DB: `roles` |
| Tilgang | Access | - |
| Team | Team | Database: `teams` |
| Organisasjon | Organization | - |
| Profil | Profile | - |

### Lønn (Payroll)

| Norsk (UI) | Engelsk (Kode/DB) | Merknad |
|-----------|------------------|---------|
| Lønn | Payroll | Route: `/payroll` |
| A-melding | A-melding | Norsk standard |
| A07 | A07 | Performance report code |
| Lønnsart | Salary Type | - |
| Ansatt | Employee | - |

### Investeringer

| Norsk (UI) | Engelsk (Kode/DB) | Merknad |
|-----------|------------------|---------|
| Verdipapir | Security | DB: `securities` |
| Portefølje | Portfolio | DB: `portfolios` |
| Transaksjon | Transaction | DB: `transactions` |
| Kurs | Price | DB: `prices` |
| Valuta | Currency | DB: `currencies` |
| Valutakurs | Exchange Rate | - |

### Analyse og Rapportering

| Norsk (UI) | Engelsk (Kode/DB) | Merknad |
|-----------|------------------|---------|
| Analyse | Analysis | - |
| Rapport | Report | - |
| Dashboard | Dashboard | (behold engelsk) |
| Widget | Widget | (behold engelsk) |
| Nøkkeltall | Key Figure | DB: `key_figures` |
| Trendanalyse | Trend Analysis | - |

---

## 🔄 Modul-mapping

### Overlappende moduler (Identifisert i Fase 1)

#### Customers vs AR (Kundefordringer)

| Modul | Route | Primært fokus |
|-------|-------|--------------|
| **Customers** | `/clients/:id/customers` | Oversikt over klienten sine kunder (master data) |
| **AR Balances** | `/clients/:id/ar` | Kundefordringer, balanser, og aldersfordeling |

**Anbefaling:** Behold begge - de har forskjellige formål. Tydeliggjør i UI.

#### Suppliers vs AP (Leverandørgjeld)

| Modul | Route | Primært fokus |
|-------|-------|--------------|
| **Suppliers** | `/clients/:id/suppliers` | Oversikt over klienten sine leverandører (master data) |
| **AP Balances** | `/clients/:id/ap` | Leverandørgjeld, balanser, og aldersfordeling |

**Anbefaling:** Behold begge - de har forskjellige formål. Tydeliggjør i UI.

### Testsider (Isolerte moduler)

Følgende moduler er testsider og skal ikke integreres i produksjonsflyt:

| Modul | Route | Formål |
|-------|-------|--------|
| **Academy** | `/academy` | Testing av opplæringsmateriell |
| **Training** | `/training` | Testing av treningsfunksjoner |
| **Revisorskolen** | `/revisorskolen` | Testing av revisorskole-funksjoner |

---

## 🌐 Route-standarder

### Etablerte routes (Behold)

```
/clients                    # Klientoversikt
/clients/:id/dashboard      # Klientdetaljer
/clients/:id/documents      # Dokumenter
/clients/:id/ar             # Kundefordringer
/clients/:id/ap             # Leverandørgjeld
/fag                        # Kunnskapsbase
/performance                # Ytelsesmonitor
```

### Legacy routes (Behold med redirect)

```
/klienter                   → Redirect til /clients
/klienter/:orgNumber        → Redirect til /clients/:id
/system/performance         → Redirect til /performance
```

### Fremtidige routes (Forslag)

```
/clients/:id/shareholders   # Aksjonærregister (erstatt /aksjonaerregister)
/clients/:id/fixed-assets   # Anleggsmidler
/clients/:id/inventory      # Varelager
```

---

## 📝 Navnekonvensjoner

### Frontend (React Components)

```typescript
// ✅ Korrekt - PascalCase
export const ClientDashboard = () => { }
export const AuditActionsList = () => { }

// ❌ Feil
export const clientDashboard = () => { }
export const audit_actions_list = () => { }
```

### Backend (Database, API)

```sql
-- ✅ Korrekt - snake_case
CREATE TABLE client_audit_actions (
  id UUID PRIMARY KEY,
  client_id UUID NOT NULL,
  action_template_id UUID
);

-- ❌ Feil
CREATE TABLE ClientAuditActions (
  ClientId UUID,
  ActionTemplateId UUID
);
```

### Hooks og Utilities

```typescript
// ✅ Korrekt
export const useClientData = () => { }
export const formatCurrency = () => { }

// ❌ Feil
export const UseClientData = () => { }
export const FormatCurrency = () => { }
```

---

## 🎯 Vanlige fallgruver

### 1. Inkonsistent bruk av AR/AP

❌ **Feil:**
```typescript
// Blander norsk og engelsk
const customerBalances = "Kundesaldo"
const arTransactions = "AR-transaksjoner"
```

✅ **Korrekt:**
```typescript
// Konsistent på norsk i UI
const label1 = "Kundesaldo"
const label2 = "Kundetransaksjoner"

// Konsistent på engelsk i kode
const fetchCustomerBalances = async () => { }
const fetchArTransactions = async () => { }
```

### 2. Route-språk

❌ **Feil:**
```typescript
// Nye routes på norsk
navigate('/klienter/ny')
navigate('/dokumenter/analyse')
```

✅ **Korrekt:**
```typescript
// Nye routes på engelsk
navigate('/clients/new')
navigate('/documents/analysis')

// Legacy routes med redirect
<Route path="/klienter" element={<Redirect to="/clients" />} />
```

### 3. UI-tekster

❌ **Feil:**
```tsx
<Button>Save</Button>
<CardTitle>Document Analysis</CardTitle>
```

✅ **Korrekt:**
```tsx
<Button>Lagre</Button>
<CardTitle>Dokumentanalyse</CardTitle>
```

---

## 📚 Relaterte dokumenter

- [audit-phases.md](audit-phases.md) - Fullstendig fase-mapping
- [cleanup/dead-code-audit.md](cleanup/dead-code-audit.md) - Identifiserte overlapp
- [modules-overview.md](modules-overview.md) - Moduloversikt

---

**Versjon:** 1.0  
**Sist oppdatert:** 2025-11-22  
**Neste gjennomgang:** Ved behov, minimum årlig
