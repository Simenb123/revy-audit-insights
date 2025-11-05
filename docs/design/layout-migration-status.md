# Layout Migration Status

Oversikt over layout-standardisering av alle sider i Revio.

## 📊 Status

**Total:** ~80 sider  
**Migrert:** 6 sider (høyprioriterte)  
**Status:** ⏳ Pågående

---

## ✅ Migrerte sider (Fase 2 & 3 - Ferdig)

| Side | Før | Etter | Layout-komponent | Status |
|------|-----|-------|------------------|--------|
| `ClientsOverview.tsx` | `space-y-[var(--content-gap)] w-full` | `<PageLayout width="full" spacing="normal">` | PageLayout | ✅ Migrert |
| `UserAdmin.tsx` | `space-y-6 p-6` | `<PageLayout width="wide" spacing="normal">` | PageLayout | ✅ Migrert |
| `Training.tsx` | `h-full overflow-auto` + `p-4` | `<ResponsiveLayout maxWidth="full">` | ResponsiveLayout | ✅ Migrert |
| `Reports.tsx` | `p-4 md:p-6` | `<ResponsiveLayout maxWidth="full">` | ResponsiveLayout | ✅ Migrert |
| `Superadmin.tsx` | `container mx-auto p-4` | `<PageLayout width="wide" spacing="normal">` | PageLayout | ✅ Migrert |
| `AllocationImport.tsx` | `container mx-auto p-4` | `<PageLayout width="medium" spacing="normal">` | PageLayout | ✅ Migrert |

---

## 📋 Audit-resultater: Sider som trenger migrering

**Total søkeresultater:**
- `p-[46]`: 223 treff i 64 filer
- `container mx-auto`: 16 treff i 14 filer  
- `space-y-[0-9]`: 299 treff i 66 filer
- `p-8`: 6 treff i 2 filer

---

## 🔴 Høy prioritet (Ofte brukte sider - 15 sider)

Disse sidene brukes ofte og bør migreres først:

| Side | Nåværende layout | Anbefalt løsning | Estimat |
|------|------------------|------------------|---------|
| `AICommandCenterPage.tsx` | `space-y-6` | `<PageLayout width="full" spacing="normal">` | 5 min |
| `AIWelcomePage.tsx` | `space-y-8` | `<PageLayout width="wide" spacing="relaxed">` | 5 min |
| `Academy.tsx` | `space-y-6` + nested | `<PageLayout width="wide" spacing="normal">` | 8 min |
| `AccountingAnalysis.tsx` | `p-4 md:p-6` | `<ResponsiveLayout maxWidth="full">` | 3 min |
| `AuditLogs.tsx` | `space-y-6` | `<PageLayout width="wide" spacing="normal">` | 5 min |
| `AccountingData.tsx` | `p-6` + nested | `<PageLayout width="wide" spacing="normal">` | 5 min |
| `AnalysisPage.tsx` | `p-6` + nested | `<PageLayout width="wide" spacing="normal">` | 5 min |
| `BookkeepingReports.tsx` | `container mx-auto py-6 space-y-6` | `<PageLayout width="wide" spacing="normal">` | 5 min |
| `AssetManagement.tsx` | `container mx-auto py-6` | `<PageLayout width="wide" spacing="normal">` | 4 min |
| `BudgetManagement.tsx` | `container mx-auto py-6` | `<PageLayout width="wide" spacing="normal">` | 4 min |
| `ClientDocuments.tsx` | `container mx-auto p-6` | `<PageLayout width="wide" spacing="normal">` | 4 min |
| `InvestmentPortfolios.tsx` | `container mx-auto p-6 space-y-6` | `<PageLayout width="wide" spacing="normal">` | 5 min |
| `TransactionAnalysis.tsx` | `container mx-auto p-6 space-y-6` | `<PageLayout width="wide" spacing="normal">` | 5 min |
| `Revisorskolen.tsx` | `container mx-auto p-6 space-y-6` | `<PageLayout width="wide" spacing="normal">` | 5 min |
| `ShareholderRegister.tsx` | `container mx-auto p-6 space-y-6` | `<PageLayout width="wide" spacing="normal">` | 5 min |

**Subtotal:** ~73 minutter (~1.2 timer)

---

## 🟡 Medium prioritet (Standard funksjonalitet - 12 sider)

| Side | Nåværende layout | Anbefalt løsning | Estimat |
|------|------------------|------------------|---------|
| `AIUsage.tsx` | `p-6` + nested | `<PageLayout width="wide" spacing="normal">` | 4 min |
| `AIMultiAgentStudio.tsx` | `space-y-6` | `<PageLayout width="full" spacing="normal">` | 4 min |
| `AccountingDataUpload.tsx` | `p-6` + nested | `<PageLayout width="medium" spacing="normal">` | 4 min |
| `ApBalances.tsx` | `p-6` + nested | `<PageLayout width="wide" spacing="normal">` | 4 min |
| `ArBalances.tsx` | `p-6` + nested | `<PageLayout width="wide" spacing="normal">` | 4 min |
| `BookkeepingJournal.tsx` | `p-6` + nested | `<PageLayout width="wide" spacing="normal">` | 4 min |
| `AuditSampling.tsx` | `container mx-auto py-6` | Allerede `StickyClientLayout` - OK | 0 min |
| `ReportsManagement.tsx` | `container mx-auto py-6` | `<PageLayout width="wide" spacing="normal">` | 4 min |
| `UploadHistory.tsx` | `container mx-auto py-6` | `<PageLayout width="wide" spacing="normal">` | 4 min |
| `SystemTest.tsx` | `container mx-auto p-6 space-y-8` | `<PageLayout width="wide" spacing="normal">` | 4 min |
| `Collaboration.tsx` | `space-y-6` in tabs | `<PageLayout width="wide" spacing="normal">` | 5 min |
| `Communication.tsx` | `space-y-4` | `<PageLayout width="medium" spacing="compact">` | 4 min |

**Subtotal:** ~45 minutter (~0.75 timer)

---

## 🟢 Lav prioritet (Admin/Spesialsider - 8 sider)

| Side | Nåværende layout | Anbefalt løsning | Estimat |
|------|------------------|------------------|---------|
| `Admin/AuditActionLibrary.tsx` | `container mx-auto px-4 py-8` | `<PageLayout width="wide" spacing="normal">` | 3 min |
| `AdminEmbeddingsManager.tsx` | `space-y-6` | `<PageLayout width="wide" spacing="normal">` | 3 min |
| `Admin.tsx` | `p-6` center layout | `<PageLayout width="medium" spacing="normal" center>` | 3 min |
| `Auth.tsx` | `p-4` center layout | Spesiell layout - OK | 0 min |
| `CurrencyManagement.tsx` | `space-y-6` | `<PageLayout width="medium" spacing="normal">` | 4 min |
| `PayrollReconciliation.tsx` | Export only | Sjekk modul | 2 min |
| `Admin/AccountRelationships.tsx` | Component only | Sjekk komponent | 2 min |
| `ressurser/aksjonaerregister/index.tsx` | `container mx-auto py-6 space-y-6` | `<PageLayout width="wide" spacing="normal">` | 4 min |

**Subtotal:** ~21 minutter (~0.35 timer)

---

## ✅ Allerede OK (Bruker layout-komponenter)

Disse sidene bruker allerede layout-komponenter korrekt:

- `ClientDetail.tsx` - ✅ Bruker `StickyClientLayout`
- `AuditSampling.tsx` - ✅ Bruker `StickyClientLayout`
- `Index.tsx` - ✅ Bruker `ResponsiveLayout`
- `TeamManagement.tsx` - ✅ Bruker `ResponsiveLayout`
- `KnowledgeBase.tsx` - ✅ Bruker `KnowledgeLayout`
- `KnowledgeArticle.tsx` - ✅ Bruker `KnowledgeLayout`

---

## 📊 Oppsummering

| Prioritet | Antall sider | Estimert tid |
|-----------|--------------|--------------|
| 🔴 Høy | 15 | ~73 min |
| 🟡 Medium | 12 | ~45 min |
| 🟢 Lav | 8 | ~21 min |
| **Total** | **35 sider** | **~139 min (~2.3 timer)** |

---

## 🎯 Anbefalte neste steg

**Batch 1 (Høy prioritet - dag 1):**
1. AI-sider: `AICommandCenterPage.tsx`, `AIWelcomePage.tsx`, `Academy.tsx` (~18 min)
2. Regnskap-sider: `AccountingAnalysis.tsx`, `AccountingData.tsx`, `AnalysisPage.tsx` (~13 min)
3. Rapporter: `BookkeepingReports.tsx`, `AuditLogs.tsx` (~10 min)

**Batch 2 (Høy prioritet - dag 2):**
4. Management-sider: `AssetManagement.tsx`, `BudgetManagement.tsx`, `InvestmentPortfolios.tsx` (~14 min)
5. Dokumenter: `ClientDocuments.tsx`, `TransactionAnalysis.tsx` (~9 min)
6. Trening: `Revisorskolen.tsx`, `ShareholderRegister.tsx` (~10 min)

**Batch 3 (Medium prioritet - dag 3):**
7. AI/Upload: `AIUsage.tsx`, `AIMultiAgentStudio.tsx`, `AccountingDataUpload.tsx` (~12 min)
8. Balanser: `ApBalances.tsx`, `ArBalances.tsx`, `BookkeepingJournal.tsx` (~12 min)
9. Diverse: `ReportsManagement.tsx`, `UploadHistory.tsx`, `SystemTest.tsx` (~12 min)

**Batch 4 (Medium + Lav prioritet - dag 4):**
10. Collaboration: `Collaboration.tsx`, `Communication.tsx` (~9 min)
11. Admin: Alle admin-sider (~21 min)

---

## 🔍 Søk etter hardkodet layout

**Søkemønstre å finne:**
```bash
# Søk etter hardkodet padding
grep -r "className.*p-[46]" src/pages/

# Søk etter container mx-auto
grep -r "container mx-auto" src/pages/

# Søk etter space-y
grep -r "space-y-[0-9]" src/pages/
```

---

## 📝 Neste steg

1. **Fase 4a:** Søk gjennom alle sider (se søkemønstre ovenfor)
2. **Fase 4b:** Identifiser resterende sider som trenger migrering
3. **Fase 4c:** Lag prioritert liste basert på:
   - Hvor ofte siden brukes
   - Kompleksitet av layout
   - Eksisterende problemer
4. **Fase 4d:** Migrer resterende sider batch-vis

---

## 🎯 Testing Checklist (per side)

- [ ] Desktop (1920px) - Spacing og width korrekt
- [ ] Tablet (768px) - Responsivt design fungerer
- [ ] Mobil (390px) - Alt innhold synlig
- [ ] SubHeader - Sticky positioning (hvis aktuelt)
- [ ] Scroll - Smooth scrolling fungerer
- [ ] Funksjonalitet - Eksisterende features virker

---

## 📚 Ressurser

- [Layout Architecture](./layout-architecture.md)
- [Page Migration Checklist](./page-migration-checklist.md)
- [Page Layout Guide](../page-layout.md)

---

**Sist oppdatert:** 2025-01-10  
**Status:** Fase 2 & 3 fullført (6 høyprioriterte sider)  
**Neste:** Fase 4 - Identifisere og migrere resterende sider
