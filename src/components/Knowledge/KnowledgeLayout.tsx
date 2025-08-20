
import React from 'react';
import GlobalSubHeader from '@/components/Layout/GlobalSubHeader';
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
  const { setSubHeader, clearSubHeader } = useSubHeader();

  React.useEffect(() => {
    if (title) setPageTitle(title);
  }, [title, setPageTitle]);

  const moduleIndicator = (
    <div className="text-xs text-white/70 bg-white/10 px-2 py-1 rounded">
      Kunnskapsbase
    </div>
  );

  React.useEffect(() => {
    setSubHeader(
      <GlobalSubHeader
        title={title}
        actions={actions}
        filters={filters}
        moduleIndicator={moduleIndicator}
      />
    );
    return () => clearSubHeader();
  }, [title, actions, filters, moduleIndicator, setSubHeader, clearSubHeader]);

  return (
    <div className="flex-1 min-h-0 p-4 space-y-4">
      {children}
    </div>
  );
};

export default KnowledgeLayout;
