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

