
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AppBreadcrumb from './AppBreadcrumb';

/**
 * GlobalSubHeader - Nivå 2: Context-spesifikk sub-header under GlobalHeader
 * 
 * Denne komponenten rendres UNDER GlobalHeader og viser side-spesifikt innhold:
 * - Breadcrumbs for navigasjon
 * - Side-tittel
 * - Actions (buttons, etc.)
 * - Filters (optional, rendres under main sub-header line)
 * - Module indicators
 * 
 * Layout:
 * - Posisjon: sticky top-[var(--global-header-current-height)], z-40
 * - Høyde: var(--sub-header-height) (30px)
 * - Token: --brand-header (--revio-500) - mørkere teal, matcher sidebar
 * - Styling: bg-brand-header text-white
 * 
 * Design Token Architecture:
 * Komponenten bruker bg-brand-header Tailwind utility class.
 * Dette krever at --brand-header er eksponert til Tailwind i tailwind.config.ts:
 * 
 *   CSS (src/index.css):
 *     --brand-header: var(--revio-500);  // Semantic token
 *     --revio-500: 173 57% 39%;          // Raw HSL value
 * 
 *   Tailwind (tailwind.config.ts):
 *     brand: { header: 'hsl(var(--brand-header))' }  // ← KRITISK!
 * 
 *   Component:
 *     className="bg-brand-header"  // Tailwind genererer denne klassen
 * 
 * VIKTIG: Uten Tailwind-mapping vil bg-brand-header ikke fungere!
 * Se: docs/design/tailwind-brand-integration.md for full forklaring
 * 
 * Fleksibelt content-system:
 * Komponenten støtter enten standard layout (breadcrumb + title + actions)
 * eller custom layout via leftContent, centerContent, rightContent props.
 * 
 * VIKTIG: Dette er sub-headeren, IKKE main headeren (GlobalHeader).
 * Sub-headeren vises alltid under GlobalHeader.
 * 
 * @see GlobalHeader.tsx - Main header (Nivå 1)
 * @see ClientSubHeader.tsx - Alternativ sub-header for klient-sider
 * @see SubHeaderContext.tsx - Context for dynamisk sub-header håndtering
 * @see docs/design/layout-architecture.md - Full arkitektur-dokumentasjon
 * @see docs/design/tailwind-brand-integration.md - Design token arkitektur
 * @see docs/design/README.md - Design system overview
 */
interface GlobalSubHeaderProps {
  title?: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  moduleIndicator?: React.ReactNode;
  className?: string;
  leftContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  showBackButton?: boolean;
  backButtonText?: string;
  backButtonUrl?: string;
}

const GlobalSubHeader: React.FC<GlobalSubHeaderProps> = ({
  title,
  actions,
  filters,
  moduleIndicator,
  className,
  leftContent,
  centerContent,
  rightContent,
  showBackButton = false,
  backButtonText = "Tilbake til klientliste",
  backButtonUrl = "/clients"
}) => {
    return (
      <div
        data-sub-header
        className={cn(
          'sticky top-[var(--global-header-current-height)] z-40 h-[var(--sub-header-height)]',
          className
        )}
      >
      {/* Main subheader line */}
      <div className="flex items-center justify-between px-6 h-[var(--sub-header-height)] bg-brand-header text-white [&_*]:text-white [&_select]:z-50 [&_[role=tooltip]]:z-60">
        {/* Use flexible content if provided, otherwise fall back to default layout */}
        {leftContent || centerContent || rightContent ? (
          <>
            <div className="flex items-center min-w-0 flex-1">
              {showBackButton && (
                <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10 mr-4">
                  <Link to={backButtonUrl} className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    {backButtonText}
                  </Link>
                </Button>
              )}
              {leftContent}
            </div>
            
            <div className="flex items-center justify-center flex-1 min-w-0 mx-4">
              {centerContent}
            </div>
            
            <div className="flex items-center min-w-0 justify-end">
              {rightContent}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-4 min-w-0 flex-1">
              {showBackButton && (
                <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <Link to={backButtonUrl} className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    {backButtonText}
                  </Link>
                </Button>
              )}
              <AppBreadcrumb />
              {title && (
                <>
                  <div className="h-4 w-px bg-white/30" />
                  <h1 className="text-lg font-semibold text-white">{title}</h1>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {actions}
              {moduleIndicator && (
                <>
                  <div className="h-4 w-px bg-white/30" />
                  {moduleIndicator}
                </>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Filters section if provided */}
      {filters && (
        <div className="px-6 pb-3">
          {filters}
        </div>
      )}
    </div>
  );
};

export default GlobalSubHeader;
