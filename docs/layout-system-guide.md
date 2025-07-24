# Layout System Guide

Dette dokumentet beskriver hvordan layout-systemet fungerer i applikasjonen, spesielt forholdet mellom CSS Grid og sidebar-komponenter.

## Overordnet Arkitektur

### GridLayoutContainer
`GridLayoutContainer` er hovedkomponenten som styrer hele layouten ved hjelp av CSS Grid:

```css
grid-template-columns: [left-sidebar] [main-content] [right-sidebar]
```

**CSS Variabler:**
- `--grid-left-sidebar`: Bredde for ekspandert venstre sidebar
- `--grid-left-sidebar-collapsed`: Bredde for kollaps venstre sidebar (definert i index.css)

**Dynamisk Grid:**
- Venstre sidebar: Variabel bredde basert på collapsed state
- Main content: `1fr` (fyller tilgjengelig plass)
- Høyre sidebar: `48px` (collapsed) eller `{width}px` (expanded) eller `0px` (hidden)

### RightSidebarContext
Administrerer state for høyre sidebar:
- `isCollapsed`: Om sidebar er kollaps (48px bred)
- `isHidden`: Om sidebar er helt skjult (0px bred)
- `width`: Bredde når expanded (lagret i localStorage)

## Kritiske Design Prinsipper

### 1. CSS Grid Kontrollerer Bredde
GridLayoutContainer setter `grid-template-columns` som OVERRIDER andre width-innstillinger.
- ✅ La grid kontrollere bredden
- ❌ Ikke bruk `w-full`, `w-48` etc. på sidebar-komponenter som konflikter med grid

### 2. Unngå Sticky Positioning i Grid
Sticky positioning kan konflikte med CSS Grid og føre til at grid-constraints ignoreres.
- ✅ Bruk `min-h-[calc(100vh-var(--header-height))]` for høyde
- ❌ Ikke bruk `sticky top-[var(--header-height)]` i grid-children

### 3. Z-index Hierarki
- Header: z-50
- Modals/Drawers: z-50+
- Resize handles: z-20
- Sidebar content: Normal flow (ingen z-index)

## Responsive Oppførsel

### Desktop
- **Hidden**: Floating button (fixed positioning, utenfor grid)
- **Collapsed**: 48px bred grid column med expand-knapp
- **Expanded**: Full bredde (320-600px) med resizable handle

### Mobile
- Bruker Drawer-komponent i stedet for grid
- Floating trigger-knapp i nedre høyre hjørne
- Full-screen overlay når åpen

## Scroll Håndtering

### Med CSS Grid (nåværende løsning)
```css
min-h-[calc(100vh-var(--header-height))]
```
- Sidebar fyller minimum høyden
- Innhold scroller naturlig når det overskrider høyden
- Ingen konflikter med grid-systemet

### Tidligere Sticky Approach (problematisk)
```css
sticky top-[var(--header-height)]
height: calc(100vh - var(--header-height))
```
- Forårsaket konflikter med grid-bredde constraints
- Sidebar ignorerte 48px bredde i collapsed state

## Feilsøking

### Problem: Sidebar ignorerer bredde-constraints
**Årsak:** Sticky positioning eller width-klasser som konflikter med grid
**Løsning:** Fjern sticky og la grid kontrollere dimensjonene

### Problem: Scroll fungerer ikke
**Årsak:** Fixed height i kombinasjon med flex-layout
**Løsning:** Bruk `min-h-*` i stedet for `h-*` på container

### Problem: Layout hopper ved state-endringer
**Årsak:** Manglende transition på grid-template-columns
**Løsning:** `transition-[grid-template-columns] duration-300 ease-in-out`

## Best Practices

1. **Grid First**: La GridLayoutContainer kontrollere all hovedlayout
2. **State Management**: Bruk RightSidebarContext for konsistent state
3. **Progressive Enhancement**: Start med mobile-first, legg til desktop-features
4. **Performance**: Bruk CSS transitions for smooth overganger
5. **Accessibility**: Sørg for keyboard navigation og screen reader support

## Fremtidige Forbedringer

- [ ] Lagre collapsed state i localStorage
- [ ] Animasjoner for smooth expand/collapse
- [ ] Keyboard shortcuts for toggle
- [ ] Better responsive breakpoints
- [ ] Drag-to-resize på mobile (hvis ønsket)