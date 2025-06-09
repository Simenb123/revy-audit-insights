
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./components/Auth/AuthProvider";
import { useAuth } from "./components/Auth/AuthProvider";
import AppLayout from "./components/Layout/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ClientsOverview from "./pages/ClientsOverview";
import NotFound from "./pages/NotFound";
import { RevyContextProvider } from "./components/RevyContext/RevyContextProvider";
import AccountingExplorer from "./components/DataAnalysis/AccountingExplorer";
import TransactionSampling from "./components/DataAnalysis/TransactionSampling";
import ClientAdmin from "./pages/ClientAdmin";
import DataImport from "./pages/DataImport";
import ClientDetail from "./pages/ClientDetail";
import LedgerPage from "./pages/LedgerPage";
import AccountingData from "./pages/AccountingData";
import KnowledgeBase from "./pages/KnowledgeBase";
import OrganizationOverview from "./pages/OrganizationOverview";
import DepartmentView from "./pages/DepartmentView";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <RevyContextProvider>
            <BrowserRouter>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* Dashboard route */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Index />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                {/* Organization routes */}
                <Route path="/organisasjon" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <OrganizationOverview />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/avdeling" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <DepartmentView />
                    </AppLayout>
                  </ProtectedRoute>
                } />

                {/* Client routes */}
                <Route path="/klienter" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ClientsOverview />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/klienter/:orgNumber" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ClientDetail />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                
                {/* Data upload routes */}
                <Route path="/klienter/:orgNumber/regnskapsdata" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <DataImport />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/klienter/:orgNumber/grunnlagsdata" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <DataImport />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/klienter/:orgNumber/spesialdata" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <DataImport />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/klienter/:orgNumber/transaksjoner" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <DataImport />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/klienter/:orgNumber/import" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <DataImport />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                
                {/* Keep existing routes */}
                <Route path="/klienter/:orgNumber/regnskap" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <LedgerPage />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/fag/*" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <KnowledgeBase />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/analyser" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <AccountingExplorer />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/analyser/transaksjoner" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <TransactionSampling />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/dokumenter" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Index />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/prosjekter" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Index />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/innstillinger" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Index />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/hjelp" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Index />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/regnskap" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Index />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/klienter/administrasjon" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ClientAdmin />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/data-import" element={
                  <ProtectedRoute>
                    <AppLayout>
                      <DataImport />
                    </AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </RevyContextProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
