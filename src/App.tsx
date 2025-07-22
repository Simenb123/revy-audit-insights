
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/Auth/AuthProvider";
import { RevyContextProvider } from "@/components/RevyContext/RevyContextProvider";
import { AIGlobalProvider } from "@/components/AI/AIGlobalProvider";
import { DataCacheProvider } from "@/components/Optimization/DataCache";
import AppLayout from "@/components/Layout/AppLayout";
import { RightSidebarProvider } from "@/components/Layout/RightSidebarContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import OrganizationSetup from "./pages/OrganizationSetup";
import ClientsOverview from "./pages/ClientsOverview";
import ClientDetail from "./pages/ClientDetail";
import ClientAdmin from "./pages/ClientAdmin";
import UserAdmin from "./pages/UserAdmin";
import UserProfile from "./pages/UserProfile";
import OrganizationSettings from "./pages/OrganizationSettings";
import OrganizationOverview from "./pages/OrganizationOverview";
import TeamManagement from "./pages/TeamManagement";
import DepartmentView from "./pages/DepartmentView";
import Communication from "./pages/Communication";
import Collaboration from "./pages/Collaboration";
import Training from "./pages/Training";
import NavigationDashboard from "./pages/NavigationDashboard";
import LedgerPage from "./pages/LedgerPage";
import AccountingData from "./pages/AccountingData";
import DataImport from "./pages/DataImport";
import PDFDocuments from "./pages/PDFDocuments";
import AuditLogs from "./pages/AuditLogs";
import AIUsage from "./pages/AIUsage";
import KnowledgeBase from "./pages/KnowledgeBase";
import AIRevyAdmin from "./pages/AIRevyAdmin";
import StandardAccountsAdmin from "./pages/StandardAccountsAdmin";
import RoleAccessAdmin from "./pages/RoleAccessAdmin";
import PerformanceMonitoring from "./pages/PerformanceMonitoring";
import Academy from "./pages/Academy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DataCacheProvider>
          <AIGlobalProvider>
            <AuthProvider>
              <BrowserRouter>
                <RevyContextProvider>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/setup" element={<OrganizationSetup />} />
                <Route path="/" element={<RightSidebarProvider><AppLayout /></RightSidebarProvider>}>
                  <Route index element={<Index />} />
                  <Route path="dashboard" element={<NavigationDashboard />} />
                  <Route path="clients" element={<ClientsOverview />} />
                  <Route path="klienter" element={<ClientsOverview />} />
                  <Route path="clients/:id" element={<ClientDetail />} />
                  <Route path="klienter/:orgNumber" element={<ClientDetail />} />
                  <Route path="klienter/:orgNumber/regnskap" element={<AccountingData />} />
                  <Route path="klienter/:orgNumber/analyser" element={<ClientDetail />} />
                  <Route path="klienter/:orgNumber/regnskapsdata" element={<DataImport />} />
                  <Route path="klienter/:orgNumber/grunnlagsdata" element={<DataImport />} />
                  <Route path="klienter/:orgNumber/spesialdata" element={<DataImport />} />
                  <Route path="klienter/:orgNumber/transaksjoner" element={<DataImport />} />
                  <Route path="klienter/:orgNumber/import" element={<DataImport />} />
                  <Route path="client-admin" element={<ClientAdmin />} />
                  <Route path="user-admin" element={<UserAdmin />} />
                  <Route path="profile" element={<UserProfile />} />
                  <Route path="organization/settings" element={<OrganizationSettings />} />
                  <Route path="organization/roles" element={<RoleAccessAdmin />} />
                  <Route path="organization" element={<OrganizationOverview />} />
                  <Route path="teams" element={<TeamManagement />} />
                  <Route path="departments/:id" element={<DepartmentView />} />
                  <Route path="communication" element={<Communication />} />
                  <Route path="collaboration" element={<Collaboration />} />
                  <Route path="training" element={<Training />} />
                  <Route path="ledger" element={<LedgerPage />} />
                  <Route path="accounting" element={<AccountingData />} />
                  <Route path="data-import" element={<DataImport />} />
                  <Route path="documents" element={<PDFDocuments />} />
                  <Route path="audit-logs" element={<AuditLogs />} />
                  <Route path="ai-usage" element={<AIUsage />} />
                  <Route path="standard-accounts" element={<StandardAccountsAdmin />} />
                  <Route path="fag/*" element={<KnowledgeBase />} />
                  <Route path="academy" element={<Academy />} />
                  <Route path="ai-revy-admin" element={<AIRevyAdmin />} />
                  <Route path="performance" element={<PerformanceMonitoring />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
                <Toaster />
              </RevyContextProvider>
            </BrowserRouter>
          </AuthProvider>
        </AIGlobalProvider>
      </DataCacheProvider>
    </TooltipProvider>
  </QueryClientProvider>
);
}

export default App;
