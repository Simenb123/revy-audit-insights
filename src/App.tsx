
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import ScrollToTop from "@/components/Layout/ScrollToTop";
import { AuthProvider } from "@/components/Auth/AuthProvider";
import { RevyContextProvider } from "@/components/RevyContext/RevyContextProvider";
import { AIGlobalProvider } from "@/components/AI/AIGlobalProvider";
import { DataCacheProvider } from "@/components/Optimization/DataCache";
import { SmartLoadingProvider } from "@/components/Optimization/SmartLoadingManager";
import { WidgetManagerProvider } from "@/contexts/WidgetManagerContext";
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
import ClientDocuments from "./pages/ClientDocuments";
import NotFound from "./pages/NotFound";
import ClientRedirect from "./components/Layout/ClientRedirect";
import { ClientHistoryTracker } from "./components/Layout/ClientHistoryTracker";
import Sandbox from "./pages/Sandbox";
import Revisorskolen from "./pages/Revisorskolen";
import ResourcePlanner from "./pages/ResourcePlanner";
import AllocationImport from "./pages/AllocationImport";
import Superadmin from "./pages/Superadmin";
import AdminPage from "./pages/Admin";
// Import SaftUpload page that contains the SAF-T upload interface
import SaftUpload from "./pages/SaftUpload";
import SaftImport from "@/components/DataUpload/SaftImport";
import UploadHistory from "./pages/UploadHistory";
import LegacyUploadHistoryRedirect from "./pages/LegacyUploadHistoryRedirect";
import Reports from "./pages/Reports";
import KeyFigureManager from "./pages/KeyFigureManager";
import Regnskapsdata from "./pages/Regnskapsdata";
import PayrollUpload from "./pages/PayrollUpload";
import PayrollOverview from "./pages/PayrollOverview";
import PayrollA07 from "./pages/PayrollA07";
import PayrollReconciliation from "./pages/PayrollReconciliation";
import PayrollAnalysis from "./pages/PayrollAnalysis";
import InvestmentOverview from "./pages/InvestmentOverview";
import InvestmentSecurities from "./pages/InvestmentSecurities";
import InvestmentTransactions from "./pages/InvestmentTransactions";
import InvestmentPrices from "./pages/InvestmentPrices";
import CurrencyManagement from "./pages/CurrencyManagement";
import InvestmentPortfolios from "./pages/InvestmentPortfolios";
import BookkeepingJournal from "./pages/BookkeepingJournal";
import BookkeepingReports from "./pages/BookkeepingReports";
import AssetManagement from "./pages/AssetManagement";
import BudgetManagement from "./pages/BudgetManagement";
import ReportsManagement from "./pages/ReportsManagement";
import TransactionAnalysis from "./pages/TransactionAnalysis";
import AuditSampling from "./pages/AuditSampling";
import { InvestmentSecuritiesRedirect, InvestmentPricesRedirect, InvestmentCurrenciesRedirect } from "./components/InvestmentRedirects";
import DataredigeringPage from "./pages/Dataredigering";
import LegalRelationsAdmin from "./components/Knowledge/admin/LegalRelationsAdmin";
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SmartLoadingProvider>
          <DataCacheProvider>
            <WidgetManagerProvider clientId="default" year={new Date().getFullYear()}>
              <AIGlobalProvider>
                <AuthProvider>
                  <FiscalYearProvider>
                <BrowserRouter>
                  <ScrollToTop />
                  <ClientHistoryTracker />
                  <RevyContextProvider>
                <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/setup" element={<OrganizationSetup />} />
                <Route path="/" element={<RightSidebarProvider><AppLayout /></RightSidebarProvider>}>
                  <Route index element={<ProtectedRoute><Index /></ProtectedRoute>} />
                  <Route path="dashboard" element={<ProtectedRoute><NavigationDashboard /></ProtectedRoute>} />
                  <Route path="clients" element={<ProtectedRoute><ClientsOverview /></ProtectedRoute>} />
                  <Route path="clients/:clientId" element={<ProtectedRoute><ClientRedirect /></ProtectedRoute>} />
                  <Route path="clients/:clientId/dashboard" element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />
                  <Route path="clients/:clientId/:phase" element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />
                  <Route path="clients/:clientId/trial-balance" element={<ProtectedRoute><TrialBalanceUpload /></ProtectedRoute>} />
                  <Route path="clients/:clientId/general-ledger" element={<ProtectedRoute><GeneralLedgerUpload /></ProtectedRoute>} />
                  <Route path="clients/:clientId/saft" element={<ProtectedRoute><SaftUpload /></ProtectedRoute>} />
                  <Route path="clients/:clientId/payroll" element={<ProtectedRoute><PayrollOverview /></ProtectedRoute>} />
                  <Route path="clients/:clientId/payroll/a07" element={<ProtectedRoute><PayrollA07 /></ProtectedRoute>} />
                  <Route path="clients/:clientId/payroll/analysis" element={<ProtectedRoute><PayrollAnalysis /></ProtectedRoute>} />
                  <Route path="clients/:clientId/payroll/upload" element={<ProtectedRoute><PayrollUpload /></ProtectedRoute>} />
                  <Route path="clients/:clientId/payroll/kontrolloppstilling" element={<ProtectedRoute><PayrollReconciliation /></ProtectedRoute>} />
                  <Route path="clients/:clientId/investments/overview" element={<ProtectedRoute><InvestmentOverview /></ProtectedRoute>} />
                   <Route path="clients/:clientId/investments/portfolios" element={<ProtectedRoute><InvestmentPortfolios /></ProtectedRoute>} />
                   <Route path="clients/:clientId/investments/transactions" element={<ProtectedRoute><InvestmentTransactions /></ProtectedRoute>} />
                   
                   {/* Redirects for old client-specific investment routes */}
                   <Route path="clients/:clientId/investments/securities" element={<InvestmentSecuritiesRedirect />} />
                   <Route path="clients/:clientId/investments/prices" element={<InvestmentPricesRedirect />} />
                   <Route path="clients/:clientId/investments/currencies" element={<InvestmentCurrenciesRedirect />} />
                   
                   {/* Global Resources */}
                   <Route path="resources/currencies" element={<ProtectedRoute><CurrencyManagement /></ProtectedRoute>} />
                   <Route path="resources/securities/prices" element={<ProtectedRoute><InvestmentPrices /></ProtectedRoute>} />
                   <Route path="resources/securities/catalog" element={<ProtectedRoute><InvestmentSecurities /></ProtectedRoute>} />
                   <Route path="resources/dataredigering" element={<ProtectedRoute><DataredigeringPage /></ProtectedRoute>} />
                   <Route path="clients/:clientId/bookkeeping-journal" element={<ProtectedRoute><BookkeepingJournal /></ProtectedRoute>} />
                   <Route path="clients/:clientId/bookkeeping-reports" element={<ProtectedRoute><BookkeepingReports /></ProtectedRoute>} />
                   <Route path="clients/:clientId/assets" element={<ProtectedRoute><AssetManagement /></ProtectedRoute>} />
                   <Route path="clients/:clientId/budget" element={<ProtectedRoute><BudgetManagement /></ProtectedRoute>} />
                   <Route path="clients/:clientId/reports" element={<ProtectedRoute><ReportsManagement /></ProtectedRoute>} />
                    <Route path="clients/:clientId/analysis" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
                    <Route path="clients/:clientId/audit/sampling" element={<ProtectedRoute><AuditSampling /></ProtectedRoute>} />
                    <Route path="clients/:clientId/transaction-analysis" element={<ProtectedRoute><TransactionAnalysis /></ProtectedRoute>} />
                  <Route path="clients/:clientId/regnskapsdata" element={<ProtectedRoute><Regnskapsdata /></ProtectedRoute>} />
                  <Route path="clients/:clientId/documents" element={<ProtectedRoute><ClientDocuments /></ProtectedRoute>} />
                  <Route path="clients/:clientId/upload-history" element={<ProtectedRoute><UploadHistory /></ProtectedRoute>} />
                  
                  {/* Legacy routes for backward compatibility */}
                  <Route path="klienter" element={<ProtectedRoute><ClientsOverview /></ProtectedRoute>} />
                  <Route path="klienter/:orgNumber" element={<ClientRedirect />} />
                  <Route path="klienter/:orgNumber/saft" element={<ProtectedRoute><SaftImport /></ProtectedRoute>} />
                  <Route path="klienter/:orgNumber/upload-historikk" element={<ProtectedRoute><LegacyUploadHistoryRedirect /></ProtectedRoute>} />
                  <Route path="client-admin" element={<ClientAdmin />} />
                  <Route path="user-admin" element={<ProtectedRoute><UserAdmin /></ProtectedRoute>} />
                  <Route path="profile" element={<UserProfile />} />
                  <Route path="organization/settings" element={<OrganizationSettings />} />
                  <Route path="organization/roles" element={<RoleAccessAdmin />} />
                  <Route path="organization" element={<OrganizationOverview />} />
                  <Route path="teams" element={<TeamManagement />} />
                  <Route path="departments/:id" element={<DepartmentView />} />
                  <Route path="communication" element={<Communication />} />
                  <Route path="collaboration" element={<Collaboration />} />
                  <Route path="training" element={<Training />} />
                  <Route path="revisorskolen" element={<ProtectedRoute><Revisorskolen /></ProtectedRoute>} />
                  
                  <Route path="accounting" element={<AccountingData />} />
                  <Route path="documents" element={<PDFDocuments />} />
                  <Route path="audit-logs" element={<AuditLogs />} />
                  <Route path="ai-usage" element={<AIUsage />} />
                  <Route path="standard-accounts" element={<StandardAccountsAdmin />} />
                  <Route path="admin/account-relationships" element={<AccountRelationshipsPage />} />
                  <Route path="admin/audit-action-library" element={<AuditActionLibrary />} />
                  <Route path="fag/*" element={<KnowledgeBase />} />
                  <Route path="admin/rag/juridisk" element={<ProtectedRoute><LegalRelationsAdmin /></ProtectedRoute>} />
                  <Route path="academy" element={<Academy />} />
                  <Route path="ai-revy-admin" element={<AIRevyAdmin />} />
                  <Route path="admin/*" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
                  <Route path="superadmin" element={<ProtectedRoute><Superadmin /></ProtectedRoute>} />
                  <Route path="performance" element={<PerformanceMonitoring />} />
                  <Route path="resource-planner" element={<ProtectedRoute><ResourcePlanner /></ProtectedRoute>} />
                  <Route path="allocation-import" element={<ProtectedRoute><AllocationImport /></ProtectedRoute>} />
                   <Route path="sandbox" element={<ProtectedRoute><Sandbox /></ProtectedRoute>} />
                   <Route path="reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                   <Route path="key-figures" element={<ProtectedRoute><KeyFigureManager /></ProtectedRoute>} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
              {import.meta.env.DEV && (
                <Link
                  to="/sandbox"
                  className="fixed bottom-3 right-3 z-50 rounded-md border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm hover:text-foreground hover:shadow-md transition-colors"
                  aria-label="Åpne Sandbox for MappingCombobox"
                >
                  Sandbox
                </Link>
              )}
                <Toaster />
              </RevyContextProvider>
            </BrowserRouter>
                  </FiscalYearProvider>
                </AuthProvider>
              </AIGlobalProvider>
            </WidgetManagerProvider>
          </DataCacheProvider>
        </SmartLoadingProvider>
      </TooltipProvider>
    </QueryClientProvider>
);
}

export default App;
