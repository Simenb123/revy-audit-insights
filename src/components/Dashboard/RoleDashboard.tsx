
import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import AdminDashboard from './AdminDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import PartnerDashboard from './PartnerDashboard';

const RoleDashboard = () => {
  const { data: userProfile, isLoading } = useUserProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Laster dashbord...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Kunne ikke laste brukerdata</p>
      </div>
    );
  }

  switch (userProfile.userRole) {
    case 'admin':
    case 'partner':
      return userProfile.userRole === 'admin' ? <AdminDashboard /> : <PartnerDashboard />;
    case 'manager':
    case 'senior':
    case 'employee':
    default:
      return <EmployeeDashboard />;
  }
};

export default RoleDashboard;
