# Page Layout Components

The layout components keep page spacing consistent while letting pages stretch across the viewport.

## ConstrainedWidth

`ConstrainedWidth` restricts the maximum width of its children. Use the `width` prop to choose `narrow`, `medium`, `wide` or `full`. When you want the content to span the viewport, pass `width="full"`.

## StandardPageLayout

`StandardPageLayout` arranges an optional header and footer with spaced sections. The `spacing` prop controls how much vertical gap appears between them.

## ResponsiveLayout

`ResponsiveLayout` ensures the main content adapts to the sidebars. It relies on `GlobalLayoutContainer` under the hood and now defaults to `maxWidth="full"` so pages are full width by default.

Typical pages nest these components:

```tsx
<ResponsiveLayout>
  <ConstrainedWidth width="full">
    <StandardPageLayout header={<PageHeader title="Title" />}>
      {content}
    </StandardPageLayout>
  </ConstrainedWidth>
</ResponsiveLayout>
```

New pages should follow this pattern so spacing and sidebar offsets remain uniform across the app while the layout spans the available viewport width by default.

## Subheader Styling Guidelines

**CRITICAL**: All subheaders must use consistent Revio-green styling for visual continuity.

### Required Styling
- **Background**: `bg-revio-500` (Revio green)
- **Text color**: `text-white` for primary content, `text-white/70` for secondary content
- **Height**: `h-[var(--sub-header-height)]` (40px)
- **Padding**: `px-6` (consistent with GlobalHeader)
- **Position**: `sticky top-[var(--global-header-current-height)] z-40`

### Components
- **GlobalSubHeader**: Primary subheader component - supports flexible content via props
- **ClientSubHeader**: Legacy component - maintained for compatibility but should use same styling
- **KnowledgeLayout**: Uses GlobalSubHeader with moduleIndicator

### Usage Examples

**Standard page subheader:**
```tsx
<GlobalSubHeader 
  title="Page Title"
  actions={<Button>Action</Button>}
  moduleIndicator={<div className="text-xs text-white/70 bg-white/10 px-2 py-1 rounded">Module</div>}
/>
```

**Client page subheader:**
```tsx
<GlobalSubHeader
  leftContent={<h1 className="text-lg font-semibold text-white">{clientName}</h1>}
  centerContent={<h2 className="text-sm text-white/80">{pageTitle}</h2>}
  rightContent={<FiscalYearSelector />}
  showBackButton={true}
/>
```

**DO NOT** use `text-foreground`, `text-muted-foreground`, `bg-background`, or `bg-muted` on subheader elements as these create poor contrast against the green background.

