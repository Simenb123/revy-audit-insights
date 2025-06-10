import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./components/Auth/AuthProvider";
import { RevyContextProvider } from "./components/RevyContext/RevyContextProvider";

import OnboardingCheck from "./components/Layout/OnboardingCheck";
import AppLayout from "./components/Layout/AppLayout";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ClientsOverview from "./pages/ClientsOverview";
import ClientDetail from "./pages/ClientDetail";
import ClientAdmin from "./pages/ClientAdmin";
import LedgerPage from "./pages/LedgerPage";
import AccountingData from "./pages/AccountingData";
import DataImport from "./pages/DataImport";
import KnowledgeBase from "./pages/KnowledgeBase";
import OrganizationOverview from "./pages/OrganizationOverview";
import OrganizationSetup from "./pages/OrganizationSetup";
import OrganizationSettings from "./pages/OrganizationSettings";
import DepartmentView from "./pages/DepartmentView";
import TeamManagement from "./pages/TeamManagement";
import Communication from "./pages/Communication";
import UserAdmin from "./pages/UserAdmin";
import AuditLogs from "./pages/AuditLogs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RevyContextProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/organisasjon/oppsett" element={<OrganizationSetup />} />
              
              {/* Protected routes */}
              <Route path="/*" element={
                <OnboardingCheck>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Index />} />
                      
                      {/* Organization routes */}
                      <Route path="/organisasjon" element={<OrganizationOverview />} />
                      <Route path="/avdeling" element={<DepartmentView />} />
                      <Route path="/team" element={<TeamManagement />} />
                      <Route path="/kommunikasjon" element={<Communication />} />
                      <Route path="/brukeradministrasjon" element={<UserAdmin />} />
                      <Route path="/organisasjonsinnstillinger" element={<OrganizationSettings />} />
                      <Route path="/revisjonslogger" element={<AuditLogs />} />
                      
                      {/* Client routes */}
                      <Route path="/klienter" element={<ClientsOverview />} />
                      <Route path="/klienter/admin" element={<ClientAdmin />} />
                      <Route path="/klienter/:orgNumber" element={<ClientDetail />} />
                      <Route path="/klienter/:orgNumber/regnskap" element={<LedgerPage />} />
                      <Route path="/klienter/:orgNumber/regnskapsdata" element={<AccountingData />} />
                      <Route path="/klienter/:orgNumber/import" element={<DataImport />} />
                      
                      {/* Other routes */}
                      <Route path="/fag" element={<KnowledgeBase />} />
                      
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </OnboardingCheck>
              } />
            </Routes>
          </RevyContextProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
