
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/Layout/ScrollToTop";
import { AuthProvider } from "@/components/Auth/AuthProvider";
import { RevyContextProvider } from "@/components/RevyContext/RevyContextProvider";
import { AIGlobalProvider } from "@/components/AI/AIGlobalProvider";
import { DataCacheProvider } from "@/components/Optimization/DataCache";
import { FiscalYearProvider } from "@/contexts/FiscalYearContext";
import AppLayout from "@/components/Layout/AppLayout";
import { RightSidebarProvider } from "@/components/Layout/RightSidebarContext";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
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
import AccountRelationshipsPage from "./pages/Admin/AccountRelationships";
import AuditActionLibrary from "./pages/Admin/AuditActionLibrary";
import GeneralLedgerUpload from "./pages/GeneralLedgerUpload";
import TrialBalanceUpload from "./pages/TrialBalanceUpload";
import AnalysisPage from "./pages/AnalysisPage";
import NotFound from "./pages/NotFound";
import LegacyClientRedirect from "./components/Layout/LegacyClientRedirect";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DataCacheProvider>
          <AIGlobalProvider>
            <AuthProvider>
              <FiscalYearProvider>
                <BrowserRouter>
                  <ScrollToTop />
                  <RevyContextProvider>
                <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/setup" element={<OrganizationSetup />} />
                <Route path="/" element={<RightSidebarProvider><AppLayout /></RightSidebarProvider>}>
                  <Route index element={<ProtectedRoute><Index /></ProtectedRoute>} />
                  <Route path="dashboard" element={<ProtectedRoute><NavigationDashboard /></ProtectedRoute>} />
                  <Route path="clients" element={<ProtectedRoute><ClientsOverview /></ProtectedRoute>} />
                  <Route path="clients/:clientId" element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />
                  <Route path="clients/:clientId/dashboard" element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />
                  <Route path="clients/:clientId/:phase" element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />
                  <Route path="clients/:clientId/trial-balance" element={<ProtectedRoute><TrialBalanceUpload /></ProtectedRoute>} />
                  <Route path="clients/:clientId/general-ledger" element={<ProtectedRoute><GeneralLedgerUpload /></ProtectedRoute>} />
                  <Route path="clients/:clientId/analysis" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
                  
                  {/* Legacy routes for backward compatibility */}
                  <Route path="klienter" element={<ProtectedRoute><ClientsOverview /></ProtectedRoute>} />
                  <Route path="klienter/:orgNumber" element={<LegacyClientRedirect />} />
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
                  
                  <Route path="accounting" element={<AccountingData />} />
                  <Route path="data-import" element={<DataImport />} />
                  <Route path="documents" element={<PDFDocuments />} />
                  <Route path="audit-logs" element={<AuditLogs />} />
                  <Route path="ai-usage" element={<AIUsage />} />
                  <Route path="standard-accounts" element={<StandardAccountsAdmin />} />
                  <Route path="admin/account-relationships" element={<AccountRelationshipsPage />} />
                  <Route path="admin/audit-action-library" element={<AuditActionLibrary />} />
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
          </FiscalYearProvider>
        </AuthProvider>
      </AIGlobalProvider>
    </DataCacheProvider>
  </TooltipProvider>
</QueryClientProvider>
);
}

export default App;
