
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import AppLayout from "./components/Layout/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NavigationDashboard from "./pages/NavigationDashboard";
import ClientsOverview from "./pages/ClientsOverview";
import ClientDetail from "./pages/ClientDetail";
import ClientAdmin from "./pages/ClientAdmin";
import Communication from "./pages/Communication";
import AccountingData from "./pages/AccountingData";
import DataImport from "./pages/DataImport";
import PDFDocuments from "./pages/PDFDocuments";
import KnowledgeBase from "./pages/KnowledgeBase";
import Training from "./pages/Training";
import TeamManagement from "./pages/TeamManagement";
import OrganizationOverview from "./pages/OrganizationOverview";
import OrganizationSettings from "./pages/OrganizationSettings";
import OrganizationSetup from "./pages/OrganizationSetup";
import UserAdmin from "./pages/UserAdmin";
import UserProfile from "./pages/UserProfile";
import AuditLogs from "./pages/AuditLogs";
import AIUsage from "./pages/AIUsage";
import Collaboration from "./pages/Collaboration";
import DepartmentView from "./pages/DepartmentView";
import LedgerPage from "./pages/LedgerPage";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./components/Auth/AuthProvider";
import { RevyContextProvider } from "./components/RevyContext/RevyContextProvider";
import OnboardingCheck from "./components/Layout/OnboardingCheck";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <RevyContextProvider>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route 
                  path="/*" 
                  element={
                    <OnboardingCheck>
                      <AppLayout>
                        <Routes>
                          <Route path="/dashboard" element={<NavigationDashboard />} />
                          <Route path="/clients" element={<ClientsOverview />} />
                          <Route path="/klienter" element={<ClientsOverview />} />
                          <Route path="/klienter/:orgNumber/*" element={<ClientDetail />} />
                          <Route path="/client-admin" element={<ClientAdmin />} />
                          <Route path="/communication" element={<Communication />} />
                          <Route path="/collaboration" element={<Collaboration />} />
                          <Route path="/accounting-data" element={<AccountingData />} />
                          <Route path="/data-import" element={<DataImport />} />
                          <Route path="/pdf-documents" element={<PDFDocuments />} />
                          <Route path="/knowledge/*" element={<KnowledgeBase />} />
                          <Route path="/fag/*" element={<KnowledgeBase />} />
                          <Route path="/training" element={<Training />} />
                          <Route path="/teams" element={<TeamManagement />} />
                          <Route path="/organization" element={<OrganizationOverview />} />
                          <Route path="/organization-settings" element={<OrganizationSettings />} />
                          <Route path="/organization-setup" element={<OrganizationSetup />} />
                          <Route path="/user-admin" element={<UserAdmin />} />
                          <Route path="/user-profile" element={<UserProfile />} />
                          <Route path="/audit-logs" element={<AuditLogs />} />
                          <Route path="/ai-usage" element={<AIUsage />} />
                          <Route path="/departments/:departmentId" element={<DepartmentView />} />
                          <Route path="/ledger/:clientId" element={<LedgerPage />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </AppLayout>
                    </OnboardingCheck>
                  } 
                />
              </Routes>
            </RevyContextProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
