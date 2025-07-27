
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
