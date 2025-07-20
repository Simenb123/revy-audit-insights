
import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: {
      title: 'text-xl font-semibold',
      subtitle: 'text-sm text-muted-foreground',
      spacing: 'mb-4'
    },
    md: {
      title: 'text-2xl font-bold',
      subtitle: 'text-base text-muted-foreground',
      spacing: 'mb-6'
    },
    lg: {
      title: 'text-3xl font-bold',
      subtitle: 'text-lg text-muted-foreground',
      spacing: 'mb-8'
    }
  };

  const styles = sizeClasses[size];

  return (
    <header className={cn('flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4', styles.spacing, className)}>
      <div className="space-y-1 min-w-0 flex-1">
        <h1 className={cn(styles.title, 'leading-tight')}>
          {title}
        </h1>
        {subtitle && (
          <p className={cn(styles.subtitle, 'leading-relaxed')}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
};

export default PageHeader;
