# Route-standardisering

Dette dokumentet kartlegger og standardiserer applikasjonens URL-struktur.

**Opprettet:** 2025-11-22  
**Status:** Fase 2 - Pågående  
**Strategi:** Engelsk for nye routes, behold norske med redirects

---

## 🎯 Overordnet strategi

### Prinsipper

1. **Nye routes: Engelsk** - Alle nye routes skal være på engelsk
2. **Legacy routes: Redirects** - Norske routes beholdes som redirects for bakoverkompatibilitet
3. **SEO-vennlige** - Beskrivende, lowercase med bindestreker
4. **Konsistente** - Følg etablerte mønstre

### Eksempel på redirect-mønster

```typescript
// Ny standard route
<Route path="/shareholders" element={<ShareholdersPage />} />

// Legacy redirect
<Route path="/aksjonaerregister" element={<Navigate to="/shareholders" replace />} />
```

---

## 📊 Nåværende routes

### ✅ Standard routes (Engelsk - Behold)

#### Hovednavigasjon
```
/                           → Dashboard (Klientoversikt)
/dashboard                  → Hovedoversikt
/clients                    → Klientliste
/clients/:clientId          → Redirect til /clients/:clientId/dashboard
/clients/:clientId/dashboard → Klientdetaljer
```

#### Dokumenter og opplasting
```
/documents                  → Dokumentoversikt
/clients/:clientId/documents → Klientdokumenter
/clients/:clientId/upload-history → Opplastingshistorikk
```

#### Regnskap
```
/clients/:clientId/general-ledger → Hovedbok
/clients/:clientId/trial-balance → Saldobalanse
/clients/:clientId/trial-balance-view → Saldobalanse visning
/clients/:clientId/ledger → Hovedbok visning
/clients/:clientId/saft → SAF-T import
```

#### AR/AP (Kundefordringer/Leverandørgjeld)
```
/clients/:clientId/ar → Kundefordringer (Accounts Receivable)
/clients/:clientId/ap → Leverandørgjeld (Accounts Payable)
/clients/:clientId/customers → Kundeoversikt
/clients/:clientId/suppliers → Leverandøroversikt
```

#### Analyse
```
/clients/:clientId/analysis → Unified analyse
/clients/:clientId/regnskapsdata → Regnskapsdata-analyse
```

#### Lønn (Payroll)
```
/clients/:clientId/payroll → Lønnsoversikt
/clients/:clientId/payroll/a07 → A07 data
/clients/:clientId/payroll/analysis → Lønnsanalyse
/clients/:clientId/payroll/upload → Lønnsopplasting
/clients/:clientId/payroll/kontrolloppstilling → Kontrolloppstilling
```

#### Investeringer
```
/clients/:clientId/investments/overview → Oversikt
/clients/:clientId/investments/portfolios → Porteføljer
/clients/:clientId/investments/transactions → Transaksjoner
```

#### Ressurser (Globale)
```
/resources/currencies → Valutakurser
/resources/securities/prices → Verdipapirkurser
/resources/securities/catalog → Verdipapirkatalog
/resources/dataredigering → Dataredigering
/resources/pdf-creator → PDF-generator
/resources/aksjonaerregister → ⚠️ Bør standardiseres
```

#### AI og Automatisering
```
/ai-command → AI Command Center
/ai/multi-agent-studio → Multi-agent studio
/ai/documents → Dokumentanalyse
/ai/predictive → Prediktiv analyse
/ai/search → Intelligent søk
/ai/chat → AI-chat
/ai/risk → Risikovurdering
```

#### System og Admin
```
/performance → Ytelsesmonitor
/admin → Admin-panel
/superadmin → Superadmin-panel
/fag → Kunnskapsbase
/fag/admin → Kunnskapsbase admin
```

#### Organisasjon og Brukere
```
/profile → Brukerprofil
/organization → Organisasjonsoversikt
/organization/settings → Organisasjonsinnstillinger
/organization/roles → Rolletilganger
/teams → Team-oversikt
```

---

### 🔄 Legacy routes (Norsk - Med redirects)

#### Klienter
```
/klienter → REDIRECT til /clients
/klienter/:orgNumber → REDIRECT til /clients/:clientId
/klienter/:orgNumber/saft → REDIRECT til /clients/:clientId/saft
/klienter/:orgNumber/upload-historikk → REDIRECT til /clients/:clientId/upload-history
```

#### Analyse (Legacy)
```
/clients/:clientId/transaction-analysis → REDIRECT til /clients/:clientId/analysis
/clients/:clientId/audit/sampling → REDIRECT til /clients/:clientId/analysis
```

#### Investeringer (Legacy - client-specific)
```
/clients/:clientId/investments/securities → REDIRECT til /resources/securities/catalog
/clients/:clientId/investments/prices → REDIRECT til /resources/securities/prices
/clients/:clientId/investments/currencies → REDIRECT til /resources/currencies
```

---

## ⚠️ Routes som bør standardiseres

### 1. Aksjonærregister

**Nåværende:**
```
/resources/aksjonaerregister
```

**Anbefaling:**
```
/resources/shareholders → Ny standard route
/resources/aksjonaerregister → Redirect til /shareholders
```

**Implementering:**
```typescript
// I App.tsx
<Route path="resources/shareholders" element={<ProtectedRoute><ShareholdersPage /></ProtectedRoute>} />
<Route path="resources/aksjonaerregister" element={<Navigate to="/resources/shareholders" replace />} />
```

**Prioritet:** 🟡 Middels - Implementer når tid tillater

---

### 2. Regnskapsdata

**Nåværende:**
```
/clients/:clientId/regnskapsdata
```

**Anbefaling:**
```
/clients/:clientId/accounting-data → Ny standard
/clients/:clientId/regnskapsdata → Behold som redirect
```

**Prioritet:** 🟡 Middels - Kan vente

---

### 3. Kontrolloppstilling (Payroll)

**Nåværende:**
```
/clients/:clientId/payroll/kontrolloppstilling
```

**Anbefaling:**
```
/clients/:clientId/payroll/reconciliation → Ny standard
/clients/:clientId/payroll/kontrolloppstilling → Redirect
```

**Prioritet:** 🟡 Middels - Del av payroll-standardisering

---

### 4. Dataredigering

**Nåværende:**
```
/resources/dataredigering
```

**Anbefaling:**
```
/resources/data-editor → Ny standard
/resources/dataredigering → Redirect
```

**Prioritet:** 🟢 Lav - Intern verktøypage

---

## 🔄 Testsider (Isolert - Ingen endringer)

Følgende routes er testsider og skal IKKE standardiseres:

```
/academy → Test av opplæringsmateriell
/training → Test av treningsfunksjoner
/revisorskolen → Test av revisorskole-funksjoner
/sandbox → Utvikler-sandbox
```

**Merknad:** Disse sidene skal forbli isolerte og er ikke del av produksjonsflyt.

---

## 📋 Implementeringsplan

### Fase 1: Kritiske redirects (Allerede implementert ✅)

```typescript
// Klienter
<Route path="klienter" element={<Navigate to="/clients" replace />} />
<Route path="klienter/:orgNumber" element={<ClientRedirect />} />

// Analyse
<Route path="clients/:clientId/transaction-analysis" element={<AnalysisRedirect />} />
<Route path="clients/:clientId/audit/sampling" element={<AnalysisRedirect />} />

// Investeringer
<Route path="clients/:clientId/investments/securities" element={<InvestmentSecuritiesRedirect />} />
<Route path="clients/:clientId/investments/prices" element={<InvestmentPricesRedirect />} />
<Route path="clients/:clientId/investments/currencies" element={<InvestmentCurrenciesRedirect />} />
```

### Fase 2: Standardiser nye routes (Planlagt)

**Prioritet 1 - Høy synlighet:**
1. `/resources/aksjonaerregister` → `/resources/shareholders`
2. Oppdater alle interne lenker

**Prioritet 2 - Middels synlighet:**
3. `/clients/:id/regnskapsdata` → `/clients/:id/accounting-data`
4. `/clients/:id/payroll/kontrolloppstilling` → `/clients/:id/payroll/reconciliation`

**Prioritet 3 - Lav synlighet:**
5. `/resources/dataredigering` → `/resources/data-editor`

### Fase 3: Testing og verifisering

1. **Link-sjekk** - Søk gjennom kodebasen etter hardkodede lenker
2. **Redirect-testing** - Test at alle redirects fungerer
3. **SEO-sjekk** - Verifiser at redirects er 301 (permanent)
4. **Dokumentasjon** - Oppdater all dokumentasjon

---

## 🔍 Testing av redirects

### Manuell test-sjekklist

- [ ] Test `/klienter` → `/clients`
- [ ] Test `/klienter/:orgNumber` → `/clients/:clientId`
- [ ] Test alle investeringsredirects
- [ ] Test analyser redirects
- [ ] Verifiser at breadcrumbs oppdateres korrekt
- [ ] Sjekk at historikk fungerer med redirects

### Automatisert testing

```typescript
// cypress/e2e/redirects.cy.ts
describe('Route Redirects', () => {
  it('should redirect /klienter to /clients', () => {
    cy.visit('/klienter')
    cy.url().should('include', '/clients')
  })
  
  // ... flere tester
})
```

---

## 📚 Relaterte dokumenter

- [terminology.md](../terminology.md) - Terminologi-guide med route-oversikt
- [cleanup/README.md](./README.md) - Cleanup-prosess

---

## 📊 Status-oppsummering

| Kategori | Antall routes | Status |
|----------|--------------|--------|
| Standard (engelsk) | ~60 | ✅ OK |
| Legacy redirects | 7 | ✅ Implementert |
| Til standardisering | 4 | ⏳ Planlagt |
| Testsider (ikke endre) | 4 | ✅ Isolert |

**Estimat for standardisering:** 2-3 timer  
**Prioritet:** Middels - Kan gjøres gradvis

---

**Versjon:** 1.0  
**Sist oppdatert:** 2025-11-22  
**Neste gjennomgang:** Etter Fase 3
