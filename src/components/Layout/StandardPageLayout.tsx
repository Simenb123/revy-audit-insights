
import React from 'react';
import { cn } from '@/lib/utils';

interface StandardPageLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  spacing?: 'compact' | 'normal' | 'relaxed';
}

const StandardPageLayout: React.FC<StandardPageLayoutProps> = ({
  children,
  header,
  footer,
  className,
  contentClassName,
  spacing = 'normal'
}) => {
  const spacingClasses = {
    compact: 'space-y-[var(--space-4)]',
    normal: 'space-y-[var(--content-gap)]',
    relaxed: 'space-y-[var(--section-gap)]'
  };

  return (
    <div className={cn('w-full', spacingClasses[spacing], className)}>
      {header && (
        <header className="w-full">
          {header}
        </header>
      )}
      
      <div className={cn('w-full', contentClassName)}>
        {children}
      </div>
      
      {footer && (
        <footer className="w-full">
          {footer}
        </footer>
      )}
    </div>
  );
};

export default StandardPageLayout;
