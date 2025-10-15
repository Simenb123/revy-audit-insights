# Tailwind Brand Token Integration

**Dato:** 2025-01-XX  
**Status:** ✅ Implementert  
**Relatert issue:** Header-farge viste "blek" farge til tross for korrekte CSS tokens

---

## Problem vi løste

### Symptomer
- Header-komponenter (`GlobalHeader`, `ClientSubHeader`, `GlobalSubHeader`) viste lys/blek farge
- CSS custom property `--brand-header` var korrekt definert som `var(--revio-500)` (mørkere teal)
- Attribute selector `[data-sub-header]` brukte korrekt token
- Men fargen ble ikke applisert i DOM

### Root cause
**CSS custom properties ≠ Tailwind utility klasser**

Vi hadde definert semantic tokens i `src/index.css`:
```css
:root {
  --brand-header: var(--revio-500);  /* HSL: 173 57% 39% - mørkere teal */
}
```

MEN vi hadde IKKE eksponert disse til Tailwind's color system i `tailwind.config.ts`. Dette gjorde at:

1. ❌ Tailwind kunne ikke generere `bg-brand-header` utility-klasser
2. ❌ Komponenter som brukte `className="bg-brand-header"` fikk ingen styling
3. ❌ CSS attribute selector `[data-sub-header]` hadde lavere spesifisitet enn andre styles
4. ❌ Resultatet: Headers fikk feil/ingen bakgrunnsfarge

---

## Løsning

### 1. Legg til `brand` farger i Tailwind config

**Fil:** `tailwind.config.ts`

```typescript
export default {
  theme: {
    extend: {
      colors: {
        // Eksisterende farger...
        revio: { /* ... */ },
        
        // NY: Brand semantic tokens
        brand: {
          DEFAULT: 'hsl(var(--brand-primary))',
          primary: 'hsl(var(--brand-primary))',
          'primary-hover': 'hsl(var(--brand-primary-hover))',
          'primary-active': 'hsl(var(--brand-primary-active))',
          header: 'hsl(var(--brand-header))',           // ← Kritisk!
          surface: 'hsl(var(--brand-surface))',
          'surface-hover': 'hsl(var(--brand-surface-hover))',
          text: 'hsl(var(--brand-text))',
          'text-muted': 'hsl(var(--brand-text-muted))',
          border: 'hsl(var(--brand-border))',
        }
      }
    }
  }
}
```

Dette gjør at Tailwind kan generere utility-klasser:
- `bg-brand-header`
- `text-brand-header`
- `border-brand-header`
- `bg-brand-header/95` (med opacity)
- `hover:bg-brand-primary-hover`
- osv.

### 2. Oppdater CSS attribute selector

**Fil:** `src/index.css`

```css
/* Før (for generell): */
[data-sub-header] {
  background: hsl(var(--brand-header));
}

/* Etter (spesifikk fallback): */
[data-sub-header]:not([class*="bg-"]) {
  background: hsl(var(--brand-header));
}
```

**Hvorfor?**
- Tailwind utility-klasser har høyere CSS spesifisitet enn attribute selectors
- Ved å legge til `:not([class*="bg-"])` unngår vi konflikter
- Denne regelen fungerer nå som en fallback kun hvis komponenten mangler bg-klasse

### 3. Komponenter fungerer nå ✅

```tsx
// GlobalHeader.tsx
<header className="bg-brand-header/95 backdrop-blur">
  {/* Tailwind genererer nå denne klassen! */}
</header>

// ClientSubHeader.tsx
<div className="bg-brand-header text-white">
  {/* Tailwind genererer nå denne klassen! */}
</div>
```

---

## Arkitektur: CSS Custom Properties vs Tailwind Colors

### To separate systemer som må synkroniseres

```
┌─────────────────────────────────────────────────────────────┐
│                    CSS Custom Properties                     │
│                     (src/index.css)                          │
├─────────────────────────────────────────────────────────────┤
│  :root {                                                     │
│    --revio-500: 173 57% 39%;        ← Raw HSL values       │
│    --brand-header: var(--revio-500); ← Semantic token      │
│  }                                                           │
│                                                              │
│  • Kan brukes i vanilla CSS: background: hsl(var(...))     │
│  • Kan brukes i inline styles: style={{ color: 'hsl(...)' }}│
│  • KAN IKKE brukes i Tailwind utility-klasser              │
└─────────────────────────────────────────────────────────────┘
                              ↓ Må eksponeres
┌─────────────────────────────────────────────────────────────┐
│                    Tailwind Color System                     │
│                  (tailwind.config.ts)                        │
├─────────────────────────────────────────────────────────────┤
│  export default {                                            │
│    theme: {                                                  │
│      extend: {                                               │
│        colors: {                                             │
│          brand: {                                            │
│            header: 'hsl(var(--brand-header))' ← Refererer   │
│          }                                                   │
│        }                                                     │
│      }                                                       │
│    }                                                         │
│  }                                                           │
│                                                              │
│  • Genererer utility-klasser: .bg-brand-header              │
│  • Støtter opacity: .bg-brand-header/95                     │
│  • Støtter variants: .hover:bg-brand-header                 │
└─────────────────────────────────────────────────────────────┘
```

### Kritisk innsikt

**CSS custom properties alene er ikke nok!**

Selv om du definerer:
```css
:root {
  --brand-header: 173 57% 39%;
}
```

Kan du IKKE bruke `className="bg-brand-header"` med mindre du også legger det til i `tailwind.config.ts`.

---

## Best Practices

### 1. Definer semantic tokens i CSS først

**Fil:** `src/index.css`

```css
:root {
  /* Raw color values */
  --revio-500: 173 57% 39%;
  
  /* Semantic tokens */
  --brand-header: var(--revio-500);
  --brand-primary: var(--revio-500);
}
```

**Hvorfor?**
- Single source of truth for fargeverdier
- Enklere å oppdatere farger globalt
- Støtte for CSS custom property fallbacks

### 2. Eksponér tokens til Tailwind

**Fil:** `tailwind.config.ts`

```typescript
colors: {
  brand: {
    header: 'hsl(var(--brand-header))',
    primary: 'hsl(var(--brand-primary))',
  }
}
```

**Hvorfor?**
- Tailwind kan generere utility-klasser
- Støtte for opacity modifiers
- Type-safe i TypeScript (med riktig setup)

### 3. Bruk Tailwind utility-klasser i komponenter

```tsx
<div className="bg-brand-header text-white">
  {/* Preferred */}
</div>

<!-- Unngå: -->
<div style={{ background: 'hsl(var(--brand-header))' }}>
  {/* Mindre maintainable */}
</div>
```

### 4. Dokumenter semantic tokens tydelig

Hver semantic token bør ha:
- **Navn:** `--brand-header`
- **Verdi:** `var(--revio-500)` (referanse til raw value)
- **Bruksområde:** "Brukes til alle header-nivåer"
- **Tailwind mapping:** `brand.header`

---

## Feilsøkingsguide

### Problem: Tailwind-klasse fungerer ikke

**Symptom:**
```tsx
<div className="bg-brand-header">
  {/* Ingen bakgrunnsfarge! */}
</div>
```

**Sjekkliste:**
1. ✅ Er `brand.header` definert i `tailwind.config.ts`?
2. ✅ Refererer den til en eksisterende CSS custom property?
3. ✅ Er CSS custom property definert i `:root` i `src/index.css`?
4. ✅ Bruker du `hsl()` wrapper i Tailwind config?
5. ✅ Har du rebuildet applikasjonen? (Vite/Tailwind må regenere CSS)

**Fix:**
```typescript
// tailwind.config.ts
colors: {
  brand: {
    header: 'hsl(var(--brand-header))', // ← Legg til
  }
}
```

### Problem: Feil farge vises

**Symptom:**
Header viser lysere/mørkere farge enn forventet.

**Sjekkliste:**
1. ✅ Inspiser element i DevTools
2. ✅ Se hvilken CSS regel som faktisk appliseres
3. ✅ Sjekk computed value av `--brand-header` i :root
4. ✅ Verifiser at `--revio-500` har korrekt HSL-verdi

**Fix:**
```css
/* src/index.css */
:root {
  --revio-500: 173 57% 39%; /* ← Verifiser HSL-verdier */
  --brand-header: var(--revio-500); /* ← Sjekk mapping */
}
```

### Problem: Opacity modifier fungerer ikke

**Symptom:**
```tsx
<div className="bg-brand-header/95">
  {/* Opacity appliseres ikke! */}
</div>
```

**Root cause:**
CSS custom property må være i HSL-format UTEN `hsl()` wrapper.

**Fix:**
```css
/* ✅ Korrekt: */
:root {
  --brand-header: 173 57% 39%; /* Bare tallene */
}

/* ❌ Feil: */
:root {
  --brand-header: hsl(173, 57%, 39%); /* Tailwind kan ikke parse dette */
}
```

```typescript
// Tailwind config legger til hsl() wrapper
colors: {
  brand: {
    header: 'hsl(var(--brand-header))', // ← Viktig!
  }
}
```

---

## Når skal du legge til nye tokens?

### Scenario 1: Ny semantic token (anbefalt)

Du vil legge til `--brand-sidebar` som en semantic token.

**Steg:**
1. Definer i CSS:
   ```css
   :root {
     --brand-sidebar: var(--revio-500);
   }
   ```

2. Eksponér til Tailwind:
   ```typescript
   brand: {
     sidebar: 'hsl(var(--brand-sidebar))',
   }
   ```

3. Bruk i komponenter:
   ```tsx
   <div className="bg-brand-sidebar">
   ```

### Scenario 2: Ny raw color scale

Du vil legge til en helt ny fargeskala (f.eks. `--accent-*`).

**Steg:**
1. Definer raw values i CSS:
   ```css
   :root {
     --accent-50: 200 80% 95%;
     --accent-100: 200 80% 90%;
     /* ... */
     --accent-500: 200 80% 50%;
   }
   ```

2. Lag semantic tokens:
   ```css
   --brand-accent: var(--accent-500);
   ```

3. Eksponér begge til Tailwind:
   ```typescript
   colors: {
     accent: {
       50: 'hsl(var(--accent-50))',
       100: 'hsl(var(--accent-100))',
       500: 'hsl(var(--accent-500))',
     },
     brand: {
       accent: 'hsl(var(--brand-accent))',
     }
   }
   ```

---

## Relatert dokumentasjon

- **Design Token Audit:** `docs/design/design-token-audit.md`
- **Migration Guide:** `docs/design/migration-guide.md`
- **Layout Architecture:** `docs/design/layout-architecture.md`
- **Migration Complete Report:** `docs/design/migration-complete-report.md`

---

## Takeaways

1. **CSS custom properties og Tailwind colors er to separate systemer**
2. **Begge må synkroniseres for at utility-klasser skal fungere**
3. **Tailwind-klasser har høyere CSS spesifisitet enn attribute selectors**
4. **Alltid definer semantic tokens i CSS først, deretter eksponér til Tailwind**
5. **Dokumentér mappingen mellom CSS tokens og Tailwind colors**

Dette sikrer:
- ✅ Konsistent fargebruk på tvers av applikasjonen
- ✅ Type-safe color references (med Tailwind IntelliSense)
- ✅ Enkelt å oppdatere farger globalt
- ✅ Ingen CSS specificity-problemer
- ✅ Full støtte for Tailwind's utility-system (opacity, hover, etc.)
