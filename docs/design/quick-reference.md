# Quick Reference - Revio UI

Hurtigreferanse for vanlige oppgaver i Revio.

## 🎯 Legge til en ny side

### Standard side (ingen subheader)
```tsx
// src/pages/MyPage.tsx
import PageHeader from '@/components/ui/PageHeader';

const MyPage = () => {
  return (
    <div className="container mx-auto p-6">
      <PageHeader title="Min Side" subtitle="Beskrivelse" />
      {/* content */}
    </div>
  );
};

export default MyPage;
```

### Side med custom subheader
```tsx
import { useEffect } from 'react';
import { useSubHeader } from '@/components/Layout/SubHeaderContext';
import GlobalSubHeader from '@/components/Layout/GlobalSubHeader';
import { Button } from '@/components/ui/button';

const MyPage = () => {
  const { setSubHeader, clearSubHeader } = useSubHeader();
  
  useEffect(() => {
    setSubHeader(
      <GlobalSubHeader
        title="Min Side"
        actions={<Button>Action</Button>}
        showBackButton
      />
    );
    return () => clearSubHeader();
  }, [setSubHeader, clearSubHeader]);
  
  return (
    <div className="p-6">
      {/* content */}
    </div>
  );
};

export default MyPage;
```

### Klient-side med StickyClientLayout
```tsx
import StickyClientLayout from '@/components/Layout/StickyClientLayout';

// StickyClientLayout bruker GlobalSubHeader "under panseret"
// med klient-spesifikt innhold (navn, org.nr, regnskapsår, materialitet)
const ClientPage = () => {
  const { clientId } = useParams();
  
  return (
    <StickyClientLayout
      clientName="Acme AS"
      orgNumber="123456789"
      pageTitle="Oversikt"
    >
      <div className="p-6">
        {/* content */}
      </div>
    </StickyClientLayout>
  );
};

export default ClientPage;
```

## 🎨 Bruke farger

### ✅ CORRECT - Bruk semantic tokens
```tsx
// ALLTID bruk semantic tokens, ALDRI raw colors
<div className="bg-brand-header text-white">
<Button variant="default" className="bg-brand-primary">
<div className="text-brand-text">
```

### ❌ WRONG - Ikke hardkod farger
```tsx
<div className="bg-[#2a7a7a] text-white">        // ❌
<div className="bg-teal-500 text-white">         // ❌
<div style={{ color: '#2a7a7a' }}>              // ❌
```

### Legge til ny farge
```css
/* 1. Definer i src/index.css */
:root {
  --my-color: 200 80% 50%;                    /* Raw HSL value */
  --brand-my-color: var(--my-color);          /* Semantic token */
}
```

```typescript
// 2. Eksponér til Tailwind i tailwind.config.ts
colors: {
  brand: {
    'my-color': 'hsl(var(--brand-my-color))',
  }
}
```

```tsx
// 3. Bruk i komponenter
<div className="bg-brand-my-color">
```

## 📐 Layout og Spacing

### Max Width Control
```tsx
// ResponsiveLayout wrapper
<ResponsiveLayout maxWidth="wide">        // 1280px
<ResponsiveLayout maxWidth="medium">      // 960px
<ResponsiveLayout maxWidth="narrow">      // 720px
<ResponsiveLayout maxWidth="full">        // 100%
```

### ConstrainedWidth for sections
```tsx
import ConstrainedWidth from '@/components/Layout/ConstrainedWidth';

<ConstrainedWidth width="wide" center>
  {/* content */}
</ConstrainedWidth>
```

### Standard Spacing
```tsx
// Page padding
<div className="p-6">                     // Standard page padding

// Section spacing
<div className="space-y-6">               // Vertical spacing between sections
<div className="space-y-4">               // Tighter spacing

// Container
<div className="container mx-auto">      // Center with max-width
```

### FlexibleGrid for responsive layouts
```tsx
import FlexibleGrid from '@/components/Layout/FlexibleGrid';

<FlexibleGrid 
  columns={{ sm: 1, md: 2, lg: 3 }}
  gap="md"
  equalHeight
>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</FlexibleGrid>
```

## 🔌 Bruke Contexts

### SubHeader
```tsx
import { useSubHeader } from '@/components/Layout/SubHeaderContext';

const { setSubHeader, clearSubHeader } = useSubHeader();

// Set subheader
setSubHeader(<GlobalSubHeader title="My Title" />);

// Clear in cleanup
useEffect(() => {
  return () => clearSubHeader();
}, []);
```

### Page Title
```tsx
import { usePageTitle } from '@/components/Layout/PageTitleContext';
// eller
import { setPageTitle } from '@/components/Layout/PageTitleContext';

// Med hook
const { setPageTitle } = usePageTitle();
setPageTitle('Dashboard');

// Med direkte funksjon
setPageTitle('Dashboard');
```

### Layout Heights
```tsx
import { useLayout } from '@/components/Layout/LayoutContext';

const { globalHeaderHeight, subHeaderHeight } = useLayout();
const totalHeaderHeight = globalHeaderHeight + subHeaderHeight;
```

### Sidebar State
```tsx
// Left sidebar
import { useSidebar } from '@/components/ui/sidebar/SidebarContext';
const { state, setState, toggleSidebar } = useSidebar();

// Right sidebar
import { useRightSidebar } from '@/components/Layout/RightSidebarContext';
const { isCollapsed, setIsCollapsed, width, setWidth } = useRightSidebar();
```

## 🧭 Navigasjon

### NavLink vs Link
```tsx
import { Link, NavLink } from 'react-router-dom';

// Standard link
<Link to="/clients">Klienter</Link>

// NavLink with active styling
<NavLink 
  to="/clients"
  className={({ isActive }) => 
    isActive ? 'bg-primary text-white' : 'hover:bg-muted'
  }
>
  Klienter
</NavLink>
```

### Programmatic Navigation
```tsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Navigate to route
navigate('/clients');

// Navigate with state
navigate('/clients/123', { state: { fromDashboard: true } });

// Go back
navigate(-1);
```

## 🎯 Navigere kodebasen

### Layout komponenter
```
src/components/Layout/
├── AppLayout.tsx              # Root layout with auth guard
├── GlobalHeader.tsx           # Top header (z-50)
├── GlobalSubHeader.tsx        # General subheader (z-40)
├── ClientSubHeader.tsx        # Client-specific subheader (z-40)
├── SubHeaderHost.tsx          # Renders subheader from context
├── GridLayoutContainer.tsx    # CSS Grid system
├── ResizableLeftSidebar.tsx   # Main navigation (z-30)
├── ResizableRightSidebar.tsx  # AI/Chat sidebar (z-10)
├── ResponsiveLayout.tsx       # Main content wrapper
├── GlobalLayoutContainer.tsx  # Content container with max-width
├── ConstrainedWidth.tsx       # Width constraint utility
├── PageLayout.tsx             # Page-level layout wrapper
└── StandardPageLayout.tsx     # Standard page structure
```

### Context providers
```
src/components/Layout/
├── SubHeaderContext.tsx       # Dynamic subheader management
├── LayoutContext.tsx          # Header height measurement
├── PageTitleContext.tsx       # Global page title
└── RightSidebarContext.tsx    # Right sidebar state

src/components/ui/sidebar/
└── SidebarContext.tsx         # Left sidebar state (shadcn)
```

### Styling
```
src/
├── index.css                  # Design tokens (single source of truth)
└── tailwind.config.ts         # Tailwind color mapping
```

### Dokumentasjon
```
docs/
├── design/
│   ├── README.md                          # Design system overview
│   ├── ui-architecture.md                 # Full UI structure (START HERE!)
│   ├── layout-architecture.md             # Header hierarchy details
│   ├── tailwind-brand-integration.md      # Color system deep dive
│   ├── quick-reference.md                 # This file
│   ├── design-token-audit.md              # Token migration status
│   └── component-variants.md              # Component variants
├── sidebar-overview.md                    # Right sidebar architecture
└── page-layout.md                         # Page layout components
```

## 🐛 Debugging

### Farger vises ikke riktig
1. ✅ Sjekk at token er definert i `src/index.css`
2. ✅ Sjekk at token er eksponert i `tailwind.config.ts`
3. ✅ Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
4. ✅ Sjekk at HSL-format er korrekt (ingen `hsl()` wrapper i CSS)
5. ✅ Se [Tailwind Brand Integration](./tailwind-brand-integration.md)

### Sticky positioning fungerer ikke
1. ✅ Sjekk z-index hierarki (header: 50, subheader: 40, sidebar: 30)
2. ✅ Sjekk at `top` verdi er riktig
3. ✅ Sjekk at parent har `overflow: visible`
4. ✅ Verifiser CSS variabel-verdier i DevTools

### SubHeader rendres ikke
1. ✅ Sjekk at `SubHeaderHost` er i `AppLayout.tsx`
2. ✅ Sjekk at du har `clearSubHeader()` i cleanup
3. ✅ Sjekk at `SubHeaderProvider` wrapper appen
4. ✅ Se console for feilmeldinger

### Grid layout ødelagt
1. ✅ Sjekk at CSS variables er satt
2. ✅ Verifiser viewport height beregning
3. ✅ Sjekk at `SidebarProvider` wrapper har `w-full`
4. ✅ Test med ulike sidebar states

### Sidebar kollapser ikke
1. ✅ Sjekk `SidebarProvider` setup
2. ✅ Verifiser at `SidebarTrigger` er tilstede
3. ✅ Test keyboard shortcut (Ctrl+Shift+B for left, Ctrl+Shift+R for right)
4. ✅ Sjekk localStorage for korrupt state

## ⌨️ Keyboard Shortcuts

### Sidebar
- `Ctrl+Shift+B` - Toggle left sidebar
- `Ctrl+Shift+R` - Toggle right sidebar

### Right Sidebar Tabs
- `Ctrl+Shift+A` - Open AI tab
- `Ctrl+Shift+C` - Open Chat tab
- `Ctrl+Shift+F` - Open Figures tab
- `Ctrl+Shift+D` - Open Documents tab

## 📦 Common Imports

```tsx
// Layout
import { useLayout } from '@/components/Layout/LayoutContext';
import { useSubHeader } from '@/components/Layout/SubHeaderContext';
import { usePageTitle, setPageTitle } from '@/components/Layout/PageTitleContext';
import { useRightSidebar } from '@/components/Layout/RightSidebarContext';
import { useSidebar } from '@/components/ui/sidebar/SidebarContext';

// Navigation
import { useNavigate, useParams, useLocation, Link, NavLink } from 'react-router-dom';

// Components
import GlobalSubHeader from '@/components/Layout/GlobalSubHeader';
import ConstrainedWidth from '@/components/Layout/ConstrainedWidth';
import FlexibleGrid from '@/components/Layout/FlexibleGrid';
import PageLayout from '@/components/Layout/PageLayout';

// UI
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Hooks
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserProfile } from '@/hooks/useUserProfile';
```

## 🎓 Tips for nye utviklere

1. **Start med dokumentasjon**: Les [UI Architecture](./ui-architecture.md) først
2. **Følg eksisterende mønstre**: Se på lignende sider/komponenter
3. **Bruk semantic tokens**: Aldri hardkod farger eller spacing
4. **Test responsivt**: Alltid test på mobile/tablet/desktop
5. **Bruk DevTools**: Inspiser CSS variables og computed styles
6. **Spør i #dev-team**: Ikke vær redd for å stille spørsmål!

---

**Last updated:** 2025-01-XX  
**Maintainer:** Revio Dev Team
