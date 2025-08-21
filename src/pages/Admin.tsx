import React from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { Routes, Route } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from 'lucide-react';
import AdminSidebar from '@/components/Admin/AdminSidebar';
import AdminOverview from '@/components/Admin/AdminOverview';
import UserManagement from '@/components/Admin/UserManagement';
import FirmAccessRequests from '@/components/Admin/FirmAccessRequests';
import RolePermissions from '@/components/Admin/RolePermissions';
import AuditActivity from '@/components/Admin/AuditActivity';
import SystemSettings from '@/components/Admin/SystemSettings';
import TrainingAdmin from '@/components/Revisorskolen/TrainingAdmin';

const AdminPage = () => {
  const { data: userProfile, isLoading } = useUserProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-center">
          <div className="h-8 w-32 bg-muted rounded mx-auto mb-2"></div>
          <div className="h-4 w-24 bg-muted rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  const canAccess = userProfile?.userRole === 'admin' || userProfile?.userRole === 'partner';

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Ingen tilgang
            </CardTitle>
            <CardDescription>
              Du har ikke tilgang til administrasjonsområdet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Kun administratorer og partnere kan administrere brukere og organisasjonsinnstillinger.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <main className="flex-1 bg-background">
          <Routes>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="access-requests" element={<FirmAccessRequests />} />
            <Route path="roles" element={<RolePermissions />} />
            <Route path="audit" element={<AuditActivity />} />
            <Route path="training" element={<TrainingAdmin />} />
            <Route path="settings" element={<SystemSettings />} />
          </Routes>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminPage;