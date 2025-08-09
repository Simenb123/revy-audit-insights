
import React from 'react';
import GlobalSubHeader from '@/components/Layout/GlobalSubHeader';
import { usePageTitle } from '@/components/Layout/PageTitleContext';

interface KnowledgeLayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
}

const KnowledgeLayout = ({ children, title, actions, filters }: KnowledgeLayoutProps) => {
  const { setPageTitle } = usePageTitle();

  React.useEffect(() => {
    if (title) setPageTitle(title);
  }, [title, setPageTitle]);

  const moduleIndicator = (
    <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
      Kunnskapsbase
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <GlobalSubHeader
        title={title}
        actions={actions}
        filters={filters}
        moduleIndicator={moduleIndicator}
      />
      
      <div className="flex-1 p-4 space-y-4">
        {children}
      </div>
    </div>
  );
};

export default KnowledgeLayout;
