# UI Språk-audit

Dette dokumentet kartlegger engelske UI-tekster som bør oversettes til norsk.

**Opprettet:** 2025-11-22  
**Status:** Fase 2 - Pågående  
**Prioritet:** Brukervend Frontend > Admin-sider > Dev-tools

---

## 📊 Overordnet Status

**Målsetning:** All brukervendt UI på norsk  
**Nåværende situasjon:** Primært norsk med spredt engelsk  
**Estimert arbeid:** 10-15 timer for fullstendig oversettelse

---

## 🎯 Prioriteringsmatrise

### 🔴 Høy prioritet (Brukervendt)
Disse sidene møter sluttbrukere daglig og skal oversettes først:

1. **Klientoversikt og Dashboard**
   - `/clients` - ClientsOverview
   - `/clients/:id/dashboard` - ClientDetail
   - Hovednavigasjon - AIRevioSidebar

2. **Dokumenthåndtering**
   - `/clients/:id/documents` - ClientDocuments
   - Dokumentopplasting og -analyse

3. **Kundefordringer og Leverandørgjeld**
   - `/clients/:id/ar` - ArBalances
   - `/clients/:id/ap` - ApBalances
   - `/clients/:id/customers` - CustomersPage
   - `/clients/:id/suppliers` - SuppliersPage

4. **Regnskap**
   - `/clients/:id/general-ledger` - GeneralLedgerUpload
   - `/clients/:id/trial-balance` - TrialBalanceUpload
   - `/clients/:id/ledger` - LedgerPage

5. **AI-assistent**
   - Revy chat-grensesnitt
   - AI-anbefalinger

### 🟡 Middels prioritet (Delvis brukervendt)

6. **Analyser og Rapporter**
   - `/clients/:id/analysis` - UnifiedAnalysisPage
   - Rapportgeneratorer

7. **Kunnskapsbase**
   - `/fag` - KnowledgeBase (allerede hovedsakelig norsk)

8. **Brukerinnstillinger**
   - `/profile` - UserProfile
   - `/organization/settings` - OrganizationSettings

### 🟢 Lav prioritet (Admin/Dev)

9. **Admingrensesnitt**
   - `/admin` - AdminPage
   - `/superadmin` - Superadmin
   - `/standard-accounts` - StandardAccountsAdmin

10. **Testsider** (Skip - testsider skal ikke oversettes)
    - `/academy` - Academy
    - `/training` - Training
    - `/revisorskolen` - Revisorskolen
    - `/sandbox` - Sandbox

---

## 🔍 Identifiserte engelske UI-tekster

### Navigasjon (AIRevioSidebar)

**Status:** ✅ Hovedsakelig norsk, enkelte unntak

| Linje | Nåværende (Engelsk) | Forslag (Norsk) | Prioritet |
|-------|-------------------|----------------|-----------|
| 44 | "AI Command Center" | "AI Kommandosenter" | 🔴 Høy |
| 42 | "Dashboard" | Behold (etablert term) | ✅ OK |
| 45 | "Dokumenter" | ✅ Allerede norsk | ✅ OK |

**Merknad:** Hovednavigasjonen er godt oversatt. "Dashboard" kan beholdes som etablert fagterm.

---

### Vanlige knapper og handlinger

**Mønster funnet i mange komponenter:**

| Engelsk tekst | Forslag (Norsk) | Kontekst | Prioritet |
|--------------|----------------|----------|-----------|
| "Save" | "Lagre" | Lagre-knapper | 🔴 Høy |
| "Cancel" | "Avbryt" | Avbryt-knapper | 🔴 Høy |
| "Delete" | "Slett" | Slette-knapper | 🔴 Høy |
| "Edit" | "Rediger" | Rediger-knapper | 🔴 Høy |
| "Create" | "Opprett" / "Lag ny" | Opprett-knapper | 🔴 Høy |
| "Add" | "Legg til" | Legg til-knapper | 🔴 Høy |
| "Remove" | "Fjern" | Fjern-knapper | 🔴 Høy |
| "Update" | "Oppdater" | Oppdater-knapper | 🔴 Høy |
| "Search" | "Søk" | Søkefelt | 🔴 Høy |
| "Filter" | "Filtrer" | Filter-knapper | 🔴 Høy |
| "Export" | "Eksporter" | Eksport-knapper | 🔴 Høy |
| "Download" | "Last ned" | Nedlastinger | 🔴 Høy |
| "Upload" | "Last opp" | Opplastinger | 🔴 Høy |
| "Submit" | "Send inn" | Skjemaer | 🔴 Høy |
| "Next" | "Neste" | Navigasjon | 🔴 Høy |
| "Previous" | "Forrige" | Navigasjon | 🔴 Høy |
| "Back" | "Tilbake" | Navigasjon | 🔴 Høy |
| "Close" | "Lukk" | Dialoger | 🔴 Høy |
| "Confirm" | "Bekreft" | Bekreftelser | 🔴 Høy |

---

### Spesifikke komponenter

#### AIWelcomePage

**Status:** 🟡 Blandet norsk og engelsk

| Linje | Nåværende | Forslag | Prioritet |
|-------|-----------|---------|-----------|
| Diverse | Card-titler blandet | Gjennomgå alle | 🟡 Middels |

#### AICommandCenterPage

**Status:** 🟡 Hovedsakelig norsk, men noen engelske termer

| Element | Nåværende | Forslag | Prioritet |
|---------|-----------|---------|-----------|
| Header | "AI Command Center" | "AI Kommandosenter" | 🔴 Høy |
| Tabs | Blanding | Sjekk alle faner | 🔴 Høy |

---

## 🔧 Implementeringsstrategi

### Fase 1: Globale komponenter (2 timer)

**Oppgave:** Overset alle gjenbrukte UI-komponenter

1. **Button-komponenter**
   - Lag norske varianter av standard-knapper
   - Eksempel: `<Button variant="save">Lagre</Button>`

2. **Dialog/Modal-komponenter**
   - Standard tekster: "Lukk", "Bekreft", "Avbryt"
   - Feilmeldinger på norsk

3. **Form-komponenter**
   - Placeholder-tekster på norsk
   - Valideringsfeil på norsk

### Fase 2: Prioriterte sider (4 timer)

**Oppgave:** Overset 🔴 høy prioritet sider

1. Klientoversikt og Dashboard
2. Dokumenthåndtering
3. AR/AP sider
4. Regnskapssider

### Fase 3: Middels prioritet (3 timer)

**Oppgave:** Overset 🟡 middels prioritet sider

1. Analyser og rapporter
2. Brukerinnstillinger
3. Organisasjonsinnstillinger

### Fase 4: QA og testing (1 time)

**Oppgave:** Kvalitetssikring

1. Visuell gjennomgang av alle sider
2. Test navigasjonsflyt
3. Sjekk at alle tekster er konsistente

---

## 📝 Spesielle hensyn

### Fagtermer som kan beholdes på engelsk

Følgende fagtermer kan beholdes på engelsk:

- **Dashboard** - Etablert term i norsk IT-språk
- **Widget** - Etablert term
- **ISA** - Internasjonal standard
- **GAAP** - Internasjonal standard
- **ROI** - Return on Investment
- **API** - Application Programming Interface
- **Token** - AI-kontekst

### Termer som MÅ oversettes

- **Upload/Download** → "Last opp"/"Last ned"
- **Save/Cancel** → "Lagre"/"Avbryt"
- **Edit/Delete** → "Rediger"/"Slett"
- **All button labels** → Alle knappetekster
- **All form labels** → Alle skjemaetiketter
- **All placeholders** → Alle plassholdere

---

## 🎯 Målsetning

**Kortsiktig (1-2 uker):**
- ✅ Alle 🔴 høy prioritet sider oversatt
- ✅ Alle knapper og handlinger oversatt
- ✅ Navigasjon 100% norsk

**Mellomlang sikt (1 måned):**
- ✅ Alle 🟡 middels prioritet sider oversatt
- ✅ Alle feilmeldinger på norsk
- ✅ Konsistent terminologi på tvers

**Langsiktig (3 måneder):**
- ✅ 100% norsk brukeropplevelse (unntatt fagtermer)
- ✅ Språktesting implementert i CI/CD
- ✅ Språkguide integrert i utviklerprosess

---

## 🔄 Vedlikeholdsprosess

### For utviklere

1. **Sjekk terminologi-guiden** (`docs/terminology.md`) før du skriver UI-tekster
2. **Bruk norsk som default** for alle brukervendte tekster
3. **Test språk** før du merger PR-er
4. **Dokumenter nye termer** i terminologi-guiden

### For code review

- ✅ Sjekk at alle UI-tekster er på norsk
- ✅ Verifiser at fagtermer følger terminologi-guiden
- ✅ Test at oversettelser er korrekte og naturlige

---

## 📚 Relaterte dokumenter

- [terminology.md](../terminology.md) - Terminologi-guide
- [cleanup/README.md](./README.md) - Cleanup-prosess oversikt

---

## 📊 Estimert arbeid

| Fase | Estimat | Status |
|------|---------|--------|
| Fase 1: Globale komponenter | 2 timer | ⏳ Ikke startet |
| Fase 2: Høy prioritet sider | 4 timer | ⏳ Ikke startet |
| Fase 3: Middels prioritet | 3 timer | ⏳ Ikke startet |
| Fase 4: QA og testing | 1 time | ⏳ Ikke startet |
| **Total** | **10 timer** | |

---

**Versjon:** 1.0  
**Sist oppdatert:** 2025-11-22  
**Neste gjennomgang:** Etter Fase 2 implementering
