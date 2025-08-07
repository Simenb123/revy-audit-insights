
import React from 'react';
import EnhancedAdminDashboard from '@/components/AIRevyAdmin/EnhancedAdminDashboard';
import PageHeader from '@/components/Layout/PageHeader';

const AIRevyAdmin = () => {
  return (
    <div className="space-y-[var(--content-gap)] w-full">
      <PageHeader title="AI Revy Admin" />
      <EnhancedAdminDashboard />
    </div>
  );
};

export default AIRevyAdmin;
