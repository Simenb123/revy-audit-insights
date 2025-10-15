import React from 'react';
import { cn } from '@/lib/utils';

/**
 * ClientSubHeader - Nivå 2: Klient-spesifikk sub-header under GlobalHeader
 * 
 * Denne komponenten rendres UNDER GlobalHeader for klient-spesifikke sider.
 * Den viser klient-kontekst informasjon:
 * - Klientnavn og org.nummer (leftContent)
 * - Regnskapsårvelger (rightContent)
 * - Materialitetsoppsummering (rightContent)
 * 
 * Layout:
 * - Posisjon: sticky top-[var(--global-header-current-height)], z-40
 * - Høyde: var(--sub-header-height) (30px)
 * - Token: --brand-header (--revio-500) - mørkere teal, matcher sidebar
 * - Styling: bg-brand-header text-white
 * 
 * Bruksområde:
 * Typisk brukt via StickyClientLayout.tsx wrapper for klient-sider.
 * 
 * VIKTIG: Dette er sub-headeren, IKKE main headeren (GlobalHeader).
 * ClientSubHeader er en variant av GlobalSubHeader, spesialisert for klient-kontekst.
 * 
 * @see GlobalHeader.tsx - Main header (Nivå 1)
 * @see GlobalSubHeader.tsx - Standard sub-header variant
 * @see StickyClientLayout.tsx - Wrapper som bruker denne komponenten
 * @see docs/design/layout-architecture.md - Full arkitektur-dokumentasjon
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