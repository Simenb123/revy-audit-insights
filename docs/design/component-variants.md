# Component Variants Guide

Dette dokumentet viser hvordan du bruker semantic design tokens i komponenter.

## 🎨 Button Variants

### Brand Variant
Bruker Revio brand colors for primære handlinger.

```tsx
import { Button } from "@/components/ui/button";

// Primary brand button
<Button variant="brand">
  Primær handling
</Button>

// Standard primary (uses theme primary color)
<Button variant="default">
  Standard
</Button>
```

**Når bruke brand variant:**
- Klient-spesifikke handlinger
- Primære CTA i Revio-kontekst
- Header/SubHeader actions

**Når bruke default variant:**
- Generiske handlinger
- Kontekst-uavhengige buttons
- Theme-baserte komponenter

## 🏷️ Badge Variants

### Brand Badges
Bruker Revio brand colors for konsistent merking.

```tsx
import { Badge } from "@/components/ui/badge";

// Light brand badge (revio-100 background)
<Badge className="bg-revio-100 text-revio-800 border-revio-200">
  Status
</Badge>

// Solid brand badge (revio-500 background)
<Badge className="bg-revio-500 text-white hover:bg-revio-600">
  Viktig
</Badge>

// Semantic utility classes
<Badge className="bg-brand-surface text-brand-text border-brand-border">
  Semantisk
</Badge>
```

**Extended badge variants** (fra `badge-variants.tsx`):
```tsx
import { extendedBadgeVariants } from "@/components/ui/badge-variants";
import { cn } from "@/lib/utils";

<span className={cn(extendedBadgeVariants({ variant: "brand" }))}>
  Brand Badge
</span>

<span className={cn(extendedBadgeVariants({ variant: "brand-solid" }))}>
  Solid Brand
</span>
```

## 🎴 Card Variants

### Brand Surface
Bruker Revio-farger for å highlighte kort.

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Light brand surface
<Card className="bg-revio-50 border-revio-200">
  <CardHeader>
    <CardTitle className="text-revio-900">Tittel</CardTitle>
  </CardHeader>
  <CardContent className="text-revio-800">
    Innhold
  </CardContent>
</Card>

// Semantic tokens
<Card className="bg-brand-surface border-brand-border">
  <CardTitle className="text-brand-text">Tittel</CardTitle>
</Card>
```

## 🎯 Best Practices

### ✅ Anbefalt

```tsx
// 1. Bruk variant props når tilgjengelig
<Button variant="brand">Action</Button>

// 2. Bruk semantic utilities for custom styling
<div className="bg-brand-surface text-brand-text">
  Content
</div>

// 3. Bruk HSL-scale for gradient effects
<div className="bg-revio-100 hover:bg-revio-200">
  Hover effect
</div>
```

### ❌ Unngå

```tsx
// Hardkoded HEX-verdier
<div className="bg-[#2A9D8F]">Bad</div>

// Direkte Tailwind colors uten semantic meaning
<div className="bg-teal-500">Avoid</div>

// Inkonsistent bruk av brand colors
<Button className="bg-green-500">Wrong brand</Button>
```

## 📚 Relaterte filer

- `src/components/ui/button.tsx` - Button component med brand variant
- `src/components/ui/badge-variants.tsx` - Extended badge variants
- `src/index.css` - Semantic utility classes
- `tailwind.config.ts` - Revio color scale (HSL)
- `docs/color-palette.md` - Full color documentation
