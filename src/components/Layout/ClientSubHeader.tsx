import React from 'react';
import { cn } from '@/lib/utils';

/**
 * ClientSubHeader - Standalone klient-spesifikk sub-header komponent
 * 
 * ⚠️ VIKTIG: Denne komponenten brukes IKKE av StickyClientLayout!
 * StickyClientLayout bruker GlobalSubHeader med custom leftContent/rightContent.
 * 
 * Bruk denne komponenten kun hvis du trenger:
 * - Custom layout som ikke passer GlobalSubHeader
 * - Spesifikk styling eller struktur som krever egen komponent
 * 
 * For nye klient-sider, bruk heller StickyClientLayout:
 * ```tsx
 * <StickyClientLayout clientName="..." orgNumber="...">
 *   <YourContent />
 * </StickyClientLayout>
 * ```
 * 
 * Layout specs:
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
 * @see GlobalHeader.tsx - Main header (Nivå 1)
 * @see GlobalSubHeader.tsx - Standard sub-header variant (FORETRUKKET for klient-sider)
 * @see StickyClientLayout.tsx - Wrapper som bruker GlobalSubHeader (IKKE denne komponenten)
 * @see docs/design/layout-architecture.md - Full arkitektur-dokumentasjon
 * @see docs/design/tailwind-brand-integration.md - Design token arkitektur
 * @see docs/design/README.md - Design system overview
 */
interface ClientSubHeaderProps {
  leftContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  className?: string;
}

const ClientSubHeader: React.FC<ClientSubHeaderProps> = ({
  leftContent,
  centerContent,
  rightContent,
  className
}) => {
  return (
    <div
      data-sub-header
      className={cn(
        'sticky top-[var(--global-header-current-height)] z-40 shadow-sm h-[var(--sub-header-height)] px-6 bg-brand-header text-white [&_*]:text-white [&_select]:z-50 [&_[role=tooltip]]:z-60',
        'flex items-center justify-between',
        className
      )}
    >
      <div className="flex items-center min-w-0">
        {leftContent}
      </div>
      
      <div className="flex items-center justify-center flex-1 min-w-0 mx-4">
        {centerContent}
      </div>
      
      <div className="flex items-center min-w-0">
        {rightContent}
      </div>
    </div>
  );
};

export default ClientSubHeader;