# Page Migration Checklist

## Før du starter

- [ ] Les [Layout Architecture](./layout-architecture.md)
- [ ] Forstå beslutningstreet for layout-valg
- [ ] Identifiser sidetype (global/klient/standard)
- [ ] Noter eksisterende spacing og width

## Migrasjonssteg

### 1. Identifiser riktig layout-komponent

**Er det en klient-side?**
- [ ] Bruk `StickyClientLayout`

**Er det en standard side?**
- [ ] Bruk `PageLayout` ELLER
- [ ] Bruk `ResponsiveLayout` ELLER
- [ ] Bruk `ConstrainedWidth` + `StandardPageLayout`

### 2. Fjern hardkodet layout

**Fjern disse patterns:**
```tsx
// ❌ Fjern
<div className="space-y-6 p-6">
<div className="p-4">
<main className="container mx-auto p-4">
<div className="space-y-[var(--content-gap)] w-full">
```

### 3. Implementer ny layout

**For PageLayout:**
```tsx
import PageLayout from '@/components/Layout/PageLayout';

<PageLayout width="wide" spacing="normal">
  {children}
</PageLayout>
```

**For ResponsiveLayout:**
```tsx
import ResponsiveLayout from '@/components/Layout/ResponsiveLayout';

<ResponsiveLayout maxWidth="full">
  {children}
</ResponsiveLayout>
```

**For ConstrainedWidth + StandardPageLayout:**
```tsx
import ConstrainedWidth from '@/components/Layout/ConstrainedWidth';
import StandardPageLayout from '@/components/Layout/StandardPageLayout';

<ConstrainedWidth width="wide">
  <StandardPageLayout spacing="normal">
    {children}
  </StandardPageLayout>
</ConstrainedWidth>
```

### 4. Test etter migrering

- [ ] Desktop (1920px) - Sjekk spacing og width
- [ ] Tablet (768px) - Sjekk responsivitet
- [ ] Mobil (390px) - Sjekk at alt er synlig
- [ ] Scroll-oppførsel - Sjekk at scrolling fungerer
- [ ] SubHeader - Sjekk at sticky positioning virker
- [ ] Eksisterende funksjonalitet - Verifiser at alt fungerer

### 5. Sammenlign før/etter

**Før:**
```tsx
<div className="space-y-6 p-6">
  <div className="flex items-center justify-between">
    <h1>Min Side</h1>
  </div>
  <Card>Content</Card>
</div>
```

**Etter:**
```tsx
<PageLayout width="wide" spacing="normal">
  <PageHeader title="Min Side" />
  <Card>Content</Card>
</PageLayout>
```

## Vanlige fallgruver

### ❌ Fallgruve 1: Glemme å importere
```tsx
// FEIL - mangler import
<PageLayout width="wide">
```

**Løsning:**
```tsx
// RIKTIG
import PageLayout from '@/components/Layout/PageLayout';
```

### ❌ Fallgruve 2: Blande layout og content
```tsx
// FEIL - for mye nesting
<PageLayout>
  <div className="p-6">
    <div className="space-y-4">
      <Content />
    </div>
  </div>
</PageLayout>
```

**Løsning:**
```tsx
// RIKTIG - la layout håndtere spacing
<PageLayout spacing="normal">
  <Content />
</PageLayout>
```

### ❌ Fallgruve 3: Feil width-valg
```tsx
// FEIL - for bred for standard innhold
<PageLayout width="full">
```

**Løsning:**
```tsx
// RIKTIG - bruk 'wide' for standard sider
<PageLayout width="wide">
```

## Width Guidelines

| Width | Max Width | Bruksområde |
|-------|-----------|-------------|
| `narrow` | ~720px | Skjemaer, artikler, fokusert innhold |
| `medium` | ~960px | Standard innholdssider |
| `wide` | ~1280px | Tabeller, dashboards, oversikter |
| `full` | 100% | Visuelt intensive sider, grafer, kart |

## Spacing Guidelines

| Spacing | Gap | Bruksområde |
|---------|-----|-------------|
| `compact` | 16px | Tett innhold, lister, kompakte UI |
| `normal` | 24px | **Standard** - De fleste sider |
| `relaxed` | 32px | Store seksjoner, luftig layout |

## Checklist etter migrering

- [ ] Ingen hardkodede `p-4`, `p-6` i main content
- [ ] Ingen `container mx-auto` patterns
- [ ] Konsistent spacing mellom seksjoner
- [ ] Responsive design fungerer på alle størrelser
- [ ] SubHeader (hvis aktuelt) bruker `GlobalSubHeader`
- [ ] Width er satt til passende verdi
- [ ] Eksisterende funksjonalitet virker som før

## Ressurser

- [Layout Architecture](./layout-architecture.md)
- [Page Layout Guide](../page-layout.md)
- [UI Architecture](./ui-architecture.md)
