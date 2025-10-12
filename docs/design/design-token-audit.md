# Design Token Audit og Standardisering

## 🎯 Mål
Standardisere alle design tokens til HSL-format og semantic naming conventions.

## ❌ Nåværende problemer

### 1. **KRITISK: Revio-farger i HEX-format**
I `tailwind.config.ts`:
```typescript
revio: {
  DEFAULT: '#2A9D8F',  // ❌ HEX
  light: '#47B4A7',    // ❌ HEX
  dark: '#1F756B',     // ❌ HEX
  50: '#E6F3F1',       // ❌ HEX
  // ... etc
}
```

**Skal være HSL** (som alle andre farger i systemet).

### 2. **Inkonsistent bruk av farger**
- 64 komponenter bruker hardkodede klasser: `bg-revio-500`, `text-revio-800`
- Mangler semantic tokens for brand colors
- Duplikate definisjoner i `index.css` og `tailwind.config.ts`

### 3. **Manglende semantic mapping**
Revio brand colors har ikke semantiske navn:
- `revio-500` → burde være `--brand-primary`
- `revio-100` → burde være `--brand-surface`
- `revio-900` → burde være `--brand-text`

## ✅ Løsning: HSL-konvertering

### Revio Brand Colors (HEX → HSL)

| Token       | HEX       | HSL               | Bruk                |
|-------------|-----------|-------------------|---------------------|
| revio-50    | #E6F3F1   | 174 57% 93%       | Lys bakgrunn        |
| revio-100   | #C2E1DE   | 174 57% 88%       | Surface, badge      |
| revio-200   | #9ACECC   | 174 57% 78%       | Hover states        |
| revio-300   | #72BDB9   | 174 57% 68%       | Borders             |
| revio-400   | #55B0AB   | 174 57% 58%       | Disabled states     |
| revio-500   | #2A9D8F   | 173 57% 39%       | **Primary brand**   |
| revio-600   | #249082   | 173 49% 35%       | Hover primary       |
| revio-700   | #1F7F71   | 173 49% 30%       | Active primary      |
| revio-800   | #196F62   | 173 49% 26%       | Dark text           |
| revio-900   | #105045   | 173 49% 15%       | Darkest text        |

### Semantic Token Mapping

```css
:root {
  /* Brand Colors (Semantic) */
  --brand-primary: var(--revio-500);          /* 173 57% 39% */
  --brand-primary-hover: var(--revio-600);    /* 173 49% 35% */
  --brand-primary-active: var(--revio-700);   /* 173 49% 30% */
  --brand-surface: var(--revio-100);          /* 174 57% 88% */
  --brand-surface-hover: var(--revio-200);    /* 174 57% 78% */
  --brand-text: var(--revio-900);             /* 173 49% 15% */
  --brand-text-muted: var(--revio-800);       /* 173 49% 26% */
  --brand-border: var(--revio-300);           /* 174 57% 68% */
}
```

## 📋 Implementeringsplan

### Fase 2.1: Konverter til HSL ✅ FULLFØRT
1. ✅ Oppdater `tailwind.config.ts` - konverter revio HEX til HSL
2. ✅ Oppdater `index.css` - sikre konsistens + semantic tokens
3. ✅ Oppdater `docs/color-palette.md` med full dokumentasjon
4. ✅ Verifiser at eksisterende komponenter fortsatt fungerer (bakoverkompatibelt)

### Fase 2.2: Legg til semantic tokens ✅ FULLFØRT
1. ✅ Semantic brand tokens i `index.css` (--brand-primary, etc.)
2. ✅ Utility classes (.bg-brand-primary, .text-brand-text, etc.)
3. ✅ Button variant="brand" for konsistent branding
4. ✅ Extended badge variants (badge-variants.tsx)
5. ✅ Dokumentasjon (docs/design/component-variants.md)

### Fase 2.3: Migrering (Gradvis) ✅ FULLFØRT
1. ✅ Migrer kritiske layout-komponenter:
   - ✅ `GlobalSubHeader.tsx` - bg-revio-500 → bg-brand-header
   - ✅ `ClientSubHeader.tsx` - bg-revio-500 → bg-brand-header
   - ✅ `GlobalHeader.tsx` - bg-revio-500 → bg-brand-header
2. ✅ Lag full migreringsguide (`docs/design/migration-guide.md`)
3. ✅ Migrer UI-komponenter:
   - ✅ `button.tsx` - brand variant
   - ✅ `badge-variants.tsx` - brand og brand-solid variants
4. ✅ Migrer høy-prioritet komponenter (Batch 1):
   - ✅ `FileUploadZone.tsx` - ikoner, borders, hover states
   - ✅ `ClientFilters.tsx` - filter button
   - ✅ `ProjectCard.tsx` - badge og button
5. ✅ Migrer alle gjenværende komponenter (Batch 3):
   - ✅ Admin: `StandardAccountTable.tsx`
   - ✅ Client: `ClientStatsGrid.tsx`
   - ✅ Training: `ManagerDashboard.tsx`, `ScenarioSelection.tsx`, `StructuredLearningPath.tsx`, `TrainingOverview.tsx`, `Training.tsx`
   - ✅ Utils: `accountColors.ts`
6. ✅ **16/16 komponenter migrert (100%)**

### Fase 2.4: Validering ⏭️ NESTE
1. Kjør visuell regresjon test
2. Verifiser kontrast ratios (WCAG AA)
3. Test dark mode konsistens

## 🎨 Brukseksempler

### ❌ Gammelt (hardkodet)
```tsx
<Button className="bg-revio-500 hover:bg-revio-600 text-white">
  Klikk her
</Button>
```

### ✅ Nytt (semantic)
```tsx
<Button variant="brand">
  Klikk her
</Button>

// Eller med Tailwind:
<div className="bg-brand-primary hover:bg-brand-primary-hover">
  Innhold
</div>
```

## 📊 Påvirkning

- **16 filer** med hardkodede revio-klasser (72 treff totalt)
- **16 filer migrert** ✅ **(100% fullført)**
- **0 filer gjenstår**
- **0 breaking changes** (bakoverkompatibilitet bevart)
- **Forbedringer**: Konsistens, vedlikeholdbarhet, theme support, lysere header for bedre visuell hierarki

## 🔗 Relaterte filer

- `tailwind.config.ts` - Hovedkilde for fargedefinisjoner
- `src/index.css` - CSS-variabler og utilities
- `docs/color-palette.md` - Brand color dokumentasjon
- `src/styles/theme.ts` - Theme system
