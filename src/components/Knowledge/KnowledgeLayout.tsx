
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import AppBreadcrumb from '@/components/Layout/AppBreadcrumb';

interface KnowledgeLayoutProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
}

const KnowledgeLayout = ({ children, title, actions, filters }: KnowledgeLayoutProps) => {
  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <AppBreadcrumb />
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Title */}
      {title && (
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
      )}

      {/* Horizontal Filter Bar */}
      {filters && (
        <Card className="mb-6">
          <CardContent className="p-4">
            {filters}
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
};

export default KnowledgeLayout;
