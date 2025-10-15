# Revio Design System

Velkommen til Revio design system dokumentasjon! Dette er din "inngangsport" til å forstå hvordan farger, tokens og styling fungerer i applikasjonen.

## 🎨 Fargessystem

### Arkitektur (4 lag)

```
Raw Colors (--revio-500: 173 57% 39%)
    ↓
Semantic Tokens (--brand-header: var(--revio-500))
    ↓
Tailwind Mapping (brand.header: 'hsl(var(--brand-header))')
    ↓
React Components (className="bg-brand-header")
```

**KRITISK INNSIKT:** CSS custom properties og Tailwind colors er **to separate systemer** som må synkroniseres!

- ✅ **Definér i CSS**: `:root { --brand-header: var(--revio-500); }` i `src/index.css`
- ✅ **Eksponér til Tailwind**: `brand: { header: 'hsl(var(--brand-header))' }` i `tailwind.config.ts`
- ✅ **Bruk i komponenter**: `className="bg-brand-header"` i React-komponenter

### Hvorfor 4 lag?

1. **Raw colors** (--revio-500) = Single source of truth for fargeverdier
2. **Semantic tokens** (--brand-header) = Gir mening til farger (hva de brukes til)
3. **Tailwind mapping** (brand.header) = Gjør tokens tilgjengelig som utility-klasser
4. **React components** (bg-brand-header) = Bruker klasser, ikke direkte CSS properties

Dette sikrer:
- 🎯 **Konsistens**: Én kilde for alle farger
- 🔧 **Vedlikeholdbarhet**: Endre én verdi, oppdater hele appen
- 🎨 **Semantikk**: Farger har mening (header, surface, text)
- ⚡ **Tailwind power**: Full tilgang til opacity modifiers (bg-brand-header/95)

## 📚 Dokumentasjon

### Start her
1. **[Tailwind Brand Integration](./tailwind-brand-integration.md)** ⭐ **START HER!**
   - Forklarer hvorfor `brand` colors må være både i CSS og Tailwind config
   - Løser vanlige problemer (feil farger, opacity ikke fungerer, etc.)
   - Best practices for å legge til nye tokens
   - **Les denne først hvis du er forvirret!**

### Referanser
2. **[Design Token Audit](./design-token-audit.md)**
   - Full migreringsstatus (16/16 komponenter migrert)
   - HSL-konvertering og semantic mapping
   - Implementeringsplan og validering
   - Lessons learned fra header-color buggen

3. **[Migration Complete Report](./migration-complete-report.md)**
   - Oppsummering av hele migreringsprosessen
   - Lessons learned: CSS custom properties ≠ Tailwind utility classes
   - Metrics og resultater

4. **[Migration Guide](./migration-guide.md)**
   - Steg-for-steg guide for å migrere komponenter
   - Før/etter eksempler
   - Best practices

5. **[Color Palette](../color-palette.md)**
   - Komplett oversikt over alle Revio brand colors
   - HEX → HSL konverteringstabell

6. **[Component Variants](./component-variants.md)**
   - Badge og button variants
   - Brukseksempler med semantic tokens

7. **[Layout Architecture](./layout-architecture.md)**
   - Header-hierarki (Global header, Sub-header, Sidebar)
   - Høyder, z-index og positioning

## 🚀 Quick Start

### Legg til en ny farge

**1. Definér raw value i `src/index.css`:**
```css
:root {
  /* Raw color value (HSL uten hsl() wrapper) */
  --accent-500: 200 80% 50%;
}
```

**2. Lag semantic token i `src/index.css`:**
```css
:root {
  /* Semantic token som refererer raw color */
  --brand-accent: var(--accent-500);
}
```

**3. Eksponér til Tailwind i `tailwind.config.ts`:**
```typescript
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          // Wrap i hsl() function for Tailwind
          accent: 'hsl(var(--brand-accent))',
        }
      }
    }
  }
}
```

**4. Bruk i komponenter:**
```tsx
// Tailwind utility class (anbefalt)
<div className="bg-brand-accent text-white">

// Med opacity modifier
<div className="bg-brand-accent/95">

// Hover variant
<div className="hover:bg-brand-accent">
```

### Vanlige problemer og løsninger

#### ❌ Problem: `bg-brand-header` viser ikke korrekt farge
**Diagnose:** Tailwind har ikke generert klassen fordi `brand.header` mangler i config.

**Løsning:** 
```typescript
// tailwind.config.ts
colors: {
  brand: {
    header: 'hsl(var(--brand-header))', // ← Legg til denne linjen
  }
}
```

#### ❌ Problem: Opacity modifier fungerer ikke (`bg-brand-header/95`)
**Diagnose:** CSS custom property er definert som `hsl(173 57% 39%)` (med hsl() wrapper).

**Løsning:** 
```css
/* ❌ FEIL - inkluderer hsl() wrapper */
--brand-header: hsl(173 57% 39%);

/* ✅ RIKTIG - bare HSL-verdier */
--brand-header: 173 57% 39%;
```

#### ❌ Problem: Farger vises ikke etter endringer
**Diagnose:** Vite dev server må rebuilde Tailwind CSS.

**Løsning:**
1. Hard refresh: `Cmd+Shift+R` (Mac) eller `Ctrl+Shift+R` (Windows)
2. Eller restart dev server: `npm run dev`

#### ❌ Problem: `[data-sub-header]` CSS overskriver Tailwind-klasser
**Diagnose:** Attribute selector har høyere specifisitet enn utility class.

**Løsning:**
```css
/* Bruk :not() selector for å unngå konflikt med Tailwind-klasser */
[data-sub-header]:not([class*="bg-"]) {
  background: hsl(var(--brand-header));
}
```

Se [Tailwind Brand Integration](./tailwind-brand-integration.md) for mer feilsøking.

## 📂 Viktige filer

### Config og styles
- **`tailwind.config.ts`** - Tailwind color system (må synkroniseres med CSS)
- **`src/index.css`** - CSS custom properties (single source of truth for fargeverdier)

### Referanse-komponenter
- **`src/components/Layout/GlobalHeader.tsx`** - Main header (nivå 1)
- **`src/components/Layout/GlobalSubHeader.tsx`** - Sub-header (nivå 2)
- **`src/components/Layout/ClientSubHeader.tsx`** - Klient-spesifikk sub-header
- **`src/components/ui/button.tsx`** - Brand variant eksempel

### Context og utilities
- **`src/components/Layout/SubHeaderContext.tsx`** - Dynamisk sub-header management
- **`src/lib/utils.ts`** - cn() utility for class merging

## 🎯 Design Prinsipper

1. **Single Source of Truth**
   - Alle raw color values defineres i `src/index.css`
   - Aldri hardkod fargeverdier i komponenter
   - Bruk semantic tokens, ikke raw colors direkte

2. **Semantic Naming**
   - Bruk `--brand-*` tokens som beskriver formål (header, surface, text)
   - Ikke bruk `--revio-*` direkte i komponenter
   - Gjør det enkelt å forstå hva fargen brukes til

3. **Tailwind First**
   - Foretrekk Tailwind utility-klasser over inline styles
   - Bruk opacity modifiers (`bg-brand-header/95`) for transparens
   - Bruk hover/focus variants (`hover:bg-brand-surface-hover`)

4. **Dokumentasjon**
   - Alle nye tokens må dokumenteres med bruksområde
   - Legg til kommentarer i både CSS og Tailwind config
   - Oppdater denne README når du legger til nye konsepter

5. **Konsistens**
   - Følg eksisterende mønstre ved endringer
   - Bruk samme naming conventions
   - Test i både light og dark mode (hvis relevant)

## 🔍 Debugging Tips

### Verifiser at en Tailwind-klasse er generert
```bash
# Søk i built CSS (i DevTools eller dist/)
# Søk etter "bg-brand-header" i generated CSS
```

### Sjekk CSS custom property verdier
```javascript
// I browser console
getComputedStyle(document.documentElement).getPropertyValue('--brand-header')
// Skal returnere: " 173 57% 39%" (med spaces, uten hsl())
```

### Inspisér Tailwind config
```javascript
// I tailwind.config.ts er synlig i dev tools under Sources
// Verifiser at brand.header er definert
```

## 🤝 Bidra

Når du legger til nye farger eller tokens:

1. ✅ Følg 4-lags arkitekturen
2. ✅ Legg til kommentarer i både CSS og Tailwind config
3. ✅ Test at opacity modifiers fungerer
4. ✅ Oppdater relevant dokumentasjon
5. ✅ Test i både light og dark mode
6. ✅ Verifiser at eksisterende komponenter ikke påvirkes

## 📞 Support

**Spørsmål om design systemet?**
- Les [Tailwind Brand Integration](./tailwind-brand-integration.md) først
- Sjekk [Common Problems](#vanlige-problemer-og-løsninger) seksjonen ovenfor
- Se eksisterende komponenter for referanse

**Fant en bug i design systemet?**
- Dokumentér problemet i [Design Token Audit](./design-token-audit.md)
- Oppdater [Migration Complete Report](./migration-complete-report.md) med lessons learned

---

**Sist oppdatert:** 2025-01-15  
**Maintainer:** Revio Dev Team  
**Versjon:** 2.0 (Post-migration)
