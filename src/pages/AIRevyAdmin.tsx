
import React, { useEffect } from 'react';
import EnhancedAdminDashboard from '@/components/AIRevyAdmin/EnhancedAdminDashboard';
import StandardPageLayout from '@/components/Layout/StandardPageLayout';
import { usePageTitle } from '@/components/Layout/PageTitleContext';

const AIRevyAdmin = () => {
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle('AI Revy Admin');
  }, [setPageTitle]);

  return (
    <StandardPageLayout className="w-full">
      <EnhancedAdminDashboard />
    </StandardPageLayout>
  );
};

export default AIRevyAdmin;
