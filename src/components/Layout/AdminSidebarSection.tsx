
import React from 'react';
import AdminSidebarContent from '@/components/AIRevyAdmin/AdminSidebarContent';
import AiReviCard from './AiReviCard';

const AdminSidebarSection: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      <AiReviCard context="admin" className="flex-1" />
      <AdminSidebarContent />
    </div>
  );
};

export default AdminSidebarSection;
