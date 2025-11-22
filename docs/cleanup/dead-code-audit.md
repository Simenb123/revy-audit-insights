# Dead Code Audit - Fase 1

Denne filen dokumenterer resultatene fra Fase 1 av cleanup-prosessen, spesifikt identifisering av død kode og manglende routes.

**Dato:** 2025-11-22  
**Status:** Pågående  
**Ansvarlig:** AI Analytiker

---

## 🔴 Kritiske funn - Manglende routes

### 1. AICommandCenterPage - Manglende route

**Status:** ⚠️ Route mangler, men komponenten er aktivt referert  
**Alvorlighetsgrad:** Kritisk

**Beskrivelse:**
- Komponenten `src/pages/AICommandCenterPage.tsx` eksisterer og er fullstendig implementert
- Flere steder i applikasjonen navigerer til `/ai-command`:
  - `AIRevioSidebar.tsx` (linje 44): "AI Command Center" med "NY" badge
  - `AIWelcomePage.tsx` (linje 112, 235): "Start AI-analyse" knapper
- **Problemet:** Ingen route i `App.tsx` matcher `/ai-command`
- Dette fører til 404-feil når brukere klikker på disse lenkene

**Løsning:**
Legg til route i `App.tsx`:
```tsx
import AICommandCenterPage from "./pages/AICommandCenterPage";

// ... i routes:
<Route path="ai-command" element={<ProtectedRoute><AICommandCenterPage /></ProtectedRoute>} />
```

**Prioritet:** Høy - Fikses umiddelbart

---

## ✅ Fikset - Navigasjonsfeil

### 1. AIWelcomePage - Feil performance-route

**Status:** ✅ Fikset  
**Fil:** `src/pages/AIWelcomePage.tsx`

**Problem:**
- Linje 121: `navigate('/system/performance')` → skulle vært `navigate('/performance')`
- Route `/system/performance` eksisterer ikke
- Korrekt route er `/performance` (App.tsx linje 204)

**Løsning:** Endret til `/performance`

---

## 📊 Inventar - Overlappende moduler

### 1. Customers (Kunder) vs AR (Kundefordringer)

**Overlapp identifisert:**

| Feature | Route | Komponent | Formål |
|---------|-------|-----------|--------|
| Customers | `/clients/:clientId/customers` | `CustomersPage` | Kunde-oversikt |
| AR Balances | `/clients/:clientId/ar` | `ArBalances` | Kundefordringer/balanser |

**Analyse:**
- Begge håndterer kunde-relaterte data
- `CustomersPage` ser ut til å være mer generell kunde-oversikt
- `ArBalances` fokuserer spesifikt på kundefordringer (accounts receivable)
- Mulig overlap i funksjonalitet, men kan også være komplementære

**Neste steg:** 
- Kartlegg nøyaktig hva hver side viser
- Intervju brukere om hvilken de faktisk bruker
- Vurder sammenslåing eller tydelig differensiering

---

### 2. Suppliers (Leverandører) vs AP (Leverandørgjeld)

**Overlapp identifisert:**

| Feature | Route | Komponent | Formål |
|---------|-------|-----------|--------|
| Suppliers | `/clients/:clientId/suppliers` | `SuppliersPage` | Leverandør-oversikt |
| AP Balances | `/clients/:clientId/ap` | `ApBalances` | Leverandørgjeld/balanser |

**Analyse:**
- Speiler mønsteret for Customers/AR
- `SuppliersPage` er generell leverandør-oversikt
- `ApBalances` fokuserer på leverandørgjeld (accounts payable)
- Samme mønster som Customers/AR - mulig overlap

**Neste steg:**
- Samme prosess som for Customers/AR
- Vurder en unified tilnærming for begge par (Customers/AR og Suppliers/AP)

---

## 🟡 Potensielt død kode (krever ytterligere analyse)

### Collaboration-siden

**Status:** ⚠️ Trenger verifikasjon  
**Route:** `/collaboration`  
**Komponent:** `src/pages/Collaboration.tsx`

**Observasjoner:**
- Route eksisterer i App.tsx (linje 184)
- Komponenten er fullstendig implementert med:
  - Arbeidsområder (workspaces)
  - Videomøter
  - Meldinger
  - Aktivitetsfeed
- **Spørsmål:** Er denne i aktiv bruk? Finnes det lenker til denne fra menyer?

**Neste steg:**
- Søk etter lenker til `/collaboration` i UI
- Sjekk med brukere om funksjonen brukes
- Vurder om den skal beholdes, fjernes, eller flyttes

---

## 📝 Neste fase

**Fase 2 oppgaver:**
1. Legg til manglende `/ai-command` route
2. Verifiser om Collaboration-siden brukes
3. Kartlegg Customers/AR og Suppliers/AP i detalj
4. Opprett terminologi-guide

---

## Vedlegg: Søkeresultater

### AR/AP komponenter funnet:
- `ArBalanceTable.tsx` - Viser kundefordringer
- `ApBalanceTable.tsx` - Viser leverandørgjeld
- `SaftCustomersTable.tsx` - SAF-T kunde-import
- `SaftSuppliersTable.tsx` - SAF-T leverandør-import
- `CustomerReport.tsx` - Kunderapporter
- `SupplierReport.tsx` - Leverandørrapporter

### Database-tabeller:
- `ar_customer_balances` - Kundefordringer
- `ap_supplier_balances` - Leverandørgjeld
- `ar_transactions` - Kundetransaksjoner
- `ap_transactions` - Leverandørtransaksjoner

---

**Sist oppdatert:** 2025-11-22
