
import React from 'react';
import EnhancedAdminDashboard from '@/components/AIRevyAdmin/EnhancedAdminDashboard';
import PageLayout from '@/components/Layout/PageLayout';

const AIRevyAdmin = () => {
  return (
    <PageLayout width="full">
      <EnhancedAdminDashboard />
    </PageLayout>
import ResponsiveLayout from '@/components/Layout/ResponsiveLayout';
import ConstrainedWidth from '@/components/Layout/ConstrainedWidth';
import StandardPageLayout from '@/components/Layout/StandardPageLayout';
import PageHeader from '@/components/Layout/PageHeader';

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
