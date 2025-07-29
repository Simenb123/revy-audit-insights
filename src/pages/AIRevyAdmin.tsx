
import React from 'react';
import EnhancedAdminDashboard from '@/components/AIRevyAdmin/EnhancedAdminDashboard';
import ResponsiveLayout from '@/components/Layout/ResponsiveLayout';
import ConstrainedWidth from '@/components/Layout/ConstrainedWidth';
import StandardPageLayout from '@/components/Layout/StandardPageLayout';

const AIRevyAdmin = () => {
  return (
    <ResponsiveLayout>
      <ConstrainedWidth width="full">
        <StandardPageLayout header={<PageHeader title="AI Revy Admin" />}>
          <EnhancedAdminDashboard />
        </StandardPageLayout>
      </ConstrainedWidth>
    </ResponsiveLayout>
  );
};

export default AIRevyAdmin;
