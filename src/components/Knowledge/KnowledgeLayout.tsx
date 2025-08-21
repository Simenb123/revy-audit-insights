
import React from 'react';
import { usePageTitle } from '@/components/Layout/PageTitleContext';
import { useSubHeader } from '@/components/Layout/SubHeaderContext';

interface KnowledgeLayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
}

const KnowledgeLayout = ({ children, title, actions, filters }: KnowledgeLayoutProps) => {
  const { setPageTitle } = usePageTitle();
  const { clearSubHeader } = useSubHeader();

  React.useEffect(() => {
    if (title) setPageTitle(title);
  }, [title, setPageTitle]);

  // Clear any existing subheader since we're not using sticky subheader
  React.useEffect(() => {
    clearSubHeader();
  }, [clearSubHeader]);

  return (
    <div className="space-y-[var(--content-gap)] w-full">
      {/* Header section - non-sticky */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              Kunnskapsbase
            </div>
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Filters section */}
      {filters && (
        <div className="w-full">
          {filters}
        </div>
      )}

      {/* Content */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
};

export default KnowledgeLayout;
