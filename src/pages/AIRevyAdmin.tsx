
import React from 'react';
import EnhancedAdminDashboard from '@/components/AIRevyAdmin/EnhancedAdminDashboard';
import StandardPageLayout from '@/components/Layout/StandardPageLayout';
import PageHeader from '@/components/Layout/PageHeader';

const AIRevyAdmin = () => {
  return (
    <StandardPageLayout
      className="w-full"
      header={<PageHeader title="AI Revy Admin" />}
    >
      <EnhancedAdminDashboard />
    </StandardPageLayout>
  );
};

export default AIRevyAdmin;
