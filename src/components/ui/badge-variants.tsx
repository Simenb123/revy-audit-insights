import { cva, type VariantProps } from "class-variance-authority";

/**
 * Extended badge variants with brand-specific styles
 * Use these for consistent brand-colored badges across the app
 */
export const extendedBadgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        brand:
          "border-transparent bg-brand-surface text-brand-text-muted hover:bg-brand-surface-hover",
        "brand-solid":
          "border-transparent bg-brand-primary text-white hover:bg-brand-primary-hover",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type ExtendedBadgeVariant = VariantProps<typeof extendedBadgeVariants>;
