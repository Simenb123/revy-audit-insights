import React from 'react';
import ConstrainedWidth from './ConstrainedWidth';
import StandardPageLayout from './StandardPageLayout';

interface PageLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'narrow' | 'medium' | 'wide' | 'full';
  spacing?: 'compact' | 'normal' | 'relaxed';
  className?: string;
  contentClassName?: string;
  center?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  header,
  footer,
  width = 'wide',
  spacing = 'normal',
  className,
  contentClassName,
  center
}) => (
  <ConstrainedWidth width={width} center={center}>
    <StandardPageLayout
      header={header}
      footer={footer}
      spacing={spacing}
      className={className}
      contentClassName={contentClassName}
    >
      {children}
    </StandardPageLayout>
  </ConstrainedWidth>
);

export default PageLayout;
