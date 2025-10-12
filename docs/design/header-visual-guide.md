# Header Visual Guide

Dette dokumentet viser den visuelle strukturen til Revios header-system.

## Layout Oversikt

```
┌─────────────────────────────────────────────────────────────────┐
│ GLOBAL HEADER (Nivå 1)                          z-index: 50     │
│ Token: --brand-header (--revio-400 - lysere teal)               │
│ Height: 45px │ Sticky: top: 0                                   │
│                                                                  │
│ ┌──────┐ Revio  /  Side tittel    [Søk] [Klienter] [⚙] [👤]   │
│ │  R   │                                                         │
│ └──────┘                                                         │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ SUB HEADER (Nivå 2)                              z-index: 40    │
│ Token: --brand-header (--revio-400 - samme som global header)   │
│ Height: 30px │ Sticky: top: 45px                                │
│                                                                  │
│ Breadcrumb > Trail    │    Side Tittel       [Actions] [Filter]│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
┌────┬────────────────────────────────────────────────────────────┐
│    │                                                             │
│ S  │  MAIN CONTENT AREA                                         │
│ I  │                                                             │
│ D  │  Scrollbar innhold her                                     │
│ E  │                                                             │
│ B  │                                                             │
│ A  │                                                             │
│ R  │                                                             │
│    │                                                             │
│ z  │                                                             │
│ 30 │                                                             │
│    │                                                             │
└────┴────────────────────────────────────────────────────────────┘
```

## Sub Header Varianter

### GlobalSubHeader (Standard)
```
┌─────────────────────────────────────────────────────────────────┐
│ GlobalSubHeader (--brand-header)                                │
│                                                                  │
│ [← Tilbake] Breadcrumb > Trail │ Tittel    [Button] [Module]   │
│                                                                  │
│ ─────────────────────────────────────────────────────────────── │
│ Optional filters section                                        │
└─────────────────────────────────────────────────────────────────┘
```

**Bruksområder:**
- Standard for globale sider (Dashboard, Teams, etc.)
- Inneholder breadcrumbs og side-tittel
- Kan ha actions og filters

### ClientSubHeader (Klient-spesifikk)
```
┌─────────────────────────────────────────────────────────────────┐
│ ClientSubHeader (--brand-header)                                │
│                                                                  │
│ Acme AS [123456789]          [Regnskapsår ▼] [Materialitet]   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Bruksområder:**
- Brukes i klient-kontekst (via StickyClientLayout)
- Viser klientnavn, org.nummer
- Inneholder regnskapsårvelger og materialitetsoppsummering

## Fargehierarki

```
┌─────────────────────────────────────────────┐
│ Lysere Teal (--revio-400 / --brand-header)  │  ← Global Header
│ HSL: 174 57% 58%                            │  ← Sub Header
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Mørkere Teal (--revio-500 / --sidebar-bg)   │  ← Sidebar
│ HSL: 173 57% 39%                            │
└─────────────────────────────────────────────┘
```

**Design-rasjonale:**
- Headers bruker **lysere** teal for å skille seg fra hovedinnhold
- Sidebar bruker **mørkere** teal for tydelig visuell separasjon
- Begge header-nivåer har samme farge for konsistens

## Token Mapping

| Komponent        | Token                      | Revio Color | HSL           |
|------------------|----------------------------|-------------|---------------|
| GlobalHeader     | `--brand-header`           | `--revio-400` | 174 57% 58% |
| GlobalSubHeader  | `--brand-header`           | `--revio-400` | 174 57% 58% |
| ClientSubHeader  | `--brand-header`           | `--revio-400` | 174 57% 58% |
| Sidebar          | `--sidebar-background`     | `--revio-500` | 173 57% 39% |

## Z-Index Hierarchy

```
z-50: GlobalHeader     (alltid øverst)
z-40: SubHeader        (under global header)
z-30: Sidebar          (under headers)
```

Dette sikrer korrekt overlapping når elementer scroller.

## Responsive Behavior

### Desktop (> 1024px)
- Full bredde på headers
- Sidebar synlig til venstre
- Global søk synlig i header

### Tablet (768px - 1023px)
- Full bredde på headers
- Sidebar kan kollapses
- Global søk synlig

### Mobile (< 768px)
- Headers tar full bredde
- Sidebar skjules (hamburger-meny)
- Global søk kan skjules/kollapses
- Sub header kan wrapes eller forenkles

## Tilgjengelighet

### Semantisk HTML
```html
<header role="banner">        <!-- GlobalHeader -->
  <nav>...</nav>
</header>

<div data-sub-header>         <!-- SubHeader -->
  <nav aria-label="Breadcrumb">...</nav>
</div>

<aside role="navigation">     <!-- Sidebar -->
  ...
</aside>
```

### Fargekontrast
- Hvit tekst på `--brand-header` (WCAG AA compliant)
- Hvit tekst på `--sidebar-background` (WCAG AA compliant)

## CSS Classes Reference

### GlobalHeader
```css
.sticky .top-0 .z-50 
.bg-brand-header/95 .backdrop-blur
.h-14 (56px)
.border-b
```

### SubHeaders
```css
.sticky .top-[var(--global-header-current-height)] .z-40
.bg-brand-header .text-white
.h-[var(--sub-header-height)]
.shadow-sm
```

### Sidebar
```css
.bg-sidebar-background
.text-sidebar-foreground
/* width dynamisk basert på collapsed state */
```

## Eksempler med Skjermbilder

### Standard Dashboard View
```
Header: GlobalHeader (med logo, søk, bruker)
SubHeader: GlobalSubHeader (med breadcrumb, "Dashboard", actions)
Content: Dashboard widgets
```

### Klient Detail View
```
Header: GlobalHeader (standard)
SubHeader: ClientSubHeader (med klientnavn, org.nr, regnskapsår)
Content: Klient-spesifikt innhold
```

### Admin View
```
Header: GlobalHeader (standard)
SubHeader: GlobalSubHeader (med breadcrumb, admin-tittel, admin-actions)
Content: Admin-tabeller/forms
```

## Feilsøking

### Problem: Sub header overlapper content
**Løsning:** Sjekk at main content har padding/margin som tar hensyn til header-høydene:
```css
padding-top: calc(var(--global-header-height) + var(--sub-header-height));
```

### Problem: Feil farge på header
**Løsning:** Verifiser at riktig token brukes:
- Headers: `bg-brand-header` eller `hsl(var(--brand-header))`
- Sidebar: `bg-sidebar-background` eller `hsl(var(--sidebar-background))`

### Problem: Z-index konflikter
**Løsning:** Følg hierarkiet:
- Modals/Overlays: z-50+
- GlobalHeader: z-50
- SubHeader: z-40
- Sidebar: z-30
- Content: z-0 - z-10
