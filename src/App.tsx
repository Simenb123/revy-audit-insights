
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/Auth/AuthProvider";
import { RevyContextProvider } from "@/components/RevyContext/RevyContextProvider";
import AppLayout from "@/components/Layout/AppLayout";
import Index from "@/pages/Index";
import NavigationDashboard from "@/pages/NavigationDashboard";
import ClientsOverview from "@/pages/ClientsOverview";
import ClientDetail from "@/pages/ClientDetail";
import ClientAdmin from "@/pages/ClientAdmin";
import DataImport from "@/pages/DataImport";
import AccountingData from "@/pages/AccountingData";
import LedgerPage from "@/pages/LedgerPage";
import Communication from "@/pages/Communication";
import TeamManagement from "@/pages/TeamManagement";
import KnowledgeBase from "@/pages/KnowledgeBase";
import AuditLogs from "@/pages/AuditLogs";
import UserAdmin from "@/pages/UserAdmin";
import UserProfile from "@/pages/UserProfile";
import OrganizationOverview from "@/pages/OrganizationOverview";
import OrganizationSettings from "@/pages/OrganizationSettings";
import OrganizationSetup from "@/pages/OrganizationSetup";
import DepartmentView from "@/pages/DepartmentView";
import Training from "@/pages/Training";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <RevyContextProvider>
            <Toaster />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/*" element={
                <AppLayout>
                  <Routes>
                    <Route index element={<Index />} />
                    <Route path="dashboard" element={<NavigationDashboard />} />
                    <Route path="klienter" element={<ClientsOverview />} />
                    <Route path="klienter/:id" element={<ClientDetail />} />
                    <Route path="client-admin" element={<ClientAdmin />} />
                    <Route path="data-import" element={<DataImport />} />
                    <Route path="accounting-data" element={<AccountingData />} />
                    <Route path="ledger/:clientId" element={<LedgerPage />} />
                    <Route path="communication" element={<Communication />} />
                    <Route path="teams" element={<TeamManagement />} />
                    <Route path="knowledge/*" element={<KnowledgeBase />} />
                    <Route path="audit-logs" element={<AuditLogs />} />
                    <Route path="user-admin" element={<UserAdmin />} />
                    <Route path="user-profile" element={<UserProfile />} />
                    <Route path="organization" element={<OrganizationOverview />} />
                    <Route path="organization/settings" element={<OrganizationSettings />} />
                    <Route path="organization/setup" element={<OrganizationSetup />} />
                    <Route path="departments/:departmentId" element={<DepartmentView />} />
                    <Route path="training" element={<Training />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
              } />
            </Routes>
          </RevyContextProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
