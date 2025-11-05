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

## ⏳ Neste sider (Fase 4 - Venter)

Disse sidene må vurderes og migreres:

### Klient-sider
- `ClientDetail.tsx` - ✅ Allerede bruker StickyClientLayout
- `ClientWorkpapers.tsx` - Sjekk layout
- `ClientChecklist.tsx` - Sjekk layout
- `ClientAccounting.tsx` - Sjekk layout

### Admin-sider
- `DepartmentsManagement.tsx` - Trenger PageLayout?
- `TeamManagement.tsx` - ✅ Allerede bruker ResponsiveLayout
- `Settings.tsx` - Sjekk layout

### Knowledge-sider
- `KnowledgeBase.tsx` - Bruker KnowledgeLayout (OK)
- `KnowledgeArticle.tsx` - Bruker KnowledgeLayout (OK)

### Workflow-sider
- `WorkflowBuilder.tsx` - Sjekk layout
- `WorkflowTemplates.tsx` - Sjekk layout

### Diverse
- `Dashboard.tsx` - Sjekk layout
- `Profile.tsx` - Sjekk layout
- `Index.tsx` - ✅ Allerede bruker ResponsiveLayout

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
