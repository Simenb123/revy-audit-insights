
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/Auth/AuthProvider";
import { RevyContextProvider } from "@/components/RevyContext/RevyContextProvider";
import AppLayout from "@/components/Layout/AppLayout";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            <RevyContextProvider>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/setup" element={<OrganizationSetup />} />
                <Route path="/" element={<AppLayout><Index /></AppLayout>} />
                <Route path="/dashboard" element={<AppLayout><NavigationDashboard /></AppLayout>} />
                <Route path="/clients" element={<AppLayout><ClientsOverview /></AppLayout>} />
                <Route path="/klienter" element={<AppLayout><ClientsOverview /></AppLayout>} />
                <Route path="/clients/:id" element={<AppLayout><ClientDetail /></AppLayout>} />
                <Route path="/klienter/:orgNumber" element={<AppLayout><ClientDetail /></AppLayout>} />
                <Route path="/client-admin" element={<AppLayout><ClientAdmin /></AppLayout>} />
                <Route path="/user-admin" element={<AppLayout><UserAdmin /></AppLayout>} />
                <Route path="/profile" element={<AppLayout><UserProfile /></AppLayout>} />
                <Route path="/organization/settings" element={<AppLayout><OrganizationSettings /></AppLayout>} />
                <Route path="/organization" element={<AppLayout><OrganizationOverview /></AppLayout>} />
                <Route path="/teams" element={<AppLayout><TeamManagement /></AppLayout>} />
                <Route path="/departments/:id" element={<AppLayout><DepartmentView /></AppLayout>} />
                <Route path="/communication" element={<AppLayout><Communication /></AppLayout>} />
                <Route path="/collaboration" element={<AppLayout><Collaboration /></AppLayout>} />
                <Route path="/training" element={<AppLayout><Training /></AppLayout>} />
                <Route path="/ledger" element={<AppLayout><LedgerPage /></AppLayout>} />
                <Route path="/accounting" element={<AppLayout><AccountingData /></AppLayout>} />
                <Route path="/data-import" element={<AppLayout><DataImport /></AppLayout>} />
                <Route path="/documents" element={<AppLayout><PDFDocuments /></AppLayout>} />
                <Route path="/audit-logs" element={<AppLayout><AuditLogs /></AppLayout>} />
                <Route path="/ai-usage" element={<AppLayout><AIUsage /></AppLayout>} />
                <Route path="/fag/*" element={<AppLayout><KnowledgeBase /></AppLayout>} />
                <Route path="/ai-revy-admin" element={<AppLayout><AIRevyAdmin /></AppLayout>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </RevyContextProvider>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
