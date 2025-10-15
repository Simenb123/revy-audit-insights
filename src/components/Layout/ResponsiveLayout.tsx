/**
 * ResponsiveLayout - Wrapper for main content area with max-width control
 * 
 * @description
 * Semantic wrapper between GridLayoutContainer and page content.
 * Provides consistent max-width constraints and spacing.
 * 
 * @props
 * - maxWidth: 'narrow' (720px) | 'medium' (960px) | 'wide' (1280px) | 'full' (100%)
 * - className: additional Tailwind classes
 * - children: page content
 * 
 * @example
 * ```tsx
 * <ResponsiveLayout maxWidth="wide">
 *   <YourPageContent />
 * </ResponsiveLayout>
 * ```
 * 
 * @implementation
 * Simply wraps GlobalLayoutContainer with optional maxWidth prop.
 * 
 * @see {@link GlobalLayoutContainer} - Actual implementation
 * @see {@link https://docs/design/ui-architecture.md} - Layout structure
 */

import React from 'react';
import GlobalLayoutContainer from './GlobalLayoutContainer';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'narrow' | 'medium' | 'wide' | 'full';
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  className,
  maxWidth = 'full'
}) => {
  return (
    <GlobalLayoutContainer
      className={className}
      maxWidth={maxWidth}
    >
      {children}
    </GlobalLayoutContainer>
  );
};

export default ResponsiveLayout;
