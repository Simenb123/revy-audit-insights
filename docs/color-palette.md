# Color Palette

The Revio brand colors are defined in HSL format in `src/index.css` and referenced in `tailwind.config.ts`.

## Revio Brand Colors

All colors are defined in HSL for consistency and theme support.

| Token       | Hex       | HSL               | Tailwind Class    | Usage               |
|-------------|-----------|-------------------|-------------------|---------------------|
| revio-50    | #E6F3F1   | 174 57% 93%       | `bg-revio-50`     | Light backgrounds   |
| revio-100   | #C2E1DE   | 174 57% 88%       | `bg-revio-100`    | Surface, badges     |
| revio-200   | #9ACECC   | 174 57% 78%       | `bg-revio-200`    | Hover states        |
| revio-300   | #72BDB9   | 174 57% 68%       | `bg-revio-300`    | Borders             |
| revio-400   | #55B0AB   | 174 57% 58%       | `bg-revio-400`    | Disabled states     |
| revio-500   | #2A9D8F   | 173 57% 39%       | `bg-revio-500`    | **Primary brand**   |
| revio-600   | #249082   | 173 49% 35%       | `bg-revio-600`    | Hover primary       |
| revio-700   | #1F7F71   | 173 49% 30%       | `bg-revio-700`    | Active primary      |
| revio-800   | #196F62   | 173 49% 26%       | `bg-revio-800`    | Dark text           |
| revio-900   | #105045   | 173 49% 15%       | `bg-revio-900`    | Darkest text        |

## Semantic Brand Tokens (Recommended)

Use semantic tokens for better maintainability:

| Token                  | CSS Variable               | Usage                          |
|------------------------|----------------------------|--------------------------------|
| Brand Primary          | `--brand-primary`          | Main brand color (revio-500)   |
| Brand Primary Hover    | `--brand-primary-hover`    | Hover states (revio-600)       |
| Brand Primary Active   | `--brand-primary-active`   | Active states (revio-700)      |
| Brand Surface          | `--brand-surface`          | Light backgrounds (revio-100)  |
| Brand Surface Hover    | `--brand-surface-hover`    | Surface hover (revio-200)      |
| Brand Text             | `--brand-text`             | Dark text (revio-900)          |
| Brand Text Muted       | `--brand-text-muted`       | Muted text (revio-800)         |
| Brand Border           | `--brand-border`           | Borders (revio-300)            |

## Usage Examples

### Using Tailwind Classes (Direct)
```tsx
<div className="bg-revio-500 text-white">
  Primary brand background
</div>
```

### Using Semantic Tokens (Recommended for new code)
```tsx
<div className="bg-[hsl(var(--brand-primary))] text-white">
  Primary brand background (semantic)
</div>
```

## Design System Notes

- **All colors are HSL** for consistency with shadcn/ui and theme support
- **Headers** use `bg-revio-500` with white text for optimal contrast
- **Semantic tokens** are preferred for new components
- See `docs/design/design-token-audit.md` for migration guide
