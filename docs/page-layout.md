# Page Layout Components

This project uses a small set of layout wrappers to keep page spacing consistent.

## ConstrainedWidth

`ConstrainedWidth` restricts the maximum width of its children. Use the `width` prop to choose `narrow`, `medium`, `wide` or `full`.

## StandardPageLayout

`StandardPageLayout` arranges an optional header and footer with spaced sections. The `spacing` prop controls how much vertical gap appears between them.

## ResponsiveLayout

`ResponsiveLayout` ensures the main content adapts to the sidebars. It relies on `GlobalLayoutContainer` under the hood.

Typical pages nest these components:

```tsx
<ResponsiveLayout maxWidth="full">
  <ConstrainedWidth width="wide">
    <StandardPageLayout
      header={<PageHeader title="Title" />}
    >
      {content}
    </StandardPageLayout>
  </ConstrainedWidth>
</ResponsiveLayout>
```

New pages should follow this pattern so spacing and sidebar offsets remain uniform across the app.

