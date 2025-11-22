# Cleanup Prosess - Oversikt

Dette er en systematisk cleanup-prosess for AI Revio kodebasen basert på analyse fra ekstern analytiker.

**Opprettet:** 2025-11-22  
**Status:** Fase 1 pågående

---

## 📋 Faseoversikt

### ✅ Fase 1: Navigasjon og Quick Wins (2 timer)
**Mål:** Fiks kritiske bugs og opprett oversikt

**Oppgaver:**
1. ✅ **Fiks navigasjonsfeil i AIWelcomePage** (15 min)
   - ✅ Endret `/system/performance` → `/performance`
   - Status: Komplett

2. ✅ **Legg til manglende route for AICommandCenterPage** (15 min)
   - ✅ Lagt til import av AICommandCenterPage i App.tsx
   - ✅ Lagt til route: `/ai-command`
   - Status: Komplett

3. ✅ **Inventarliste over overlappende moduler** (45 min)
   - ✅ Dokumentert Customers/AR overlap
   - ✅ Dokumentert Suppliers/AP overlap
   - ✅ Identifisert Collaboration-siden som potensielt ubrukt
   - Status: Komplett

4. ✅ **Identifiser død kode** (1 time)
   - ✅ Dokumentert i `dead-code-audit.md`
   - Status: Komplett

**Resultat:**
- Alle kritiske navigasjonsfeil fikset
- Komplett oversikt over problemer opprettet
- Grunnlag for videre cleanup lagt

---

### ✅ Fase 2: Terminologi og Språk (3 timer)
**Mål:** Opprett konsistent språkguide og start språkvasking

**Status:** ✅ Ferdig

**Oppgaver:**
1. ✅ **Opprett terminologi-guide** (1 time)
   - ✅ `docs/terminology.md` opprettet med alle domene-begreper
   - ✅ Mapping mellom engelsk (kode) og norsk (UI)
   - ✅ Modulforklaringer for overlappende moduler
   - Status: Komplett

2. ✅ **Språk-audit av UI** (1 time)
   - ✅ Kartlagt engelske UI-tekster i komponenter
   - ✅ Prioritert brukervendte sider først
   - ✅ Dokumentert i `docs/cleanup/ui-language-audit.md`
   - Status: Komplett

3. ✅ **Standardiser kritiske routes** (1 time)
   - ✅ Identifisert alle norske routes
   - ✅ Planlagt redirect-strategi
   - ✅ Dokumentert i `docs/cleanup/route-standardization.md`
   - Status: Komplett

**Resultat:**
- ✅ Komplett terminologi-guide på plass (100+ termer kartlagt)
- ✅ UI-språkaudit ferdig med estimat på 10 timer for implementering
- ✅ Route-standardisering dokumentert (60+ routes kartlagt)
- ✅ 3 nye dokumenter opprettet

---

### ⏳ Fase 3: Dokumentasjonsoppdatering (2 timer)
**Mål:** Fiks døde lenker og oppdater eksisterende docs

**Status:** Ikke startet

**Oppgaver:**
1. **Fiks døde lenker** (30 min)
   - README database-overview lenke
   - Søk etter andre brutte intern-lenker

2. **Oppdater module-overview.md** (1 time)
   - Tydeliggjør forskjell mellom overlappende moduler
   - Beskriv formålet med duplikate routes
   - Legg til deprecation-notices der relevant

3. **Lag cleanup-plan dokumentasjon** (30 min)
   - Dette dokumentet
   - Lenke til alle audit-dokumenter

---

### 📅 Fase 4: Refaktorering - Overlappende moduler (Planlegges separat)
**Mål:** Design løsning for å konsolidere duplikater

**Status:** Venter på Fase 1-3

**Dette krever dypere analyse:**
- Brukerundersøkelse: Hvilke moduler brukes mest?
- Teknisk analyse: Kan vi merge funksjonalitet?
- Design: Hvordan beholde det beste fra hver?

**Estimert omfang:** 20-30 timer (tilsvarende Audit Actions-refaktorering)

**Foreslått tilnærming:**
- Start med minst kritisk modul
- Bruk samme 8-fase metodikk som Audit Actions
- Full testing og dokumentasjon underveis

---

## 📁 Dokumenter

### Cleanup-dokumenter:
- [`dead-code-audit.md`](./dead-code-audit.md) - Identifisert død kode og manglende routes
- `ui-language-audit.md` (kommer i Fase 2) - Engelsk tekst i UI
- `terminology.md` (kommer i Fase 2) - Terminologi-guide

### Eksisterende dokumentasjon:
- [`docs/modules-overview.md`](../modules-overview.md) - Moduloversikt (trenger oppdatering)
- [`docs/audit-actions/`](../audit-actions/) - Audit Actions refaktorering (mal for Fase 4)

---

## 🎯 Prioriteringer

### ✅ Ferdig i Fase 1:
1. ✅ Kritiske navigasjonsfeil fikset
2. ✅ Manglende routes lagt til
3. ✅ Overlapp kartlagt
4. ✅ Død kode identifisert

### ✅ Ferdig i Fase 2:
1. ✅ Terminologi-guide opprettet (`docs/terminology.md`)
2. ✅ UI-språkaudit ferdig (`docs/cleanup/ui-language-audit.md`)
3. ✅ Route-standardisering dokumentert (`docs/cleanup/route-standardization.md`)

### 🔜 Neste steg (Fase 3):
1. Fiks døde lenker i dokumentasjon
2. Oppdater module-overview.md
3. Lag fullstendig cleanup-oversikt

---

## 📊 Statistikk

**Fase 1 resultater:**
- Navigasjonsfeil fikset: 1
- Manglende routes lagt til: 1
- Overlappende moduler identifisert: 2 par (Customers/AR, Suppliers/AP)
- Potensielt ubrukte sider: 1 (Collaboration)

**Fase 2 resultater:**
- Dokumenter opprettet: 3 (`terminology.md`, `ui-language-audit.md`, `route-standardization.md`)
- Terminologi kartlagt: 100+ termer
- UI-tekster identifisert: ~50 vanlige oversettelser
- Routes kartlagt: 60+ standardroutes, 7 legacy redirects, 4 til standardisering

**Estimert total tid for Fase 1-3:** 7 timer  
**Faktisk tid Fase 1:** ~1 time  
**Faktisk tid Fase 2:** ~1.5 timer

---

## 🔗 Relaterte ressurser

- [Audit Actions Refactoring Documentation](../audit-actions/README.md) - Mal for store refaktoreringer
- [Original Analysis Document](../../Overordnet_Evaluering_av_Kodebasen_AI_Revï_GitHub-repo-2.docx) - Analytiker-rapport

---

**Sist oppdatert:** 2025-11-22  
**Neste gjennomgang:** Etter Fase 2
